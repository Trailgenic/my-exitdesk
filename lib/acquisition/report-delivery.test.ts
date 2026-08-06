import assert from "node:assert/strict";
import test from "node:test";

import type {
  AcquisitionOrderRecord,
  AcquisitionPersistedReport,
} from "./commerce";
import {
  AcquisitionDeliveryService,
  ResendAcquisitionEmailClient,
  type AcquisitionEmailClient,
  type AcquisitionEmailMessage,
} from "./delivery";
import { handleAcquisitionDeliveryRequest } from "./delivery-http";
import { InMemoryAcquisitionIdempotencyStore } from "./idempotency";
import { acquisitionLensFilename } from "./report-pdf";
import { makeAcquisitionReportFixture } from "./report-test-fixture";

const NOW = "2026-08-06T18:00:00.000Z";
const API_SECRET = "a".repeat(32);

class CapturingEmailClient implements AcquisitionEmailClient {
  readonly messages: AcquisitionEmailMessage[] = [];

  async send(message: AcquisitionEmailMessage) {
    this.messages.push(message);
    return { id: "email-provider-001" };
  }
}

function setupService() {
  const report = makeAcquisitionReportFixture();
  const order: AcquisitionOrderRecord = {
    commerceVersion: "1.0.0",
    orderId: "order-00000001",
    reportId: report.reportId,
    status: "completed",
    stripePriceId: "price_acquisition",
    stripeCheckoutSessionId: "cs_paid",
    stripePaymentIntentId: "pi_paid",
    amountTotal: 49_900,
    currency: "usd",
    createdAt: NOW,
    updatedAt: NOW,
    paidAt: NOW,
    completedAt: NOW,
    reportDeletedAt: null,
    generationIdempotencyKey: "generation-key-001",
  };
  const persisted: AcquisitionPersistedReport = {
    commerceVersion: "1.0.0",
    orderId: order.orderId,
    reportId: report.reportId,
    storedAt: NOW,
    report,
  };
  const emailClient = new CapturingEmailClient();
  const service = new AcquisitionDeliveryService({
    commerceStore: {
      getOrder: async (orderId) => (orderId === order.orderId ? order : null),
      getReport: async (orderId) => (orderId === order.orderId ? persisted : null),
    },
    idempotencyStore: new InMemoryAcquisitionIdempotencyStore(),
    emailClient,
    from: "Acquisition Lens <reports@mikeye.com>",
    now: () => new Date(NOW),
  });
  return { emailClient, order, report, service };
}

function deliveryRequest(email: string, idempotencyKey = "delivery-key-001") {
  return new Request("https://example.test/api/acquisition/deliver", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Acquisition-Report-Id": "acq-harbor-services-001",
    },
    body: JSON.stringify({ email }),
  });
}

test("renders and delivers one confidential PDF without exposing the recipient", async () => {
  const { emailClient, order, report, service } = setupService();
  const first = await handleAcquisitionDeliveryRequest(
    deliveryRequest("Buyer@Example.com"),
    order.orderId,
    {
      apiSecret: API_SECRET,
      deliveryService: service,
      requestIdFactory: () => "request-0000001",
    },
  );
  const firstBody = await first.json();

  assert.equal(first.status, 200);
  assert.equal(firstBody.result.status, "delivered");
  assert.equal(firstBody.result.replayed, false);
  assert.doesNotMatch(JSON.stringify(firstBody), /buyer@example\.com/i);
  assert.equal(emailClient.messages.length, 1);

  const message = emailClient.messages[0];
  assert.equal(message.to, "buyer@example.com");
  assert.equal(message.attachment.filename, acquisitionLensFilename(report.targetName));
  assert.equal(message.attachment.content.subarray(0, 4).toString(), "%PDF");
  assert.ok(message.attachment.content.byteLength > 20_000);
  assert.match(message.html, /Harbor Business Services/);
  assert.match(message.text, /full Acquisition Lens memorandum is attached/i);
  assert.match(message.providerIdempotencyKey, /^acquisition-report\/[A-Za-z0-9_-]+$/);

  const replay = await handleAcquisitionDeliveryRequest(
    deliveryRequest("buyer@example.com"),
    order.orderId,
    {
      apiSecret: API_SECRET,
      deliveryService: service,
      requestIdFactory: () => "request-0000002",
    },
  );
  const replayBody = await replay.json();
  assert.equal(replay.status, 200);
  assert.equal(replayBody.result.replayed, true);
  assert.equal(emailClient.messages.length, 1);

  const conflict = await handleAcquisitionDeliveryRequest(
    deliveryRequest("different@example.com"),
    order.orderId,
    {
      apiSecret: API_SECRET,
      deliveryService: service,
      requestIdFactory: () => "request-0000003",
    },
  );
  assert.equal(conflict.status, 409);
  assert.equal(emailClient.messages.length, 1);
});

test("sends provider-side idempotency and a PDF attachment through Resend", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const client = new ResendAcquisitionEmailClient(
    "re_test_key",
    (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(JSON.stringify({ id: "email-001" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
  );
  const result = await client.send({
    from: "Acquisition Lens <reports@mikeye.com>",
    to: "buyer@example.com",
    subject: "Acquisition Lens",
    html: "<p>Attached.</p>",
    text: "Attached.",
    attachment: {
      filename: "Acquisition-Lens-Target.pdf",
      content: Buffer.from("%PDF-test"),
      contentType: "application/pdf",
    },
    providerIdempotencyKey: "acquisition-report/provider-key",
  });

  assert.equal(result.id, "email-001");
  assert.equal(capturedUrl, "https://api.resend.com/emails");
  assert.equal(
    new Headers(capturedInit?.headers).get("idempotency-key"),
    "acquisition-report/provider-key",
  );
  assert.doesNotMatch(
    String(capturedInit?.body),
    /re_test_key/,
  );
  assert.match(String(capturedInit?.body), /application\/pdf/);
});

test("fails closed on unauthenticated or malformed delivery requests", async () => {
  const { order, service } = setupService();
  const unauthorized = await handleAcquisitionDeliveryRequest(
    new Request("https://example.test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "delivery-key-002",
        "X-Acquisition-Report-Id": "acq-harbor-services-001",
      },
      body: JSON.stringify({ email: "buyer@example.com" }),
    }),
    order.orderId,
    {
      apiSecret: API_SECRET,
      deliveryService: service,
      requestIdFactory: () => "request-0000004",
    },
  );
  assert.equal(unauthorized.status, 401);

  const invalidEmail = await handleAcquisitionDeliveryRequest(
    deliveryRequest("not-an-email", "delivery-key-003"),
    order.orderId,
    {
      apiSecret: API_SECRET,
      deliveryService: service,
      requestIdFactory: () => "request-0000005",
    },
  );
  assert.equal(invalidEmail.status, 400);
});
