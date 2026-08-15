# Acquisition Lens — Webflow Integration Handoff

## Status

The Webflow experience and frozen backend v1 are individually ready for
integration work, but they are intentionally not connected or published.

| Surface | Route | Current state |
| --- | --- | --- |
| Landing | `/acquisition-lens` | Draft; marketing and doctrine |
| Deal Screen | `/screen` | Draft; browser-only categorical screen |
| Checkout | `/checkout` | Draft; button intentionally inactive |
| Paid intake | `/intake` | Draft; validation only; transmits nothing |
| Receipt | `/success` | Draft; post-intake confirmation |

All five pages are excluded from the Webflow sitemap. The backend defaults to
`ACQUISITION_BACKEND_MODE=disabled`.

## Non-negotiable security boundary

Webflow browser code must never receive, embed, log, or proxy
`ACQUISITION_API_SECRET`, Stripe secret keys, the Stripe webhook secret,
Redis credentials, the data-encryption key, Anthropic credentials, or Resend
credentials.

The existing Acquisition Lens checkout, generation, order, delivery, and
readiness endpoints are authenticated server-to-server surfaces. They are not
browser APIs. Integration therefore requires a narrow public bridge that:

1. accepts only the browser-safe fields required for its step;
2. validates origin, content type, payload size, rate limit, and bot controls;
3. creates or verifies a payment-bound, short-lived customer token;
4. calls the authenticated Acquisition Lens routes only from the server;
5. returns no provider response, internal report, credential, or confidential
   record to the browser.

## Intended customer flow

1. The free Deal Screen remains local to the browser and sends no data.
2. Checkout requests a server-generated report ID and Stripe Checkout session
   through the public bridge.
3. Stripe redirects a successful purchase to the paid intake with
   `{CHECKOUT_SESSION_ID}` in the URL. The bridge exchanges that Stripe
   session for a short-lived, signed intake token after verifying the paid
   order.
4. The intake submits its versioned form packet and signed token to the bridge.
5. The bridge stages the raw packet in encrypted storage and invokes a
   server-side intake assembler.
6. The assembler creates the frozen v1 `AcquisitionOrchestrationPayload`.
   Missing deterministic assumptions produce a needs-more-information state;
   they are never invented in the browser or reasoning layer.
7. The paid entitlement is claimed once, the memo is generated, persisted for
   the configured retention period, rendered to PDF, and privately emailed.
8. The browser is redirected to `/success`. No public report URL is created.

The Stripe success URL must contain `{CHECKOUT_SESSION_ID}`. The cancel URL
must return to Checkout without creating a paid entitlement.

## Intake-to-contract mapping

The Webflow intake is a user-friendly fact packet, not the canonical backend
payload. The server-side assembler owns all type conversion and enrichment.

### Direct mappings

- Buyer: buyer type, thesis, industries, geographies, operating intent,
  experience, equity, financing plan, return objective, hold period, and
  constraints.
- Target: company identity and description, industry, geography, operating
  history, revenue, reported EBITDA, reported SDE, revenue and margin trends,
  revenue model, recurring revenue, concentration, owner role, transition,
  management, employees, key-person risk, systems, financial cleanliness,
  add-backs, working capital, capital expenditure, facilities, legal exposure,
  defensibility, industry dynamics, AI exposure, seller motivation, and known
  diligence issues.
- Terms: stage, structure, asking price, buyer equity, senior debt, seller
  financing, earnout, rollover, assumed debt, working capital, fees, and other
  material terms.
- Memo context: source-material summary, buyer questions, and additional
  context.

### Fields requiring controlled transformation

- Currency inputs become `MoneyAmount` values in USD.
- Comma-delimited industries, geographies, constraints, issues, terms, and
  questions become trimmed, de-duplicated arrays.
- Free-text trends are normalized to the contract enums or retained as
  evidence when they cannot be safely normalized.
- Source-material checkboxes become evidence-availability records; checking a
  box does not make the evidence verified.
- Seller control, ownership alignment, response quality, and defensibility
  must populate `dealScreenFacts`, not overwrite deterministic calculations.
- Buyer-specific synergy remains excluded from standalone value.
- Delivery email belongs to commerce/delivery metadata and must not be placed
  inside the reasoning prompt unless required for delivery.

### Deterministic inputs not yet captured in canonical form

The current friendly intake does not by itself provide every field required by
`AcquisitionUnderwritingInput`, including:

- structured normalization adjustments and evidence treatment;
- valuation basis, low/high multiples, and replacement-cost range;
- cash delivered, debt-like items, working-capital peg, and deferred
  maintenance;
- annual senior and seller debt service;
- buyer annual cash flows and exit equity value;
- numeric worst, most-likely, and best scenario assumptions;
- minimum annual cash buffers and free-cash-flow conversion.

The integration must obtain these through a controlled follow-up,
analyst/operator normalization, or a separately approved assumption workflow.
Until that exists, the assembler must stop with needs-more-information rather
than populate zeros or model-generated assumptions.

## Browser response contract

Public bridge responses should be minimal:

- Checkout: `checkoutUrl` only after a valid session is created.
- Intake verification: paid/unpaid and token expiry; never payment details.
- Intake submission: accepted, needs-more-information, or safe retry state.
- Receipt: opaque order status only; never the report body.

All responses require `Cache-Control: no-store`,
`X-Content-Type-Options: nosniff`, a request ID, and safe error messages.

## Activation checklist

1. Keep `ACQUISITION_BACKEND_MODE=disabled`.
2. Deploy the frozen backend and verify authenticated readiness as
   `configurationStatus=ready` and `operationalStatus=frozen`.
3. Build and test the public checkout/intake bridge and server-side assembler.
4. Configure the Stripe price and payment URLs without hard-coding a price in
   Webflow.
5. Run controlled test-mode checkout, webhook, paid intake, generation,
   delivery, retention, retry, and deletion tests with non-customer data.
6. Verify keyboard, mobile, screen-reader, error, timeout, duplicate-submit,
   abandoned-checkout, and webhook-delay paths.
7. Return the backend to `disabled` after testing.
8. Publish and activate only under a separately approved launch step.

## Current blockers by design

- No browser-safe public bridge.
- No paid-session-to-intake token exchange.
- No raw-intake staging and canonical payload assembler.
- No approved Acquisition Lens Stripe price.
- No configured backend deployment URL for the smoke verifier.
- No production activation approval.

These are launch gates, not defects in the frozen backend or approved Webflow
design.
