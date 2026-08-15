# Acquisition Lens — Step 6 Payment, Entitlement, and Persistence

## Purpose

Step 6 adds the production control plane around the approved Acquisition Lens
analysis pipeline:

`Checkout → verified payment → one report entitlement → generation job → encrypted report`

The price is selected only by `ACQUISITION_STRIPE_PRICE_ID`. No dollar amount,
revenue tier, or Exit Desk price is copied into Acquisition Lens code.

This step does not change Exit Desk. Its existing below-$1M `$199` route and
above-$1M `$499` route remain separate and untouched.

## Activation posture

The new endpoints are server-to-server, emit no CORS headers, and fail closed
until every required secret, price, storage credential, encryption key, and
checkout return URL is configured. Step 6 does not connect Webflow and does not
activate public traffic.

Required production configuration:

- `ACQUISITION_API_SECRET`
- `ACQUISITION_DATA_ENCRYPTION_KEY`
- `ACQUISITION_REDIS_REST_URL`
- `ACQUISITION_REDIS_REST_TOKEN`
- `ACQUISITION_STRIPE_PRICE_ID`
- `ACQUISITION_STRIPE_WEBHOOK_SECRET`
- `ACQUISITION_CHECKOUT_SUCCESS_URL`
- `ACQUISITION_CHECKOUT_CANCEL_URL`
- the Step 5 Anthropic reasoning configuration

The encryption key must be a base64-encoded 32-byte random value. Checkout
return URLs must be HTTPS, and the success URL must include
`{CHECKOUT_SESSION_ID}`.

## Checkout and payment verification

`POST /api/acquisition/checkout` accepts only:

```json
{ "reportId": "acq-example-001" }
```

It requires the shared bearer credential and an `Idempotency-Key`. The route:

1. reserves one opaque order for the report;
2. creates a Stripe Checkout Session for the configured Acquisition Lens price;
3. returns the opaque order ID and Stripe-hosted checkout URL; and
4. replays the same result across safe retries.

`POST /api/acquisition/webhooks/stripe` verifies the raw request with the
Acquisition Lens-specific Stripe webhook secret. A report entitlement is
activated only when all of the following match:

- event type is a completed or asynchronously paid Checkout Session;
- session mode is `payment` and `payment_status` is `paid`;
- the Stripe client reference and stored order agree;
- the product metadata identifies Acquisition Lens;
- the session has exactly one line item; and
- the expanded line item uses `ACQUISITION_STRIPE_PRICE_ID`.

No customer name or email address is stored in the Acquisition Lens database.
Stripe remains the payment system of record.

## One entitlement, one report

Paid generation uses the existing `POST /api/acquisition/generate` endpoint and
adds one required header:

`X-Acquisition-Order-Id: <opaque order id>`

The durable store atomically binds that order to the first generation
`Idempotency-Key`. Retries using the same order, report, payload, and key are
allowed. A different report or idempotency key receives a conflict and cannot
spend the entitlement again.

If deterministic request validation fails, the claim is released so the same
paid order can submit corrected inputs. Provider or runtime failures retain the
original claim and require a safe retry with the same idempotency key.

The production wrapper cannot change underwriting, the authoritative Deal
Screen, the reasoning evidence packet, or the deterministic recommendation. It only
controls payment eligibility and persistence around the Step 5 orchestrator.

## Durable idempotency and job lifecycle

The live route replaces Step 5's instance-local idempotency store with a shared
Redis REST implementation. It uses:

- an opaque HMAC-derived Redis key;
- a short-lived distributed execution lock;
- a payload fingerprint to reject key reuse;
- an encrypted completed result for cold-start and multi-instance replay; and
- a retryable lock release after failures.

The job lifecycle is:

`awaiting_payment → ready → processing → completed | failed → report_deleted`

`GET /api/acquisition/orders/{orderId}` returns payment state, job state,
report availability, and completion time. It requires the shared bearer
credential and never returns the report or deal packet.

## Confidentiality, retention, and deletion

All order, job, report, and idempotency-result values are encrypted with
AES-256-GCM before leaving the application process. Redis keys are HMAC-derived,
so a report ID or target name is not present in the keyspace.

Defaults:

- completed report and generation replay: 30 days;
- checkout replay: 24 hours; and
- minimal internal payment/job ledger: 90 days.

The configurable retention values are bounded to 365 days.

`DELETE /api/acquisition/orders/{orderId}` requires both bearer authorization
and `X-Acquisition-Report-Id`. It deletes the encrypted report and its durable
generation replay, then marks the minimal ledger record `report_deleted` so the
paid entitlement cannot be reused.

## Abuse and failure controls

- Authenticated checkout and generation calls use a shared Redis fixed-window
  rate limit.
- Checkout bodies are limited to 16 KB; webhook and generation bodies are
  limited to 1 MB.
- Errors expose stable Acquisition Lens codes, never provider messages, report
  contents, prompts, Redis credentials, Stripe secrets, or stack traces.
- No request body, customer email, transaction packet, or report content is
  written to application logs.
- Missing storage, encryption, payment, or reasoning configuration keeps the
  service unavailable rather than bypassing a control.

## Explicit non-goals

Step 6 does not:

- choose or expose the final Acquisition Lens retail price;
- add revenue-based routing to Acquisition Lens;
- change Exit Desk checkout, pricing, prompts, reports, or webhooks;
- add Webflow forms, browser CORS, or a public entitlement exchange;
- render PDF/HTML, send email, or deliver the persisted report; or
- merge the Acquisition Lens experience into the live site.

Report rendering and delivery, Webflow intake, and final activation remain
separately reviewed later steps.
