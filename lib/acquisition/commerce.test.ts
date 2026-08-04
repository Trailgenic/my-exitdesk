import assert from "node:assert/strict";
import test from "node:test";

import type Stripe from "stripe";

import {
  AcquisitionDataCipher,
  type AcquisitionRedisClient,
  type AcquisitionRedisSetOptions,
} from "./durable-storage";
import {
  AcquisitionEntitlementConsumedError,
  AcquisitionPaymentRequiredError,
  RedisAcquisitionCommerceStore,
} from "./commerce";
import { handleAcquisitionOrderRequest } from "./commerce-http";
import {
  AcquisitionIdempotencyConflictError,
  InMemoryAcquisitionIdempotencyStore,
  RedisAcquisitionIdempotencyStore,
} from "./idempotency";
import type { AcquisitionOrchestrator } from "./orchestration";
import type { AcquisitionReasoningReport } from "./reasoning-contract";
import type { AcquisitionStripeClient } from "./payment";
import {
  AcquisitionPaymentService,
  AcquisitionWebhookVerificationError,
} from "./payment";
import { createProductionAcquisitionOrchestrator } from "./production-orchestration";
import { RedisAcquisitionRateLimiter } from "./rate-limit";
import { AcquisitionOrchestrationValidationError } from "./orchestration-validator";

const ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
const NOW = "2026-08-04T12:00:00.000Z";

class MemoryRedis implements AcquisitionRedisClient {
  readonly values = new Map<string, unknown>();

  async get<TData>(key: string) {
    return (this.values.get(key) as TData | undefined) ?? null;
  }

  async set<TData>(
    key: string,
    value: TData,
    options: AcquisitionRedisSetOptions,
  ) {
    if (options.nx && this.values.has(key)) return null;
    if (options.xx && !this.values.has(key)) return null;
    this.values.set(key, value);
    return "OK" as const;
  }

  async del(...keys: string[]) {
    let deleted = 0;
    for (const key of keys) {
      if (this.values.delete(key)) deleted += 1;
    }
    return deleted;
  }

  async eval<TArgs extends unknown[], TData = unknown>(
    _script: string,
    keys: string[],
    _args: TArgs,
  ) {
    const current = Number(this.values.get(keys[0]) ?? 0) + 1;
    this.values.set(keys[0], current);
    return current as TData;
  }
}

function setupStore() {
  const redis = new MemoryRedis();
  const cipher = new AcquisitionDataCipher(ENCRYPTION_KEY);
  const store = new RedisAcquisitionCommerceStore({
    redis,
    cipher,
    ledgerRetentionSeconds: 365 * 86_400,
    reportRetentionSeconds: 30 * 86_400,
    orderIdFactory: () => "order-00000001",
  });
  return { redis, cipher, store };
}

async function paidOrder() {
  const setup = setupStore();
  const order = await setup.store.createPendingOrder({
    reportId: "acq-confidential-target-001",
    stripePriceId: "price_acquisition",
    now: NOW,
  });
  await setup.store.attachCheckoutSession(order.orderId, "cs_paid", NOW);
  await setup.store.markPaid({
    orderId: order.orderId,
    checkoutSessionId: "cs_paid",
    paymentIntentId: "pi_paid",
    amountTotal: 49_900,
    currency: "usd",
    paidAt: NOW,
  });
  return { ...setup, order };
}

test("encrypts stored records and hashes confidential Redis keys", () => {
  const cipher = new AcquisitionDataCipher(ENCRYPTION_KEY);
  const encrypted = cipher.encrypt({ company: "Confidential Target" });
  assert.deepEqual(cipher.decrypt(encrypted), {
    company: "Confidential Target",
  });
  assert.doesNotMatch(encrypted, /Confidential Target/);
  assert.doesNotMatch(
    cipher.opaqueKey("report", "acq-confidential-target-001"),
    /confidential-target/,
  );
});

test("persists idempotent results across store instances and rejects key reuse", async () => {
  const redis = new MemoryRedis();
  const cipher = new AcquisitionDataCipher(ENCRYPTION_KEY);
  const firstStore = new RedisAcquisitionIdempotencyStore<{ value: string }>({
    redis,
    cipher,
    retentionSeconds: 3600,
    pollMilliseconds: 1,
  });
  let calls = 0;
  const first = await firstStore.execute("shared-key", "fingerprint-a", async () => {
    calls += 1;
    return { value: "confidential-result" };
  });
  const secondStore = new RedisAcquisitionIdempotencyStore<{ value: string }>({
    redis,
    cipher,
    retentionSeconds: 3600,
    pollMilliseconds: 1,
  });
  const replay = await secondStore.execute("shared-key", "fingerprint-a", async () => {
    calls += 1;
    return { value: "should-not-run" };
  });

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.value.value, "confidential-result");
  assert.equal(calls, 1);
  assert.doesNotMatch(JSON.stringify([...redis.values]), /confidential-result/);
  await assert.rejects(
    () => secondStore.execute("shared-key", "fingerprint-b", async () => ({ value: "x" })),
    AcquisitionIdempotencyConflictError,
  );
});

