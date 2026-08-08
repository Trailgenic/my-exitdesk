# Acquisition Lens Step 8: Backend Deployment and Freeze

Step 8 closes the GitHub backend phase with an explicit activation barrier, a side-effect-free readiness contract, automated regression checks, and a repeatable deployment smoke test. The frozen backend is ready for later Webflow integration without making the customer flow live now.

## Activation modes

`ACQUISITION_BACKEND_MODE` is mandatory for deliberate activation and defaults to `disabled` when absent.

- `disabled` — the fully configured backend remains frozen. Transaction routes cannot construct the production runtime.
- `internal` — server-to-server validation is enabled before Webflow integration. Test or live Stripe server credentials are accepted.
- `live` — final production activation. A live Stripe server credential is required in addition to every other readiness check.

Possessing or adding provider secrets cannot activate the backend by itself. Every transaction route passes through the production runtime and therefore through this barrier.

## Operator readiness contract

`GET /api/acquisition/readiness` is a private, server-to-server endpoint.

Required header:

```text
Authorization: Bearer {ACQUISITION_API_SECRET}
```

The response exposes only backend and contract versions, activation mode, named readiness checks, and status. It never returns credential values, customer data, report data, or provider responses.

The inspection is deliberately side-effect-free. It validates configuration shape but does not contact Redis, Stripe, Anthropic, or Resend. Provider connectivity and permissions are verified through controlled transactional smoke tests, not through an unauthenticated health probe.

Status behavior:

- `401` for missing or incorrect operator authorization.
- `503` when the operator secret is itself unsafe or any required configuration is incomplete.
- `200` when configuration is complete, including a deliberately `disabled` deployment whose operational status is `frozen`.

## Frozen v1 contract

The readiness response pins the backend at `1.0.0` and reports the frozen intake, orchestration, reasoning, commerce, and delivery contract versions. Changes to those contracts after Step 8 require an explicit version decision, regression review, and a new deployment checkpoint.

The frozen backend includes:

- deterministic Deal Screen and underwriting engines;
- Mike Ye acquisition doctrine and Ella reasoning controls;
- payment, entitlement, encrypted persistence, retention, and deletion;
- confidential IC memo rendering and private email delivery;
- authentication, rate limiting, idempotency, evidence handling, and fail-closed configuration.

## Deployment sequence

1. Configure every Acquisition Lens environment variable in `.env.example`, leaving `ACQUISITION_BACKEND_MODE=disabled`.
2. Deploy the backend and call the authenticated readiness endpoint. Confirm `configurationStatus=ready` and `operationalStatus=frozen`.
3. Change only the mode to `internal`, redeploy, and run the deployment verification command below.
4. Perform controlled server-to-server checkout, webhook, generation, order, delivery, and deletion tests with non-customer test data.
5. Return the deployment to `disabled` until Webflow integration is ready.
6. Use `live` only during the later, separately approved production launch.

```bash
ACQUISITION_DEPLOYMENT_URL=https://backend.example.com \
ACQUISITION_API_SECRET=replace-with-the-server-secret \
ACQUISITION_EXPECTED_BACKEND_MODE=internal \
npm run verify:acquisition:deployment
```

The smoke command verifies that anonymous access is rejected, authenticated configuration is ready, the frozen backend version is present, and the reported operational state matches the selected mode. It does not print the operator secret or readiness body.

## Automated regression gate

The Acquisition Lens GitHub Actions workflow runs TypeScript validation, the complete Acquisition Lens test suite, and the production Next.js build on pull requests and pushes to `main`. Placeholder CI values pass configuration construction without calling external providers.

Before a deployment is promoted, the same three commands must pass locally or in CI:

```bash
npm run typecheck -- --incremental false
npm run test:acquisition
npm run build
```

## Rollback

Set `ACQUISITION_BACKEND_MODE=disabled` and redeploy. The runtime activation barrier immediately freezes checkout, webhook processing, report generation, order operations, and delivery while leaving the authenticated readiness contract available for diagnosis. No data migration or schema rollback is required.

## Explicit non-goals

- Webflow UI, intake wiring, browser CORS, or public activation.
- Supabase use or migration.
- Docling or automated source-document ingestion.
- Public report downloads, customer accounts, or a report portal.
- Exit Desk code, prompts, routing, pricing, payments, or delivery changes.
- Acquisition Lens pricing changes.

After Step 8 is approved and merged, the next phase is the Webflow build followed by the separately controlled backend/Webflow integration.
