import { randomUUID } from "node:crypto";

import {
  ACQUISITION_BACKEND_VERSION,
  inspectAcquisitionDeployment,
} from "./deployment";
import {
  isAuthorizedAcquisitionRequest,
  MIN_ACQUISITION_API_SECRET_CHARACTERS,
} from "./http";

export interface AcquisitionReadinessDependencies {
  environment?: Record<string, string | undefined>;
  now?: () => Date;
  requestIdFactory?: () => string;
}

export function handleAcquisitionReadinessRequest(
  request: Request,
  dependencies: AcquisitionReadinessDependencies = {},
) {
  const environment = dependencies.environment ?? process.env;
  const requestId = (dependencies.requestIdFactory ?? randomUUID)();
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
    "X-Acquisition-Backend-Version": ACQUISITION_BACKEND_VERSION,
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": requestId,
  };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });

  if (request.method !== "GET") {
    return json(405, {
      ok: false,
      error: { code: "method_not_allowed", message: "Method not allowed." },
    });
  }

  const apiSecret = environment.ACQUISITION_API_SECRET;
  if (
    !apiSecret ||
    apiSecret.length < MIN_ACQUISITION_API_SECRET_CHARACTERS
  ) {
    return json(503, {
      ok: false,
      error: {
        code: "service_unavailable",
        message: "Acquisition Lens is not configured.",
      },
    });
  }
  if (
    !isAuthorizedAcquisitionRequest(
      request.headers.get("authorization"),
      apiSecret,
    )
  ) {
    return json(401, {
      ok: false,
      error: { code: "unauthorized", message: "Authentication is required." },
    });
  }

  const state = inspectAcquisitionDeployment(environment);
  const result = {
    ...state,
    checkedAt: (dependencies.now ?? (() => new Date()))().toISOString(),
  };
  if (state.configurationStatus !== "ready") {
    return json(503, {
      ok: false,
      error: {
        code: "service_unavailable",
        message: "Acquisition Lens deployment configuration is incomplete.",
      },
      result,
    });
  }
  return json(200, { ok: true, result });
}
