import { createHash } from "node:crypto";

import { renderAsync } from "@react-email/render";
import React from "react";

import { AcquisitionLensReportEmail } from "@/emails/AcquisitionLensReport";

import type { AcquisitionCommerceStore } from "./commerce";
import { AcquisitionEntitlementConsumedError } from "./commerce";
import type { AcquisitionIdempotencyStore } from "./idempotency";
import { fingerprintAcquisitionPayload } from "./idempotency";
import { acquisitionLensFilename, generateAcquisitionLensPDF } from "./report-pdf";

export const ACQUISITION_DELIVERY_VERSION = "1.0.0" as const;

export interface AcquisitionDeliveryResult {
  deliveryVersion: typeof ACQUISITION_DELIVERY_VERSION;
  orderId: string;
  reportId: string;
  status: "delivered";
  deliveredAt: string;
}

export interface AcquisitionEmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment: {
    filename: string;
    content: Buffer;
    contentType: "application/pdf";
  };
  providerIdempotencyKey: string;
}

export interface AcquisitionEmailClient {
  send(message: AcquisitionEmailMessage): Promise<{ id: string }>;
}

export class AcquisitionDeliveryConfigurationError extends Error {
  constructor(message = "Acquisition Lens delivery is not configured.") {
    super(message);
    this.name = "AcquisitionDeliveryConfigurationError";
  }
}

export class AcquisitionReportNotReadyError extends Error {
  constructor() {
    super("The Acquisition Lens report is not ready for delivery.");
    this.name = "AcquisitionReportNotReadyError";
  }
}

export class AcquisitionDeliveryProviderError extends Error {
  constructor() {
    super("The Acquisition Lens report could not be delivered.");
    this.name = "AcquisitionDeliveryProviderError";
  }
}

export class ResendAcquisitionEmailClient implements AcquisitionEmailClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async send(message: AcquisitionEmailMessage) {
    const apiKey = this.apiKey?.trim();
    if (!apiKey) throw new AcquisitionDeliveryConfigurationError();

    let response: Response;
    try {
      response = await this.fetchImplementation("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.providerIdempotencyKey,
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          attachments: [
            {
              filename: message.attachment.filename,
              content: message.attachment.content.toString("base64"),
              content_type: message.attachment.contentType,
            },
          ],
        }),
      });
    } catch {
      throw new AcquisitionDeliveryProviderError();
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const id =
      payload &&
      typeof payload === "object" &&
      typeof (payload as Record<string, unknown>).id === "string"
        ? (payload as { id: string }).id
        : null;
    if (!response.ok || !id) throw new AcquisitionDeliveryProviderError();
    return { id };
  }
}

export interface AcquisitionDeliveryServiceOptions {
  commerceStore: Pick<AcquisitionCommerceStore, "getOrder" | "getReport">;
  idempotencyStore: AcquisitionIdempotencyStore<AcquisitionDeliveryResult>;
  emailClient: AcquisitionEmailClient;
  from: string;
  subjectPrefix?: string;
  now?: () => Date;
}

export class AcquisitionDeliveryService {
  private readonly now: () => Date;

  constructor(private readonly options: AcquisitionDeliveryServiceOptions) {
    this.now = options.now ?? (() => new Date());
  }

  async deliver(input: {
    orderId: string;
    reportId: string;
    recipient: string;
    idempotencyKey: string;
  }) {
    const recipient = normalizeAcquisitionRecipient(input.recipient);
    const fingerprint = fingerprintAcquisitionPayload({
      orderId: input.orderId,
      reportId: input.reportId,
      recipient,
    });

    return this.options.idempotencyStore.execute(
      input.idempotencyKey,
      fingerprint,
      async () => {
        const [order, persisted] = await Promise.all([
          this.options.commerceStore.getOrder(input.orderId),
          this.options.commerceStore.getReport(input.orderId),
        ]);
        if (!order || !persisted || order.status !== "completed") {
          throw new AcquisitionReportNotReadyError();
        }
        if (
          order.reportId !== input.reportId ||
          persisted.reportId !== input.reportId ||
          persisted.report.reportId !== input.reportId
        ) {
          throw new AcquisitionEntitlementConsumedError();
        }
        const from = this.options.from.trim();
        if (!from || /[\r\n]/.test(from)) {
          throw new AcquisitionDeliveryConfigurationError();
        }

        const report = persisted.report;
        const subjectPrefix =
          singleLine(this.options.subjectPrefix || "") ||
          "Your Acquisition Lens Memo";
        const email = (
          <AcquisitionLensReportEmail
            targetName={report.targetName}
            headline={report.investmentCommitteeSnapshot.headline}
            posture={report.decision.posture}
            confidence={report.decision.confidence}
            reliancePosture={report.investmentCommitteeSnapshot.reliancePosture}
            reportId={report.reportId}
          />
        );
        const [pdf, html, text] = await Promise.all([
          generateAcquisitionLensPDF(report),
          renderAsync(email),
          renderAsync(email, { plainText: true }),
        ]);
        const providerIdempotencyKey = `acquisition-report/${createHash("sha256")
          .update(input.idempotencyKey)
          .digest("base64url")}`;
        await this.options.emailClient.send({
          from,
          to: recipient,
          subject: `${subjectPrefix} — ${singleLine(report.targetName)}`,
          html,
          text,
          attachment: {
            filename: acquisitionLensFilename(report.targetName),
            content: pdf,
            contentType: "application/pdf",
          },
          providerIdempotencyKey,
        });

        return {
          deliveryVersion: ACQUISITION_DELIVERY_VERSION,
          orderId: input.orderId,
          reportId: input.reportId,
          status: "delivered",
          deliveredAt: this.now().toISOString(),
        };
      },
    );
  }
}

export function normalizeAcquisitionRecipient(value: string) {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new TypeError("A valid delivery email is required.");
  }
  return normalized;
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}
