import { createHash, randomUUID } from "node:crypto";

import {
  AcquisitionEntitlementConsumedError,
  AcquisitionOrderConflictError,
  AcquisitionOrderNotFoundError,
  AcquisitionPaymentRequiredError,
  type AcquisitionCommerceStore,
} from "./commerce";
import { isAuthorizedAcquisitionRequest } from "./http";
import { AcquisitionIdempotencyConflictError } from "./idempotency";
import type { AcquisitionPaymentService } from "./payment";
import { AcquisitionWebhookVerificationError } from "./payment";
import type { AcquisitionRateLimiter } from "./rate-limit";
import { validateAcquisitionCommandIdentity } from "./orchestration-validator";

const MAX_CHECKOUT_BYTES = 16_384;
const MAX_WEBHOOK_BYTES = 1_000_000;

interface CommerceHttpDependencies {
  apiSecret: string | undefined;
  paymentService: AcquisitionPaymentService;
  commerceStore: AcquisitionCommerceStore;
  rateLimiter?: AcquisitionRateLimiter;
  requestIdFactory?: () => string;
}

function headers(requestId: string) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": requestId,
  };
}

function json(requestId: string, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: headers(requestId),
  });
}

function authorized(request: Request, apiSecret: string | undefined) {
  return Boolean(
    apiSecret &&
      apiSecret.length >= 32 &&
      isAuthorizedAcquisitionRequest(
        request.headers.get("authorization"),
        apiSecret,
      ),
  );
}

function validReportId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(value)
  );
}

async function limitedBody(request: Request, maximumBytes: number) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximumBytes) return null;
  const body = await request.text();
  return new TextEncoder().encode(body).byteLength <= maximumBytes ? body : null;
}

export async function handleAcquisitionCheckoutRequest(
  request: Request,
  dependencies: CommerceHttpDependencies,
) {
  const requestId = (dependencies.requestIdFactory ?? randomUUID)();
  if (!authorized(request, dependencies.apiSecret)) {
    return json(requestId, 401, {
      ok: false,
      error: { code: "unauthorized", message: "Authentication is required." },
    });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json(requestId, 415, {
      ok: false,
      error: { code: "invalid_content_type", message: "Content-Type must be application/json." },
    });
  }
  const bodyText = await limitedBody(request, MAX_CHECKOUT_BYTES);
  if (bodyText === null) {
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
    !validReportId((body as Record<string, unknown>).reportId)
  ) {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid reportId is required." },
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
  if (dependencies.rateLimiter && dependencies.apiSecret) {
    try {
      const subject = createHash("sha256")
        .update(dependencies.apiSecret)
        .digest("base64url");
      const rate = await dependencies.rateLimiter.check("checkout", subject);
      if (!rate.allowed) {
        return json(requestId, 429, {
          ok: false,
          error: { code: "rate_limited", message: "Too many checkout requests. Retry shortly." },
        });
      }
    } catch {
      return json(requestId, 503, {
        ok: false,
        error: { code: "service_unavailable", message: "Checkout is temporarily unavailable." },
      });
    }
  }

  try {
    const result = await dependencies.paymentService.createCheckout({
      reportId: (body as { reportId: string }).reportId,
      idempotencyKey,
    });
    return json(requestId, 200, { ok: true, result });
  } catch (error) {
    if (
      error instanceof AcquisitionOrderConflictError ||
      error instanceof AcquisitionIdempotencyConflictError
    ) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "order_conflict", message: "This report already has an Acquisition Lens order." },
      });
    }
    return json(requestId, 503, {
      ok: false,
      error: { code: "checkout_unavailable", message: "Checkout is temporarily unavailable." },
    });
  }
}

export async function handleAcquisitionWebhookRequest(
  request: Request,
  dependencies: Pick<CommerceHttpDependencies, "paymentService" | "requestIdFactory">,
) {
  const requestId = (dependencies.requestIdFactory ?? randomUUID)();
  const rawBody = await limitedBody(request, MAX_WEBHOOK_BYTES);
  if (rawBody === null) {
    return json(requestId, 413, { received: false });
  }
  try {
    const result = await dependencies.paymentService.handleWebhook(
      rawBody,
      request.headers.get("stripe-signature") ?? "",
    );
    return json(requestId, 200, result);
  } catch (error) {
    if (
      error instanceof AcquisitionWebhookVerificationError ||
      error instanceof AcquisitionPaymentRequiredError ||
      error instanceof AcquisitionOrderNotFoundError
    ) {
      return json(requestId, 400, { received: false });
    }
    return json(requestId, 503, { received: false });
  }
}

export async function handleAcquisitionOrderRequest(
  request: Request,
  orderId: string,
  dependencies: Pick<
    CommerceHttpDependencies,
    "apiSecret" | "commerceStore" | "requestIdFactory"
  >,
) {
  const requestId = (dependencies.requestIdFactory ?? randomUUID)();
  if (!authorized(request, dependencies.apiSecret)) {
    return json(requestId, 401, {
      ok: false,
      error: { code: "unauthorized", message: "Authentication is required." },
    });
  }
  if (!/^[A-Za-z0-9-]{8,128}$/.test(orderId)) {
    return json(requestId, 400, {
      ok: false,
      error: { code: "invalid_request", message: "A valid order ID is required." },
    });
  }

  try {
    const order = await dependencies.commerceStore.getOrder(orderId);
    const job = await dependencies.commerceStore.getJob(orderId);
    if (!order || !job) throw new AcquisitionOrderNotFoundError();
    if (request.method === "GET") {
      const report = await dependencies.commerceStore.getReport(orderId);
      return json(requestId, 200, {
        ok: true,
        result: {
          orderId,
          paymentStatus: order.paidAt ? "paid" : "pending",
          jobStatus: job.status,
          reportAvailable: Boolean(report),
          completedAt: job.completedAt,
        },
      });
    }
    if (request.method === "DELETE") {
      const reportId = request.headers.get("x-acquisition-report-id") ?? "";
      if (!validReportId(reportId)) {
        return json(requestId, 400, {
          ok: false,
          error: { code: "invalid_request", message: "A valid report ID is required." },
        });
      }
      await dependencies.commerceStore.deleteReport(
        orderId,
        reportId,
        new Date().toISOString(),
      );
      return json(requestId, 200, { ok: true, result: { deleted: true } });
    }
    return json(requestId, 405, {
      ok: false,
      error: { code: "method_not_allowed", message: "Method not allowed." },
    });
  } catch (error) {
    if (error instanceof AcquisitionOrderNotFoundError) {
      return json(requestId, 404, {
        ok: false,
        error: { code: "not_found", message: "The Acquisition Lens order was not found." },
      });
    }
    if (error instanceof AcquisitionEntitlementConsumedError) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "entitlement_consumed", message: "The order does not match this report." },
      });
    }
    if (error instanceof AcquisitionOrderConflictError) {
      return json(requestId, 409, {
        ok: false,
        error: { code: "order_conflict", message: "The report is not ready for deletion." },
      });
    }
    return json(requestId, 503, {
      ok: false,
      error: { code: "service_unavailable", message: "Acquisition Lens is temporarily unavailable." },
    });
  }
}
