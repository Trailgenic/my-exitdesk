import type Stripe from "stripe";

import type { AcquisitionCommerceStore } from "./commerce";
import { AcquisitionPaymentRequiredError } from "./commerce";
import type { AcquisitionIdempotencyStore } from "./idempotency";
import { fingerprintAcquisitionPayload } from "./idempotency";

export const ACQUISITION_PRODUCT_CODE = "acquisition_lens" as const;

export interface AcquisitionCheckoutRequest {
  reportId: string;
  idempotencyKey: string;
}

export interface AcquisitionCheckoutResult {
  orderId: string;
  reportId: string;
  status: "pending_payment";
  checkoutUrl: string;
}

export interface AcquisitionStripeClient {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams,
        options?: Stripe.RequestOptions,
      ): Promise<Stripe.Checkout.Session>;
      retrieve(
        id: string,
        params?: Stripe.Checkout.SessionRetrieveParams,
      ): Promise<Stripe.Checkout.Session>;
    };
  };
  webhooks: {
    constructEvent(
      payload: string | Buffer,
      signature: string,
      secret: string,
    ): Stripe.Event;
  };
}

export interface AcquisitionPaymentServiceOptions {
  stripe: AcquisitionStripeClient;
  commerceStore: AcquisitionCommerceStore;
  checkoutIdempotencyStore: AcquisitionIdempotencyStore<AcquisitionCheckoutResult>;
  priceId: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
  now?: () => Date;
}

export class AcquisitionPaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionPaymentConfigurationError";
  }
}

export class AcquisitionWebhookVerificationError extends Error {
  constructor() {
    super("The Acquisition Lens webhook could not be verified.");
    this.name = "AcquisitionWebhookVerificationError";
  }
}

export class AcquisitionPaymentService {
  private readonly now: () => Date;

  constructor(private readonly options: AcquisitionPaymentServiceOptions) {
    this.now = options.now ?? (() => new Date());
    validatePaymentConfiguration(options);
  }

  async createCheckout(request: AcquisitionCheckoutRequest) {
    const fingerprint = fingerprintAcquisitionPayload({
      product: ACQUISITION_PRODUCT_CODE,
      reportId: request.reportId,
      priceId: this.options.priceId,
    });
    const execution = await this.options.checkoutIdempotencyStore.execute(
      `checkout:${request.idempotencyKey}`,
      fingerprint,
      async () => {
        const now = this.now().toISOString();
        const order = await this.options.commerceStore.createPendingOrder({
          reportId: request.reportId,
          stripePriceId: this.options.priceId,
          now,
        });
        if (order.stripeCheckoutSessionId) {
          const existing = await this.options.stripe.checkout.sessions.retrieve(
            order.stripeCheckoutSessionId,
          );
          if (existing.status === "open" && existing.url) {
            return {
              orderId: order.orderId,
              reportId: order.reportId,
              status: "pending_payment" as const,
              checkoutUrl: existing.url,
            };
          }
          if (existing.status !== "expired") {
            throw new AcquisitionPaymentConfigurationError(
              "The existing Acquisition Lens checkout cannot be replaced.",
            );
          }
        }
        const session = await this.options.stripe.checkout.sessions.create(
          {
            mode: "payment",
            customer_creation: "always",
            line_items: [{ price: this.options.priceId, quantity: 1 }],
            client_reference_id: order.orderId,
            metadata: {
              product: ACQUISITION_PRODUCT_CODE,
              commerce_version: order.commerceVersion,
              order_id: order.orderId,
            },
            success_url: this.options.successUrl,
            cancel_url: this.options.cancelUrl,
          },
          {
            idempotencyKey: order.stripeCheckoutSessionId
              ? `acq_replace_${fingerprintAcquisitionPayload({
                  orderId: order.orderId,
                  expiredSessionId: order.stripeCheckoutSessionId,
                }).slice(0, 48)}`
              : `acq_${request.idempotencyKey}`,
          },
        );
        if (!session.url) {
          throw new AcquisitionPaymentConfigurationError(
            "Stripe did not return an Acquisition Lens checkout URL.",
          );
        }
        await this.options.commerceStore.attachCheckoutSession(
          order.orderId,
          session.id,
          this.now().toISOString(),
        );
        return {
          orderId: order.orderId,
          reportId: order.reportId,
          status: "pending_payment" as const,
          checkoutUrl: session.url,
        };
      },
    );
    return { ...execution.value, idempotency: execution.replayed ? "replayed" : "created" };
  }

  async handleWebhook(rawBody: string, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.options.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.options.webhookSecret,
      );
    } catch {
      throw new AcquisitionWebhookVerificationError();
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded"
    ) {
      return { received: true, activated: false };
    }

    const eventSession = event.data.object as Stripe.Checkout.Session;
    const session = await this.options.stripe.checkout.sessions.retrieve(
      eventSession.id,
      { expand: ["line_items.data.price"] },
    );
    const orderId = session.metadata?.order_id ?? "";
    const lineItems = session.line_items?.data ?? [];
    const priceId = lineItems[0]?.price?.id ?? "";
    if (
      session.mode !== "payment" ||
      session.client_reference_id !== orderId ||
      session.metadata?.product !== ACQUISITION_PRODUCT_CODE ||
      lineItems.length !== 1 ||
      priceId !== this.options.priceId
    ) {
      throw new AcquisitionPaymentRequiredError();
    }
    if (session.payment_status !== "paid") {
      return { received: true, activated: false };
    }
    if (!session.amount_total || !session.currency) {
      throw new AcquisitionPaymentRequiredError();
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    await this.options.commerceStore.markPaid({
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId,
      amountTotal: session.amount_total,
      currency: session.currency,
      paidAt: this.now().toISOString(),
    });
    return { received: true, activated: true };
  }
}

function validatePaymentConfiguration(options: AcquisitionPaymentServiceOptions) {
  if (!options.priceId.startsWith("price_")) {
    throw new AcquisitionPaymentConfigurationError(
      "ACQUISITION_STRIPE_PRICE_ID is not configured.",
    );
  }
  if (!options.webhookSecret.startsWith("whsec_")) {
    throw new AcquisitionPaymentConfigurationError(
      "ACQUISITION_STRIPE_WEBHOOK_SECRET is not configured.",
    );
  }
  for (const [name, value] of [
    ["success URL", options.successUrl],
    ["cancel URL", options.cancelUrl],
  ] as const) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new AcquisitionPaymentConfigurationError(
        `The Acquisition Lens ${name} is invalid.`,
      );
    }
    if (url.protocol !== "https:") {
      throw new AcquisitionPaymentConfigurationError(
        `The Acquisition Lens ${name} must use HTTPS.`,
      );
    }
  }
  if (!options.successUrl.includes("{CHECKOUT_SESSION_ID}")) {
    throw new AcquisitionPaymentConfigurationError(
      "The Acquisition Lens success URL must include {CHECKOUT_SESSION_ID}.",
    );
  }
}
