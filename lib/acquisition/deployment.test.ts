import assert from "node:assert/strict";
import test from "node:test";

import {
  AcquisitionDeploymentConfigurationError,
  assertAcquisitionBackendEnabled,
  inspectAcquisitionDeployment,
} from "./deployment";
import { handleAcquisitionReadinessRequest } from "./deployment-http";

const API_SECRET = "a".repeat(32);

function completeEnvironment(
  overrides: Record<string, string | undefined> = {},
) {
  return {
    ACQUISITION_BACKEND_MODE: "internal",
    ACQUISITION_API_SECRET: API_SECRET,
    ACQUISITION_DATA_ENCRYPTION_KEY:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ACQUISITION_REDIS_REST_URL: "https://redis.example.test",
    ACQUISITION_REDIS_REST_TOKEN: "redis-token",
    STRIPE_SECRET_KEY: "sk_test_acquisition",
    ACQUISITION_STRIPE_PRICE_ID: "price_acquisition",
    ACQUISITION_STRIPE_WEBHOOK_SECRET: "whsec_acquisition",
    ACQUISITION_CHECKOUT_SUCCESS_URL:
      "https://example.test/acquisition/success?session_id={CHECKOUT_SESSION_ID}",
    ACQUISITION_CHECKOUT_CANCEL_URL:
      "https://example.test/acquisition/cancel",
    ANTHROPIC_API_KEY: "sk-ant-acquisition",
    ACQUISITION_REASONING_MODEL: "claude-opus-4-6",
    ACQUISITION_REASONING_MAX_TOKENS: "8000",
    ACQUISITION_REASONING_TEMPERATURE: "0",
    RESEND_API_KEY: "re_acquisition",
    ACQUISITION_RESEND_FROM_EMAIL:
      "Acquisition Lens <reports@example.test>",
    ACQUISITION_RATE_LIMIT_PER_MINUTE: "10",
    ACQUISITION_REPORT_RETENTION_DAYS: "30",
    ACQUISITION_LEDGER_RETENTION_DAYS: "90",
    ...overrides,
  };
}

function readinessRequest(secret = API_SECRET) {
  return new Request("https://backend.example.test/api/acquisition/readiness", {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
}

test("defaults to a frozen, incomplete backend without configuration", () => {
  const state = inspectAcquisitionDeployment({});
  assert.equal(state.mode, "disabled");
  assert.equal(state.configurationStatus, "incomplete");
  assert.equal(state.operationalStatus, "blocked");
  assert.equal(state.operational, false);
  assert.equal(state.backendVersion, "1.0.0");
  assert.equal(state.contracts.orchestration, "1.0.0");
});

test("recognizes a fully configured internal backend", () => {
  const environment = completeEnvironment();
  const state = inspectAcquisitionDeployment(environment);

  assert.equal(state.mode, "internal");
  assert.equal(state.configurationStatus, "ready");
  assert.equal(state.operationalStatus, "ready");
  assert.equal(state.operational, true);
  assert.equal(state.checks.every(({ ready }) => ready), true);
  assert.doesNotMatch(JSON.stringify(state), /redis-token|sk-ant|re_acquisition/);
  assert.equal(assertAcquisitionBackendEnabled(environment), "internal");
});

test("keeps a fully configured disabled backend intentionally frozen", () => {
  const state = inspectAcquisitionDeployment(
    completeEnvironment({ ACQUISITION_BACKEND_MODE: "disabled" }),
  );
  assert.equal(state.configurationStatus, "ready");
  assert.equal(state.operationalStatus, "frozen");
  assert.equal(state.operational, false);
  assert.throws(
    () =>
      assertAcquisitionBackendEnabled({
        ACQUISITION_BACKEND_MODE: "disabled",
      }),
    AcquisitionDeploymentConfigurationError,
  );
});

test("requires live Stripe credentials before live activation", () => {
  const blocked = inspectAcquisitionDeployment(
    completeEnvironment({ ACQUISITION_BACKEND_MODE: "live" }),
  );
  assert.equal(blocked.configurationStatus, "incomplete");
  assert.equal(
    blocked.checks.find(({ name }) => name === "production_safety")?.ready,
    false,
  );

  const ready = inspectAcquisitionDeployment(
    completeEnvironment({
      ACQUISITION_BACKEND_MODE: "live",
      STRIPE_SECRET_KEY: "sk_live_acquisition",
    }),
  );
  assert.equal(ready.configurationStatus, "ready");
  assert.equal(ready.operational, true);
});

test("readiness is operator-only and returns a secret-free contract", async () => {
  const environment = completeEnvironment();
  const unauthorized = handleAcquisitionReadinessRequest(
    new Request("https://backend.example.test/api/acquisition/readiness"),
    { environment, requestIdFactory: () => "request-0000001" },
  );
  assert.equal(unauthorized.status, 401);

  const response = handleAcquisitionReadinessRequest(readinessRequest(), {
    environment,
    now: () => new Date("2026-08-08T12:00:00.000Z"),
    requestIdFactory: () => "request-0000002",
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.result.operational, true);
  assert.equal(body.result.checkedAt, "2026-08-08T12:00:00.000Z");
  assert.equal(
    response.headers.get("x-acquisition-backend-version"),
    "1.0.0",
  );
  assert.doesNotMatch(
    JSON.stringify(body),
    /redis-token|sk_test_acquisition|sk-ant-acquisition|re_acquisition/,
  );
});

test("readiness fails closed when a capability is incomplete", async () => {
  const environment = completeEnvironment({ RESEND_API_KEY: "" });
  const response = handleAcquisitionReadinessRequest(readinessRequest(), {
    environment,
    requestIdFactory: () => "request-0000003",
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.result.configurationStatus, "incomplete");
  assert.equal(
    body.result.checks.find(
      ({ name }: { name: string }) => name === "delivery",
    ).ready,
    false,
  );
});
