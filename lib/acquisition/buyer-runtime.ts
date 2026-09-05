import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { ResendAcquisitionEmailClient } from './delivery';
import { createAcquisitionRedisClient, AcquisitionDataCipher } from './durable-storage';
import { RedisAcquisitionIdempotencyStore } from './idempotency';
import { RedisAcquisitionRateLimiter } from './rate-limit';
import { createBuyerDiagnosticEngine, type BuyerDiagnosticReport } from './buyer-diagnostic';
import { AnthropicAcquisitionReasoningModel } from './anthropic-reasoning-client';
import { AnthropicBuyerResearch } from './buyer-research';
import { getAcquisitionReasoningConfig } from './reasoning-config';
import { BuyerCommerceService } from './buyer-commerce';
import { renderBuyerReportPDF } from './buyer-report-pdf';
import type { BuyerIntake } from './buyer-intake';

export function buyerConfigurationReady(env: Record<string,string|undefined> = process.env) {
  const mode = env.ACQUISITION_DIAGNOSTIC_MODE;
  return ['test','live'].includes(mode ?? '') && (env.STRIPE_SECRET_KEY ?? '').startsWith(mode === 'live' ? 'sk_live_' : 'sk_test_') && ['ANTHROPIC_API_KEY','RESEND_API_KEY','ACQUISITION_DATA_ENCRYPTION_KEY','ACQUISITION_REDIS_REST_URL','ACQUISITION_REDIS_REST_TOKEN','ACQUISITION_DIAGNOSTIC_PRICE_ID','ACQUISITION_DIAGNOSTIC_BASE_URL','ACQUISITION_RESEND_FROM_EMAIL'].every(k => Boolean(env[k]));
}
let runtime: ReturnType<typeof buildRuntime> | undefined;
export function getBuyerRuntime() {
  if (!buyerConfigurationReady()) throw new Error('The buyer report is not open for orders.');
  return runtime ??= buildRuntime();
}
function buildRuntime() {
  const base = new URL(process.env.ACQUISITION_DIAGNOSTIC_BASE_URL!);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Configure a secure buyer app origin.');
  const redis = createAcquisitionRedisClient({ url: process.env.ACQUISITION_REDIS_REST_URL, token: process.env.ACQUISITION_REDIS_REST_TOKEN });
  const cipher = new AcquisitionDataCipher(process.env.ACQUISITION_DATA_ENCRYPTION_KEY);
  const days = 30 * 86400;
  const idempotency = <T,>(seconds = days) => new RedisAcquisitionIdempotencyStore<T>({ redis, cipher, retentionSeconds: seconds, lockSeconds: 600, waitMilliseconds: 5000 });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 120000 });
  const config = getAcquisitionReasoningConfig();
  const engine = createBuyerDiagnosticEngine(new AnthropicAcquisitionReasoningModel(client), new AnthropicBuyerResearch(client, config.model));
  const resend = new ResendAcquisitionEmailClient(process.env.RESEND_API_KEY);
  const commerce = new BuyerCommerceService({ stripe: new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' }), priceId: process.env.ACQUISITION_DIAGNOSTIC_PRICE_ID!, baseUrl: base.origin, live: process.env.ACQUISITION_DIAGNOSTIC_MODE === 'live',
    drafts: { async put(id, intake) { await redis.set(cipher.opaqueKey('buyer-intake',id), cipher.encrypt(intake), { ex: days }); }, async get(id) { const raw = await redis.get<string>(cipher.opaqueKey('buyer-intake',id)); return raw ? cipher.decrypt<BuyerIntake>(raw) : null; } },
    checkoutIdempotency: idempotency<{url:string}>(23 * 3600), reports: idempotency<BuyerDiagnosticReport>(), deliveryIdempotency: idempotency<{delivered:true}>(),
    generate: (intake,id) => engine.generate(intake,id),
    async deliver(email, report, key) {
      const pdf = await renderBuyerReportPDF(report);
      const text = 'Your confidential buyer assessment is attached. It applies Mike Ye’s acquisition judgment to your supplied information and, where requested, cited public research. The assessment identifies what to investigate, price, protect, or reject before the next commitment.\n\nAcquisition Lens · MikeYe.com';
      await resend.send({ from: process.env.ACQUISITION_RESEND_FROM_EMAIL!, to: email, subject: 'Your Acquisition Lens buyer assessment', text, html: '<p>Your confidential Acquisition Lens buyer assessment is attached.</p><p>Acquisition Lens · MikeYe.com</p>', attachment: { filename: 'Acquisition_Lens_Buyer_Assessment.pdf', content: pdf, contentType: 'application/pdf' }, providerIdempotencyKey: key });
    }
  });
  return { commerce, limiter: new RedisAcquisitionRateLimiter(redis,cipher,10), baseOrigin: base.origin };
}
