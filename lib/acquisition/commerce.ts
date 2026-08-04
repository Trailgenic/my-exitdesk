import { randomUUID } from "node:crypto";

import type { AcquisitionReasoningReport } from "./reasoning-contract";
import type {
  AcquisitionDataCipher,
  AcquisitionRedisClient,
} from "./durable-storage";

export const ACQUISITION_COMMERCE_VERSION = "1.0.0" as const;

export type AcquisitionOrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "completed"
  | "failed"
  | "report_deleted";

export type AcquisitionJobStatus =
  | "awaiting_payment"
  | "ready"
  | "processing"
  | "completed"
  | "failed"
  | "report_deleted";

export interface AcquisitionOrderRecord {
  commerceVersion: typeof ACQUISITION_COMMERCE_VERSION;
  orderId: string;
  reportId: string;
  status: AcquisitionOrderStatus;
  stripePriceId: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  reportDeletedAt: string | null;
  generationIdempotencyKey: string | null;
}

export interface AcquisitionJobRecord {
  commerceVersion: typeof ACQUISITION_COMMERCE_VERSION;
  orderId: string;
  reportId: string;
  status: AcquisitionJobStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  safeFailureCode: "generation_failed" | null;
}

export interface AcquisitionPersistedReport {
  commerceVersion: typeof ACQUISITION_COMMERCE_VERSION;
  orderId: string;
  reportId: string;
  storedAt: string;
  report: AcquisitionReasoningReport;
}

export class AcquisitionPaymentRequiredError extends Error {
  constructor() {
    super("A verified Acquisition Lens payment is required.");
    this.name = "AcquisitionPaymentRequiredError";
  }
}

export class AcquisitionEntitlementConsumedError extends Error {
  constructor() {
    super("This Acquisition Lens entitlement is already assigned.");
    this.name = "AcquisitionEntitlementConsumedError";
  }
}

export class AcquisitionOrderConflictError extends Error {
  constructor() {
    super("An Acquisition Lens order already exists for this report.");
    this.name = "AcquisitionOrderConflictError";
  }
}

export class AcquisitionOrderNotFoundError extends Error {
  constructor() {
    super("The Acquisition Lens order was not found.");
    this.name = "AcquisitionOrderNotFoundError";
  }
}

export interface CreatePendingAcquisitionOrderInput {
  reportId: string;
  stripePriceId: string;
  now: string;
}

export interface MarkAcquisitionOrderPaidInput {
  orderId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  amountTotal: number;
  currency: string;
  paidAt: string;
}

export interface AcquisitionCommerceStore {
  createPendingOrder(
    input: CreatePendingAcquisitionOrderInput,
  ): Promise<AcquisitionOrderRecord>;
  attachCheckoutSession(
    orderId: string,
    checkoutSessionId: string,
    now: string,
  ): Promise<AcquisitionOrderRecord>;
  markPaid(
    input: MarkAcquisitionOrderPaidInput,
  ): Promise<AcquisitionOrderRecord>;
  claimEntitlement(input: {
    orderId: string;
    reportId: string;
    idempotencyKey: string;
    now: string;
  }): Promise<AcquisitionOrderRecord>;
  releaseEntitlementClaim(input: {
    orderId: string;
    idempotencyKey: string;
    now: string;
  }): Promise<void>;
  markGenerationFailed(input: {
    orderId: string;
    reportId: string;
    now: string;
  }): Promise<void>;
  saveCompletedReport(input: {
    orderId: string;
    reportId: string;
    report: AcquisitionReasoningReport;
    now: string;
  }): Promise<void>;
  getOrder(orderId: string): Promise<AcquisitionOrderRecord | null>;
  getJob(orderId: string): Promise<AcquisitionJobRecord | null>;
  getReport(orderId: string): Promise<AcquisitionPersistedReport | null>;
  deleteReport(orderId: string, reportId: string, now: string): Promise<void>;
}

export interface RedisAcquisitionCommerceStoreOptions {
  redis: AcquisitionRedisClient;
  cipher: AcquisitionDataCipher;
  ledgerRetentionSeconds: number;
  reportRetentionSeconds: number;
  orderIdFactory?: () => string;
}