test("coalesces concurrent durable retries across runtime instances", async () => {
  const redis = new MemoryRedis();
  const cipher = new AcquisitionDataCipher(ENCRYPTION_KEY);
  const options = {
    redis,
    cipher,
    retentionSeconds: 3600,
    pollMilliseconds: 1,
    waitMilliseconds: 1000,
  };
  const firstStore = new RedisAcquisitionIdempotencyStore<string>(options);
  const secondStore = new RedisAcquisitionIdempotencyStore<string>(options);
  let release!: () => void;
  let calls = 0;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = firstStore.execute("concurrent-key", "same-fingerprint", async () => {
    calls += 1;
    await gate;
    return "result";
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const second = secondStore.execute("concurrent-key", "same-fingerprint", async () => {
    calls += 1;
    return "duplicate";
  });
  release();
  const [created, replayed] = await Promise.all([first, second]);

  assert.equal(calls, 1);
  assert.equal(created.replayed, false);
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.value, "result");
});

test("requires verified payment and permits exactly one idempotent report claim", async () => {
  const { store } = setupStore();
  const order = await store.createPendingOrder({
    reportId: "acq-confidential-target-001",
    stripePriceId: "price_acquisition",
    now: NOW,
  });
  await assert.rejects(
    () =>
      store.claimEntitlement({
        orderId: order.orderId,
        reportId: order.reportId,
        idempotencyKey: "generation-key-a",
        now: NOW,
      }),
    AcquisitionPaymentRequiredError,
  );
  await store.attachCheckoutSession(order.orderId, "cs_paid", NOW);
  await store.markPaid({
    orderId: order.orderId,
    checkoutSessionId: "cs_paid",
    paymentIntentId: "pi_paid",
    amountTotal: 49_900,
    currency: "usd",
    paidAt: NOW,
  });

  await store.claimEntitlement({
    orderId: order.orderId,
    reportId: order.reportId,
    idempotencyKey: "generation-key-a",
    now: NOW,
  });
  await store.claimEntitlement({
    orderId: order.orderId,
    reportId: order.reportId,
    idempotencyKey: "generation-key-a",
    now: NOW,
  });
  await assert.rejects(
    () =>
      store.claimEntitlement({
        orderId: order.orderId,
        reportId: order.reportId,
        idempotencyKey: "generation-key-b",
        now: NOW,
      }),
    AcquisitionEntitlementConsumedError,
  );
});

test("persists completed reports, exposes job status, and supports deletion", async () => {
  const { store, order } = await paidOrder();
  await store.claimEntitlement({
    orderId: order.orderId,
    reportId: order.reportId,
    idempotencyKey: "generation-key-a",
    now: NOW,
  });
  const report = { reportId: order.reportId } as AcquisitionReasoningReport;
  await store.saveCompletedReport({
    orderId: order.orderId,
    reportId: order.reportId,
    report,
    now: NOW,
  });

  assert.equal((await store.getJob(order.orderId))?.status, "completed");
  assert.equal((await store.getReport(order.orderId))?.report.reportId, order.reportId);
  await store.deleteReport(order.orderId, order.reportId, NOW);
  assert.equal(await store.getReport(order.orderId), null);
  assert.equal((await store.getJob(order.orderId))?.status, "report_deleted");
});

test("serves authenticated job status without returning the report", async () => {
  const { store, order } = await paidOrder();
  const response = await handleAcquisitionOrderRequest(
    new Request(`https://example.test/api/acquisition/orders/${order.orderId}`, {
      headers: {
        authorization:
          "Bearer acquisition-test-secret-0000000000000000",
      },
    }),
    order.orderId,
    {
      apiSecret: "acquisition-test-secret-0000000000000000",
      commerceStore: store,
      requestIdFactory: () => "status-request-0001",
    },
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.result.jobStatus, "ready");
  assert.equal(body.result.reportAvailable, false);
  assert.equal("report" in body.result, false);
});

class FakeStripe implements AcquisitionStripeClient {
  signatureValid = true;
  createdSession: Stripe.Checkout.Session = {
    id: "cs_paid",
    object: "checkout.session",
    url: "https://checkout.stripe.test/session",
    mode: "payment",
    payment_status: "unpaid",
    status: "open",
    metadata: {},
  } as Stripe.Checkout.Session;

  checkout = {
    sessions: {
      create: async (params: Stripe.Checkout.SessionCreateParams) => {
        this.createdSession = {
          ...this.createdSession,
          client_reference_id: params.client_reference_id ?? null,
          metadata: params.metadata ?? {},
        } as Stripe.Checkout.Session;
        return this.createdSession;
      },
      retrieve: async () => this.createdSession,
    },
  };

  webhooks = {
    constructEvent: () => {
      if (!this.signatureValid) throw new Error("invalid signature");
      return ({
        id: "evt_paid",
        type: "checkout.session.completed",
        data: { object: this.createdSession },
      }) as Stripe.Event;
    },
  };
}

test("activates an entitlement only after a paid configured Stripe price", async () => {
  const { store } = setupStore();
  const stripe = new FakeStripe();
  const service = new AcquisitionPaymentService({
    stripe,
    commerceStore: store,
    checkoutIdempotencyStore: new InMemoryAcquisitionIdempotencyStore(),
    priceId: "price_acquisition",
    webhookSecret: "whsec_acquisition",
    successUrl: "https://www.mikeye.com/acquisition/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://www.mikeye.com/acquisition",
    now: () => new Date(NOW),
  });
  const checkout = await service.createCheckout({
    reportId: "acq-confidential-target-001",
    idempotencyKey: "checkout-key-0001",
  });
  stripe.createdSession = {
    ...stripe.createdSession,
    payment_status: "paid",
    amount_total: 49_900,
    currency: "usd",
    payment_intent: "pi_paid",
    line_items: {
      object: "list",
      data: [{ price: { id: "price_acquisition" } }],
      has_more: false,
      url: "/v1/line_items",
    },
  } as Stripe.Checkout.Session;

  const webhook = await service.handleWebhook("signed-body", "stripe-signature");
  assert.equal(webhook.activated, true);
  assert.equal((await store.getOrder(checkout.orderId))?.status, "paid");
});

test("rejects an invalid webhook signature and an unexpected Stripe price", async () => {
  const { store } = setupStore();
  const stripe = new FakeStripe();
  const service = new AcquisitionPaymentService({
    stripe,
    commerceStore: store,
    checkoutIdempotencyStore: new InMemoryAcquisitionIdempotencyStore(),
    priceId: "price_acquisition",
    webhookSecret: "whsec_acquisition",
    successUrl: "https://www.mikeye.com/acquisition/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://www.mikeye.com/acquisition",
    now: () => new Date(NOW),
  });
  await service.createCheckout({
    reportId: "acq-confidential-target-001",
    idempotencyKey: "checkout-key-0001",
  });

  stripe.signatureValid = false;
  await assert.rejects(
    () => service.handleWebhook("body", "bad-signature"),
    AcquisitionWebhookVerificationError,
  );

  stripe.signatureValid = true;
  stripe.createdSession = {
    ...stripe.createdSession,
    payment_status: "paid",
    amount_total: 49_900,
    currency: "usd",
    line_items: {
      object: "list",
      data: [{ price: { id: "price_wrong" } }],
      has_more: false,
      url: "/v1/line_items",
    },
  } as Stripe.Checkout.Session;
  await assert.rejects(
    () => service.handleWebhook("body", "valid-signature"),
    AcquisitionPaymentRequiredError,
  );
});

test("production orchestration persists the report without changing the core result", async () => {
  const { store, order } = await paidOrder();
  const report = { reportId: order.reportId } as AcquisitionReasoningReport;
  const base: AcquisitionOrchestrator = {
    async run(command) {
      return {
        orchestrationVersion: "1.0.0",
        requestId: command.requestId,
        reportId: command.payload.reportId,
        status: "completed",
        idempotency: "created",
        completedAt: NOW,
        report,
      };
    },
  };
  const production = createProductionAcquisitionOrchestrator({
    orchestrator: base,
    commerceStore: store,
    now: () => new Date(NOW),
  });
  const result = await production.run({
    requestId: "request-0001",
    idempotencyKey: "generation-key-a",
    orderId: order.orderId,
    payload: { reportId: order.reportId } as never,
  });

  assert.equal(result.report, report);
  assert.deepEqual((await store.getReport(order.orderId))?.report, report);
});

test("invalid input releases the paid entitlement for a corrected retry", async () => {
  const { store, order } = await paidOrder();
  const production = createProductionAcquisitionOrchestrator({
    orchestrator: {
      async run() {
        throw new AcquisitionOrchestrationValidationError("Invalid input.");
      },
    },
    commerceStore: store,
    now: () => new Date(NOW),
  });
  await assert.rejects(
    () =>
      production.run({
        requestId: "request-invalid",
        idempotencyKey: "generation-key-invalid",
        orderId: order.orderId,
        payload: { reportId: order.reportId } as never,
      }),
    AcquisitionOrchestrationValidationError,
  );

  assert.equal((await store.getOrder(order.orderId))?.status, "paid");
  await store.claimEntitlement({
    orderId: order.orderId,
    reportId: order.reportId,
    idempotencyKey: "generation-key-corrected",
    now: NOW,
  });
});

test("applies a shared fixed-window rate limit", async () => {
  const redis = new MemoryRedis();
  const limiter = new RedisAcquisitionRateLimiter(
    redis,
    new AcquisitionDataCipher(ENCRYPTION_KEY),
    2,
  );
  assert.equal((await limiter.check("generate", "caller")).allowed, true);
  assert.equal((await limiter.check("generate", "caller")).allowed, true);
  assert.equal((await limiter.check("generate", "caller")).allowed, false);
});
