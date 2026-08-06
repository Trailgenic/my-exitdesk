import { stripe } from "@/lib/stripe";

import { createAnthropicAcquisitionReasoningModel } from "./anthropic-reasoning-client";
import {
  RedisAcquisitionCommerceStore,
} from "./commerce";
import {
  AcquisitionDataCipher,
  createAcquisitionRedisClient,
  retentionSeconds,
} from "./durable-storage";
import {
  AcquisitionDeliveryService,
  type AcquisitionDeliveryResult,
  ResendAcquisitionEmailClient,
} from "./delivery";
import { RedisAcquisitionIdempotencyStore } from "./idempotency";
import type { CoreOrchestrationResult } from "./orchestration";
import { createAcquisitionOrchestrator } from "./orchestration";
import type { AcquisitionCheckoutResult } from "./payment";
import { AcquisitionPaymentService } from "./payment";
import { createProductionAcquisitionOrchestrator } from "./production-orchestration";
import { RedisAcquisitionRateLimiter } from "./rate-limit";
import { createAcquisitionReasoningEngine } from "./reasoning-engine";

export interface AcquisitionProductionRuntime {
  commerceStore: RedisAcquisitionCommerceStore;
  paymentService: AcquisitionPaymentService;
  orchestrator: ReturnType<typeof createProductionAcquisitionOrchestrator>;
  rateLimiter: RedisAcquisitionRateLimiter;
  deliveryService: AcquisitionDeliveryService;
}

let liveRuntime: AcquisitionProductionRuntime | undefined;

export function getAcquisitionProductionRuntime() {
  if (liveRuntime) return liveRuntime;

  const redis = createAcquisitionRedisClient({
    url: process.env.ACQUISITION_REDIS_REST_URL,
    token: process.env.ACQUISITION_REDIS_REST_TOKEN,
  });
  const cipher = new AcquisitionDataCipher(
    process.env.ACQUISITION_DATA_ENCRYPTION_KEY,
  );
  const reportRetention = retentionSeconds(
    integerEnvironment("ACQUISITION_REPORT_RETENTION_DAYS", 30),
    "ACQUISITION_REPORT_RETENTION_DAYS",
  );
  const ledgerRetention = retentionSeconds(
    integerEnvironment("ACQUISITION_LEDGER_RETENTION_DAYS", 90),
    "ACQUISITION_LEDGER_RETENTION_DAYS",
  );
  const commerceStore = new RedisAcquisitionCommerceStore({
    redis,
    cipher,
    reportRetentionSeconds: reportRetention,
    ledgerRetentionSeconds: ledgerRetention,
  });
  const orchestrationIdempotency =
    new RedisAcquisitionIdempotencyStore<CoreOrchestrationResult>({
      redis,
      cipher,
      retentionSeconds: reportRetention,
    });
  const checkoutIdempotency =
    new RedisAcquisitionIdempotencyStore<AcquisitionCheckoutResult>({
      redis,
      cipher,
      retentionSeconds: 24 * 60 * 60,
      lockSeconds: 90,
      waitMilliseconds: 30_000,
    });
  const deliveryIdempotency =
    new RedisAcquisitionIdempotencyStore<AcquisitionDeliveryResult>({
      redis,
      cipher,
      retentionSeconds: reportRetention,
      lockSeconds: 300,
      waitMilliseconds: 30_000,
    });
  const baseOrchestrator = createAcquisitionOrchestrator({
    reasoningEngine: createAcquisitionReasoningEngine({
      model: createAnthropicAcquisitionReasoningModel(),
    }),
    idempotencyStore: orchestrationIdempotency,
  });
  const orchestrator = createProductionAcquisitionOrchestrator({
    orchestrator: baseOrchestrator,
    commerceStore,
  });
  const rateLimiter = new RedisAcquisitionRateLimiter(
    redis,
    cipher,
    integerEnvironment("ACQUISITION_RATE_LIMIT_PER_MINUTE", 10),
  );
  const paymentService = new AcquisitionPaymentService({
    stripe,
    commerceStore,
    checkoutIdempotencyStore: checkoutIdempotency,
    priceId: process.env.ACQUISITION_STRIPE_PRICE_ID ?? "",
    webhookSecret: process.env.ACQUISITION_STRIPE_WEBHOOK_SECRET ?? "",
    successUrl: process.env.ACQUISITION_CHECKOUT_SUCCESS_URL ?? "",
    cancelUrl: process.env.ACQUISITION_CHECKOUT_CANCEL_URL ?? "",
  });
  const deliveryService = new AcquisitionDeliveryService({
    commerceStore,
    idempotencyStore: deliveryIdempotency,
    emailClient: new ResendAcquisitionEmailClient(process.env.RESEND_API_KEY),
    from:
      process.env.ACQUISITION_RESEND_FROM_EMAIL ??
      "Acquisition Lens by Mike Ye <mike@mikeye.com>",
    subjectPrefix: process.env.ACQUISITION_REPORT_SUBJECT_PREFIX,
  });

  liveRuntime = {
    commerceStore,
    paymentService,
    orchestrator,
    rateLimiter,
    deliveryService,
  };
  return liveRuntime;
}

function integerEnvironment(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${name} must be an integer.`);
  }
  return parsed;
}