export class RedisAcquisitionCommerceStore
  implements AcquisitionCommerceStore
{
  private readonly orderIdFactory: () => string;

  constructor(private readonly options: RedisAcquisitionCommerceStoreOptions) {
    this.orderIdFactory = options.orderIdFactory ?? randomUUID;
  }

  async createPendingOrder(
    input: CreatePendingAcquisitionOrderInput,
  ): Promise<AcquisitionOrderRecord> {
    const orderId = this.orderIdFactory();
    const claimKey = this.key("report-order", input.reportId);
    const claim = await this.options.redis.set(
      claimKey,
      orderId,
      { ex: this.options.ledgerRetentionSeconds, nx: true },
    );
    if (claim !== "OK") {
      const existingOrderId = await this.options.redis.get<string>(claimKey);
      const existingOrder = existingOrderId
        ? await this.getOrder(existingOrderId)
        : null;
      if (
        existingOrder &&
        existingOrder.reportId === input.reportId &&
        existingOrder.stripePriceId === input.stripePriceId &&
        existingOrder.status === "pending_payment"
      ) {
        return existingOrder;
      }
      throw new AcquisitionOrderConflictError();
    }

    const order: AcquisitionOrderRecord = {
      commerceVersion: ACQUISITION_COMMERCE_VERSION,
      orderId,
      reportId: input.reportId,
      status: "pending_payment",
      stripePriceId: input.stripePriceId,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      amountTotal: null,
      currency: null,
      createdAt: input.now,
      updatedAt: input.now,
      paidAt: null,
      completedAt: null,
      reportDeletedAt: null,
      generationIdempotencyKey: null,
    };
    const job: AcquisitionJobRecord = {
      commerceVersion: ACQUISITION_COMMERCE_VERSION,
      orderId,
      reportId: input.reportId,
      status: "awaiting_payment",
      createdAt: input.now,
      updatedAt: input.now,
      completedAt: null,
      safeFailureCode: null,
    };

    try {
      await Promise.all([this.writeOrder(order), this.writeJob(job)]);
    } catch (error) {
      await this.options.redis.del(claimKey, this.orderKey(orderId), this.jobKey(orderId));
      throw error;
    }
    return order;
  }

  async attachCheckoutSession(
    orderId: string,
    checkoutSessionId: string,
    now: string,
  ) {
    const order = await this.requireOrder(orderId);
    if (order.status !== "pending_payment") {
      throw new AcquisitionOrderConflictError();
    }
    const updated = {
      ...order,
      stripeCheckoutSessionId: checkoutSessionId,
      updatedAt: now,
    };
    await this.writeOrder(updated);
    return updated;
  }

  async markPaid(input: MarkAcquisitionOrderPaidInput) {
    const order = await this.requireOrder(input.orderId);
    if (
      order.stripeCheckoutSessionId !== input.checkoutSessionId ||
      input.amountTotal < 1 ||
      !input.currency
    ) {
      throw new AcquisitionPaymentRequiredError();
    }
    if (
      order.status !== "pending_payment" &&
      order.status !== "paid" &&
      order.status !== "failed"
    ) {
      return order;
    }
    const updated: AcquisitionOrderRecord = {
      ...order,
      status: "paid",
      stripePaymentIntentId: input.paymentIntentId,
      amountTotal: input.amountTotal,
      currency: input.currency.toLowerCase(),
      paidAt: order.paidAt ?? input.paidAt,
      updatedAt: input.paidAt,
    };
    const job = await this.requireJob(input.orderId);
    await Promise.all([
      this.writeOrder(updated),
      this.writeJob({
        ...job,
        status: "ready",
        updatedAt: input.paidAt,
        safeFailureCode: null,
      }),
    ]);
    return updated;
  }

  async claimEntitlement(input: {
    orderId: string;
    reportId: string;
    idempotencyKey: string;
    now: string;
  }) {
    const order = await this.requireOrder(input.orderId);
    if (order.reportId !== input.reportId) {
      throw new AcquisitionEntitlementConsumedError();
    }
    if (order.status === "pending_payment") {
      throw new AcquisitionPaymentRequiredError();
    }
    if (order.status === "report_deleted") {
      throw new AcquisitionEntitlementConsumedError();
    }

    const consumptionKey = this.key("entitlement-use", input.orderId);
    const suppliedClaim = this.options.cipher.fingerprint(input.idempotencyKey);
    const claimed = await this.options.redis.set(consumptionKey, suppliedClaim, {
      ex: this.options.ledgerRetentionSeconds,
      nx: true,
    });
    if (claimed !== "OK") {
      const existing = await this.options.redis.get<string>(consumptionKey);
      if (existing !== suppliedClaim) {
        throw new AcquisitionEntitlementConsumedError();
      }
    }

    if (order.status === "completed") return order;
    const updated: AcquisitionOrderRecord = {
      ...order,
      status: "processing",
      updatedAt: input.now,
      generationIdempotencyKey:
        order.generationIdempotencyKey ?? input.idempotencyKey,
    };
    const job = await this.requireJob(input.orderId);
    await Promise.all([
      this.writeOrder(updated),
      this.writeJob({
        ...job,
        status: "processing",
        updatedAt: input.now,
        safeFailureCode: null,
      }),
    ]);
    return updated;
  }

  async markGenerationFailed(input: {
    orderId: string;
    reportId: string;
    now: string;
  }) {
    const order = await this.requireOrder(input.orderId);
    if (order.reportId !== input.reportId || order.status === "completed") return;
    const job = await this.requireJob(input.orderId);
    await Promise.all([
      this.writeOrder({ ...order, status: "failed", updatedAt: input.now }),
      this.writeJob({
        ...job,
        status: "failed",
        updatedAt: input.now,
        safeFailureCode: "generation_failed",
      }),
    ]);
  }

  async releaseEntitlementClaim(input: {
    orderId: string;
    idempotencyKey: string;
    now: string;
  }) {
    const order = await this.requireOrder(input.orderId);
    if (order.status === "completed" || order.status === "report_deleted") return;
    const consumptionKey = this.key("entitlement-use", input.orderId);
    const existing = await this.options.redis.get<string>(consumptionKey);
    if (existing !== this.options.cipher.fingerprint(input.idempotencyKey)) return;
    const job = await this.requireJob(input.orderId);
    await this.options.redis.del(consumptionKey);
    await Promise.all([
      this.writeOrder({
        ...order,
        status: "paid",
        updatedAt: input.now,
        generationIdempotencyKey: null,
      }),
      this.writeJob({
        ...job,
        status: "ready",
        updatedAt: input.now,
        safeFailureCode: null,
      }),
    ]);
  }

  async saveCompletedReport(input: {
    orderId: string;
    reportId: string;
    report: AcquisitionReasoningReport;
    now: string;
  }) {
    const order = await this.requireOrder(input.orderId);
    if (order.reportId !== input.reportId) {
      throw new AcquisitionEntitlementConsumedError();
    }
    const job = await this.requireJob(input.orderId);
    const persisted: AcquisitionPersistedReport = {
      commerceVersion: ACQUISITION_COMMERCE_VERSION,
      orderId: input.orderId,
      reportId: input.reportId,
      storedAt: input.now,
      report: input.report,
    };
    await Promise.all([
      this.options.redis.set(
        this.reportKey(input.orderId),
        this.options.cipher.encrypt(persisted),
        { ex: this.options.reportRetentionSeconds },
      ),
      this.writeOrder({
        ...order,
        status: "completed",
        updatedAt: input.now,
        completedAt: input.now,
      }),
      this.writeJob({
        ...job,
        status: "completed",
        updatedAt: input.now,
        completedAt: input.now,
        safeFailureCode: null,
      }),
    ]);
  }

  async getOrder(orderId: string) {
    return this.readEncrypted<AcquisitionOrderRecord>(this.orderKey(orderId));
  }

  async getJob(orderId: string) {
    return this.readEncrypted<AcquisitionJobRecord>(this.jobKey(orderId));
  }

  async getReport(orderId: string) {
    return this.readEncrypted<AcquisitionPersistedReport>(
      this.reportKey(orderId),
    );
  }

  async deleteReport(orderId: string, reportId: string, now: string) {
    const order = await this.requireOrder(orderId);
    if (order.reportId !== reportId) {
      throw new AcquisitionEntitlementConsumedError();
    }
    if (order.status === "report_deleted") return;
    if (order.status !== "completed" && order.status !== "failed") {
      throw new AcquisitionOrderConflictError();
    }
    const job = await this.requireJob(orderId);
    const generationKeys = order.generationIdempotencyKey
      ? [
          this.key("idem-result", order.generationIdempotencyKey),
          this.key("idem-lock", order.generationIdempotencyKey),
        ]
      : [];
    await this.options.redis.del(this.reportKey(orderId), ...generationKeys);
    await Promise.all([
      this.writeOrder({
        ...order,
        status: "report_deleted",
        updatedAt: now,
        reportDeletedAt: now,
      }),
      this.writeJob({
        ...job,
        status: "report_deleted",
        updatedAt: now,
      }),
    ]);
  }

  private key(scope: string, identifier: string) {
    return this.options.cipher.opaqueKey(scope, identifier);
  }

  private orderKey(orderId: string) {
    return this.key("order", orderId);
  }

  private jobKey(orderId: string) {
    return this.key("job", orderId);
  }

  private reportKey(orderId: string) {
    return this.key("report", orderId);
  }

  private async readEncrypted<T>(key: string) {
    const encrypted = await this.options.redis.get<string>(key);
    return encrypted ? this.options.cipher.decrypt<T>(encrypted) : null;
  }

  private async requireOrder(orderId: string) {
    const order = await this.getOrder(orderId);
    if (!order) throw new AcquisitionOrderNotFoundError();
    return order;
  }

  private async requireJob(orderId: string) {
    const job = await this.getJob(orderId);
    if (!job) throw new AcquisitionOrderNotFoundError();
    return job;
  }

  private async writeOrder(order: AcquisitionOrderRecord) {
    await this.options.redis.set(
      this.orderKey(order.orderId),
      this.options.cipher.encrypt(order),
      { ex: this.options.ledgerRetentionSeconds },
    );
  }

  private async writeJob(job: AcquisitionJobRecord) {
    await this.options.redis.set(
      this.jobKey(job.orderId),
      this.options.cipher.encrypt(job),
      { ex: this.options.ledgerRetentionSeconds },
    );
  }
}
