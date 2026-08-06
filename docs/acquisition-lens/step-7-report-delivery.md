# Acquisition Lens Step 7: IC Memo Rendering and Secure Delivery

Step 7 converts the persisted `AcquisitionReasoningReport` into a confidential buyer-side investment committee memorandum and delivers it as a PDF attachment. It does not expose the report through a public URL or browser response.

## Scope

- Render the authoritative structured report into a deterministic PDF.
- Preserve the report contract's section order, decision posture, calculations, evidence references, authority note, and limitations.
- Send a concise HTML and plain-text cover email with the PDF attached.
- Require the paid order, completed report, matching report ID, server bearer secret, and a valid idempotency key.
- Keep the recipient email transient. The raw address is not written to Redis or returned by the API.
- Coalesce delivery retries in the encrypted Redis idempotency store and pass a hashed provider idempotency key to Resend.

## Private delivery endpoint

`POST /api/acquisition/orders/{orderId}/deliver`

Required headers:

- `Authorization: Bearer {ACQUISITION_API_SECRET}`
- `Content-Type: application/json`
- `Idempotency-Key: {8-128 URL-safe characters}`
- `X-Acquisition-Report-Id: {reportId}`

Exact JSON body:

```json
{
  "email": "authorized-recipient@example.com"
}
```

The successful response contains delivery status, report and order identifiers, timestamp, and replay status. It never contains the report, the PDF, the recipient address, or the email provider identifier.

## Environment

Step 7 uses the existing Step 6 runtime variables plus:

- `RESEND_API_KEY` — server-only Resend API credential.
- `ACQUISITION_RESEND_FROM_EMAIL` — optional complete sender identity. Defaults to `Acquisition Lens by Mike Ye <mike@mikeye.com>`.
- `ACQUISITION_REPORT_SUBJECT_PREFIX` — optional subject prefix. Defaults to `Your Acquisition Lens Memo`.

If delivery-specific configuration is missing, the delivery endpoint fails closed. Checkout, payment, report generation, order status, and deletion remain independent.

## Report controls

- Deterministic underwriting and Deal Screen outputs remain authoritative.
- Buyer-specific synergy remains excluded from standalone value.
- Narrative conclusions retain point-of-use evidence IDs.
- Seller-provided, buyer-provided, calculated, externally verified, claimed, missing, and contradictory evidence retain their source/status labels.
- The memo is explicitly not a fairness opinion, valuation opinion, legal opinion, or commitment to transact.
- Independent financial, tax, legal, commercial, insurance, technology, and operational diligence remains required.

## Security and reliability

- Node-only, dynamic route with no CORS activation.
- Constant-time bearer-secret verification.
- 16 KB request-body limit and strict one-field JSON input.
- Per-runtime delivery rate limit through the existing encrypted Redis limiter.
- Report/order/entitlement identity matching before rendering.
- Encrypted Redis idempotency result retained for the report-retention period.
- Provider-side idempotency key is a SHA-256 derivative of the request key; the raw request key is not sent to Resend.
- No public PDF download link and no report body in API responses or logs.

## Explicit non-goals

- Webflow intake or CORS activation.
- Supabase migration or use.
- Public or presigned report downloads.
- Customer portal, account history, or report library.
- Changes to Exit Desk rendering, delivery, routing, or pricing.
- Changes to Acquisition Lens checkout pricing.

Webflow intake and final activation remain later steps.
