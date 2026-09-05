import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import type { BuyerIntake } from './buyer-intake';
import type { BuyerDiagnosticReport } from './buyer-diagnostic';
import type { AcquisitionIdempotencyStore } from './idempotency';
import { fingerprintAcquisitionPayload } from './idempotency';

export const BUYER_PRODUCT = 'acquisition_lens_buyer_report';
export interface BuyerDraftStore { put(id: string, value: BuyerIntake): Promise<void>; get(id: string): Promise<BuyerIntake | null> }
export class BuyerPaymentError extends Error {}
export class BuyerExpiredError extends Error {}
export interface BuyerCommerceOptions {
  stripe: Pick<Stripe, 'prices' | 'checkout'>; priceId: string; baseUrl: string; live: boolean;
  drafts: BuyerDraftStore; checkoutIdempotency: AcquisitionIdempotencyStore<{ url: string }>;
  reports: AcquisitionIdempotencyStore<BuyerDiagnosticReport>;
  generate: (intake: BuyerIntake, id: string) => Promise<BuyerDiagnosticReport>;
  deliver: (email: string, report: BuyerDiagnosticReport, key: string) => Promise<void>;
  deliveryIdempotency: AcquisitionIdempotencyStore<{ delivered: true }>;
}
export class BuyerCommerceService {
  constructor(private options: BuyerCommerceOptions) {}
  async quote() {
    const price = await this.options.stripe.prices.retrieve(this.options.priceId, { expand: ['product'] });
    const product = price.product;
    if (!price.active || price.type !== 'one_time' || !price.unit_amount || price.livemode !== this.options.live || typeof product === 'string' || product.deleted || !product.active || product.metadata.product !== BUYER_PRODUCT) throw new Error('Buyer report price is not configured for this product.');
    return { amount: price.unit_amount, currency: price.currency, live: this.options.live };
  }
  async checkout(intake: BuyerIntake, key: string) {
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(key)) throw new Error('Invalid checkout request key.');
    await this.quote();
    const fingerprint = fingerprintAcquisitionPayload({ intake, price: this.options.priceId });
    return (await this.options.checkoutIdempotency.execute('buyer-checkout:' + key, fingerprint, async () => {
      const draftId = randomUUID();
      await this.options.drafts.put(draftId, intake);
      const session = await this.options.stripe.checkout.sessions.create({ mode: 'payment', customer_creation: 'always', line_items: [{ price: this.options.priceId, quantity: 1 }], metadata: { product: BUYER_PRODUCT, draft_id: draftId }, success_url: this.options.baseUrl + '/acquisition/report?session_id={CHECKOUT_SESSION_ID}', cancel_url: this.options.baseUrl + '/acquisition/report?cancelled=1' }, { idempotencyKey: 'buyer-' + key });
      if (!session.url) throw new Error('Checkout could not be created.');
      return { url: session.url };
    })).value;
  }
  async paidSession(sessionId: string) {
    if (!/^cs_(test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId)) throw new BuyerPaymentError('A valid checkout session is required.');
    const session = await this.options.stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] });
    const lines = session.line_items?.data ?? [];
    if (session.payment_status !== 'paid' || session.status !== 'complete' || session.mode !== 'payment' || session.livemode !== this.options.live || session.metadata?.product !== BUYER_PRODUCT || !session.metadata.draft_id || !session.amount_total || lines.length !== 1 || lines[0].quantity !== 1 || lines[0].price?.id !== this.options.priceId) throw new BuyerPaymentError('A paid Acquisition Lens buyer report is required.');
    return session;
  }
  async report(sessionId: string) {
    const session = await this.paidSession(sessionId);
    const draftId = session.metadata!.draft_id;
    const intake = await this.options.drafts.get(draftId);
    if (!intake) throw new BuyerExpiredError('The report retention period has ended or the order needs support.');
    const execution = await this.options.reports.execute('buyer-report:' + session.id, fingerprintAcquisitionPayload({ draftId, intake }), () => this.options.generate(intake, draftId));
    // A completed, paid report is returned even if delivery fails. Retrying never regenerates it.
    let emailStatus: 'sent' | 'retry_available' = 'retry_available';
    const email = session.customer_details?.email;
    if (email) {
      try {
        await this.options.deliveryIdempotency.execute('buyer-email:' + session.id, draftId, async () => { await this.options.deliver(email, execution.value, 'buyer-email-' + session.id); return { delivered: true }; });
        emailStatus = 'sent';
      } catch { /* The browser copy and PDF download remain available. */ }
    }
    return { report: execution.value, emailStatus, replayed: execution.replayed };
  }
}
