import { createHash, randomUUID } from "node:crypto";

import { AcquisitionEntitlementConsumedError } from "./commerce";
import {
  AcquisitionDeliveryConfigurationError,
  AcquisitionDeliveryProviderError,
  AcquisitionDeliveryService,
  AcquisitionReportNotReadyError,
  normalizeAcquisitionRecipient,
} from "./delivery";
import {
  isAuthorizedAcquisitionRequest,
  MIN_ACQUISITION_API_SECRET_CHARACTERS,
} from "./http";
import {
  AcquisitionIdempotencyConflictError,
  AcquisitionIdempotencyInProgressError,
} from "./idempotency";
import type { AcquisitionRateLimiter } from "./rate-limit";
import {
  AcquisitionOrchestrationValidationError,
  validateAcquisitionCommandIdentity,
} from "./orchestration-validator";

const MAX_DELIVERY_REQUEST_BYTES = 16_384;

export interface AcquisitionDeliveryHttpDependencies {
  apiSecret: string | undefined;
  deliveryService: AcquisitionDeliveryService;
  rateLimiter?: AcquisitionRateLimiter;
  requestIdFactory?: () => string;
  logError?: (message: string, context: Record<string, unknown>) => void;
}

function json(requestId: string, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
    },
  });
}

function validOrderId(value: string) {
  return /^[A-Za-z0-9-]{8,128}$/.test(value);
}

function validReportId(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(value);
}

export async function handleAcquisitionDeliveryRequest(
  request: Request,
  orderId: string,
  dependencies: AcquisitionDeliveryHttpDependencies,
) {
  const requestId = (dependencies.requestIdFactory ?? randomUUID)();
  const apiSecret = dependencies.apiSecret;
  const configured = Boolean(
    apiSecret && apiSecret.length >= MIN_ACQUISITION_API_SECRET_CHARACTERS,
  );
  if (
    !configured ||
    !isAuthorizedAcquisitionRequest(
      request.headers.get("authorization"),
      apiSecret!,
    )
  ) {
    return json(requestId, configured ? 401 : 503, {
      ok: false,
      error: {
        code: configured ? "unauthorized" : "service_unavailable",
        message: configured
          ? "Authentication is required."
          : "Acquisition Lens is not configured.",
      },
    });
  }
  if (!validOrderId(orderId)) {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid order ID is required." },
    });
  }
  const reportId = request.headers.get("x-acquisition-report-id") ?? "";
  if (!validReportId(reportId)) {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid report ID is required." },
    });
  }
  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  try {
    validateAcquisitionCommandIdentity(requestId, idempotencyKey);
  } catch (error) {
    return json(requestId, 400, {
      ok: false,
      error: {
        code: "invalid_request",
        message: error instanceof Error ? error.message : "The request is invalid.",
      },
    });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json(requestId, 415, {
      ok: false,
      error: { code: "invalid_content_type", message: "Content-Type must be application/json." },
    });
  }
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_DELIVERY_REQUEST_BYTES) {
    return json(requestId, 413, {
      ok: false,
      error: { code: "payload_too_large", message: "The request body is too large." },
    });
  }
  const bodyText = await request.text();
  if (new TextEncoder().encode(bodyText).byteLength > MAX_DELIVERY_REQUEST_BYTES) {
    return json(requestId, 413, {
      ok: false,
      error: { code: "payload_too_large", message: "The request body is too large." },
    });
  }
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_json", message: "The request body must contain valid JSON." },
    });
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof (body as Record<string, unknown>).email !== "string"
  ) {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid delivery email is required." },
    });
  }
  let recipient: string;
  try {
    recipient = normalizeAcquisitionRecipient((body as { email: string }).email);
  } catch {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid delivery email is required." },
    });
  }

  if (dependencies.rateLimiter) {
    try {
      const rate = await dependencies.rateLimiter.check(
        "deliver",
        createHash("sha256").update(apiSecret!).digest("base64url"),
      );
      if (!rate.allowed) {
        return json(requestId, 429, {
          ok: false,
          error: { code: "rate_limited", message: "Too many delivery requests. Retry shortly." },
        });
      }
    } catch {
      return json(requestId, 503, {
        ok: false,
        error: { code: "service_unavailable", message: "Delivery is temporarily unavailable." },
      });
    }
  }

  try {
    const delivery = await dependencies.deliveryService.deliver({
      orderId,
      reportId,
      recipient,
      idempotencyKey,
    });
    return json(requestId, 200, {
      ok: true,
      result: { ...delivery.value, replayed: delivery.replayed },
    });
  } catch (error) {
    if (error instanceof AcquisitionReportNotReadyError) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "report_not_ready", message: "The report is not ready for delivery." },
      });
    }
    if (
      error instanceof AcquisitionEntitlementConsumedError ||
      error instanceof AcquisitionIdempotencyConflictError
    ) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "delivery_conflict", message: "This delivery request conflicts with the report entitlement." },
      });
    }
    if (error instanceof AcquisitionIdempotencyInProgressError) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "delivery_in_progress", message: "The original delivery request is still processing." },
      });
    }
    if (
      error instanceof AcquisitionDeliveryConfigurationError ||
      error instanceof AcquisitionDeliveryProviderError
    ) {
      return json(requestId, 503, {
        ok: false,
        error: { code: "delivery_unavailable", message: "Delivery is temporarily unavailable." },
      });
    }
    (dependencies.logError ?? ((message, context) => console.error(message, context)))(
      "Acquisition Lens delivery failure",
      { requestId, errorName: error instanceof Error ? error.name : "UnknownError" },
    );
    return json(requestId, 503, {
      ok: false,
      error: { code: "delivery_unavailable", message: "Delivery is temporarily unavailable." },
    });
  }
}
