# Acquisition Lens — Step 5 Production Orchestration

## Purpose

Step 5 connects the four approved Acquisition Lens layers into one controlled
backend execution path:

`Intake → Underwriting → Deal Screen → Ella Reasoning → Structured Report`

The service validates the complete transaction packet, establishes one
authoritative source for calculated fields, coalesces duplicate requests, and
returns safe HTTP failures without exposing confidential deal data or provider
details.

It does not change any Exit Desk route, prompt, checkout, report, email, price,
or Webflow integration.

## Governing principle

**The caller supplies facts and assumptions. Code controls sequence and
calculations. Ella interprets only the resulting evidence packet.**

The caller cannot submit a recommendation, confidence level, standalone value,
hard-ceiling conclusion, or downside-survivability conclusion. Those fields are
created inside the backend from the approved deterministic engines.

## Authoritative execution sequence

1. **Validate the boundary**
   - Require orchestration contract version `1.0.0`.
   - Reject unsupported fields rather than silently accepting them.
   - Validate every nested intake, Deal Screen fact, underwriting assumption,
     and evidence record.
   - Require target identity, buyer type, revenue, reported EBITDA, reported
     SDE, and owner-operated status to agree across their controlling inputs.
2. **Run deterministic underwriting**
   - Normalize earnings and calculate standalone value, equity value, sources
     and uses, returns, and scenarios using the Step 3 engine.
3. **Construct the Deal Screen input**
   - Supply annual revenue, earnings, and free cash flow from the underwriting
     input.
   - Supply standalone value, hard ceiling, and worst-case survivability from
     deterministic underwriting.
   - Supply the seller asking price from the canonical acquisition intake.
   - Combine those controlled fields with the non-calculated screen facts.
4. **Run the deterministic Deal Screen**
   - Apply Step 2 hard stops, price discipline, seller-control logic, evidence
     gates, and LOI readiness.
5. **Run Ella reasoning**
   - Send the intake and unchanged deterministic outputs to the Step 4 engine.
   - Require evidence-cited structured output.
   - Preserve the deterministic recommendation, confidence, vetoes, and math.
6. **Return the final report**
   - Return one structured report with request identity, completion time, and
     idempotency status.

## API boundary

The server-only endpoint is:

`POST /api/acquisition/generate`

Required headers:

- `Authorization: Bearer <ACQUISITION_API_SECRET>`
- `Content-Type: application/json`
- `Idempotency-Key: <8-128 URL-safe characters>`
- Optional `X-Request-Id` using the same format; the server generates one when
  omitted or invalid.

The endpoint:

- Uses constant-time comparison of hashed credentials.
- Accepts JSON only.
- Rejects request bodies larger than 1 MB.
- Adds `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and an
  `X-Request-Id` response header.
- Does not emit CORS headers. It is intentionally server-to-server and must not
  be called from public Webflow browser code with the shared secret.
- Does not expose model-provider errors, stack traces, prompts, or confidential
  request fields in the response.

## Idempotency

The orchestration service fingerprints the canonical validated payload with
SHA-256.

- The first request for a key returns `idempotency: created`.
- Concurrent or later requests with the same key and payload share the same
  execution and return `idempotency: replayed`.
- Reusing a key for a different payload returns HTTP `409`.
- A failed execution releases its claim so the same request can be retried.

The included in-memory store retains at most 25 completed reports per running
instance. It provides process-level duplicate protection for this build, tests,
and a single warm runtime. It is not durable across serverless cold starts or
multiple instances. A shared durable adapter must replace it before payment or
public production traffic is activated; the orchestration interface is already
designed for that replacement.

## Safe failure contract

The HTTP layer returns stable error codes:

- `unauthorized` — missing or invalid server credential.
- `service_unavailable` — required server configuration is absent.
- `invalid_content_type` — request is not JSON.
- `payload_too_large` — request exceeds 1 MB.
- `invalid_json` — body cannot be parsed.
- `invalid_request` — contract, identity, financial, evidence, or idempotency
  validation failed.
- `idempotency_conflict` — key was reused for a different payload.
- `reasoning_unavailable` — retryable reasoning-provider or structured-output
  failure.
- `internal_error` — non-provider orchestration failure.

Only validation messages controlled by Acquisition Lens are returned. Provider
messages and internal errors remain server-side.

## Configuration

The Step 5 runtime uses:

- `ACQUISITION_API_SECRET`
- `ANTHROPIC_API_KEY`
- `ACQUISITION_REASONING_MODEL`
- `ACQUISITION_REASONING_MAX_TOKENS`
- `ACQUISITION_REASONING_TEMPERATURE`

The model is constructed lazily after authentication and payload validation.
Missing model configuration therefore cannot break the existing application at
build time or alter Exit Desk behavior.

`ACQUISITION_API_SECRET` must contain at least 32 characters. A missing or weak
secret keeps the endpoint unavailable rather than silently weakening access
control.

## Explicit non-goals

Step 5 does not:

- Add or change Stripe products, prices, checkout, or revenue routing.
- Expose the API secret to Webflow or any browser.
- Add CORS or activate a Webflow form.
- Add document uploads, a VDR, or confidential file storage.
- Persist reports in a database or create authenticated report URLs.
- Render a PDF, send email, or deliver a completed report.
- Add rate-based product routing.
- Change the existing Exit Desk `$199` / `$499` paths or any Exit Desk code.

Durable persistence, report rendering and delivery, payments, Webflow intake,
and the final product merge remain later, separately reviewed steps.
