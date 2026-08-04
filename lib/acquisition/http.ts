import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import type {
  AcquisitionApiErrorCode,
  AcquisitionApiErrorResponse,
  AcquisitionApiSuccessResponse,
} from "./orchestration-contract";
import type { AcquisitionOrchestrator } from "./orchestration";
import { AcquisitionOrchestrationStageError } from "./orchestration";
import { AcquisitionIdempotencyConflictError } from "./idempotency";
import {
  AcquisitionOrchestrationValidationError,
  parseAcquisitionOrchestrationPayload,
  validateAcquisitionCommandIdentity,
} from "./orchestration-validator";

export const MAX_ACQUISITION_REQUEST_BYTES = 1_000_000;
export const MIN_ACQUISITION_API_SECRET_CHARACTERS = 32;

export interface AcquisitionApiDependencies {
  apiSecret: string | undefined;
  getOrchestrator: () => AcquisitionOrchestrator;
  requestIdFactory?: () => string;
  logError?: (message: string, context: Record<string, unknown>) => void;
}

function responseHeaders(requestId: string) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": requestId,
  };
}

function jsonResponse(
  body: AcquisitionApiErrorResponse | AcquisitionApiSuccessResponse,
  status: number,
  requestId: string,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(requestId),
  });
}

function errorResponse(
  requestId: string,
  status: number,
  code: AcquisitionApiErrorCode,
  message: string,
) {
  return jsonResponse(
    { ok: false, requestId, error: { code, message } },
    status,
    requestId,
  );
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function isAuthorizedAcquisitionRequest(
  authorizationHeader: string | null,
  expectedSecret: string,
) {
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const supplied = authorizationHeader.slice("Bearer ".length);
  if (supplied.length === 0) return false;
  return timingSafeEqual(digest(supplied), digest(expectedSecret));
}

function resolveRequestId(request: Request, factory: () => string) {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(supplied)
    ? supplied
    : factory();
}

export async function handleAcquisitionApiRequest(
  request: Request,
  {
    apiSecret,
    getOrchestrator,
    requestIdFactory = randomUUID,
    logError = (message, context) => console.error(message, context),
  }: AcquisitionApiDependencies,
) {
  const requestId = resolveRequestId(request, requestIdFactory);

  if (
    !apiSecret ||
    apiSecret.length < MIN_ACQUISITION_API_SECRET_CHARACTERS
  ) {
    return errorResponse(
      requestId,
      503,
      "service_unavailable",
      "Acquisition Lens is not configured.",
    );
  }
  if (
    !isAuthorizedAcquisitionRequest(
      request.headers.get("authorization"),
      apiSecret,
    )
  ) {
    return errorResponse(
      requestId,
      401,
      "unauthorized",
      "Authentication is required.",
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return errorResponse(
      requestId,
      415,
      "invalid_content_type",
      "Content-Type must be application/json.",
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_ACQUISITION_REQUEST_BYTES
  ) {
    return errorResponse(
      requestId,
      413,
      "payload_too_large",
      "The request body is too large.",
    );
  }

  const bodyText = await request.text();
  if (
    new TextEncoder().encode(bodyText).byteLength >
    MAX_ACQUISITION_REQUEST_BYTES
  ) {
    return errorResponse(
      requestId,
      413,
      "payload_too_large",
      "The request body is too large.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(
      requestId,
      400,
      "invalid_json",
      "The request body must contain valid JSON.",
    );
  }

  let payload;
  try {
    payload = parseAcquisitionOrchestrationPayload(body);
  } catch (error) {
    return errorResponse(
      requestId,
      400,
      "invalid_request",
      error instanceof Error ? error.message : "The request is invalid.",
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  try {
    validateAcquisitionCommandIdentity(requestId, idempotencyKey);
  } catch (error) {
    return errorResponse(
      requestId,
      400,
      "invalid_request",
      error instanceof Error ? error.message : "The request is invalid.",
    );
  }

  let orchestrator: AcquisitionOrchestrator;
  try {
    orchestrator = getOrchestrator();
  } catch (error) {
    logError("Acquisition Lens configuration failure", {
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      requestId,
      503,
      "service_unavailable",
      "Acquisition Lens is temporarily unavailable.",
    );
  }

  try {
    const result = await orchestrator.run({
      requestId,
      idempotencyKey,
      payload,
    });
    return jsonResponse({ ok: true, result }, 200, requestId);
  } catch (error) {
    if (error instanceof AcquisitionOrchestrationValidationError) {
      return errorResponse(
        requestId,
        400,
        "invalid_request",
        error.message,
      );
    }
    if (error instanceof AcquisitionIdempotencyConflictError) {
      return errorResponse(
        requestId,
        409,
        "idempotency_conflict",
        "The Idempotency-Key was already used for a different request.",
      );
    }
    if (
      error instanceof AcquisitionOrchestrationStageError &&
      error.stage === "reasoning"
    ) {
      logError("Acquisition Lens reasoning failure", {
        requestId,
        stage: error.stage,
        errorName:
          error.cause instanceof Error ? error.cause.name : "UnknownError",
      });
      return errorResponse(
        requestId,
        502,
        "reasoning_unavailable",
        "The analysis could not be completed. The request may be retried.",
      );
    }

    logError("Acquisition Lens orchestration failure", {
      requestId,
      stage:
        error instanceof AcquisitionOrchestrationStageError
          ? error.stage
          : "unknown",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      requestId,
      500,
      "internal_error",
      "The analysis could not be completed.",
    );
  }
}
