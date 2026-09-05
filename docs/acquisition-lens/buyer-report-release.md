# Acquisition Lens: Ella's buyer assessment

This replaces the first-look-only product direction. The free screen is an entry point; the flagship is a paid AI buyer assessment, following Exit Desk's structured-intake → Ella analysis → confidential PDF/email pattern.

## Existing judgment reused

The seller reference is `lib/ella-prompt.ts`, `lib/ella-mainstreet-prompt.ts`, `lib/ella.ts`, and the seller report/delivery routes. The buyer implementation imports **all 22 existing rules from `MIKE_ACQUISITION_DOCTRINE`**, the existing segment profiles, report constraints, structured-model interface, output schema and strict citation validator. It also reuses the existing encrypted Redis, durable idempotency, rate limiter and Resend delivery adapter. No new judgment elicitation was performed and the existing doctrine has not been edited.

`buyer-diagnostic.ts` adds an intake-based report mode. It does not manufacture the complete canonical underwriting payload required by the older IC engine. The older underwriting calculations, governing decisions and private routes remain unchanged. The new qualitative assessment retains the original narrative dimensions and adds company, competitor and industry sections. It never represents missing valuations or financing models as completed work.

## Product flow

1. `/acquisition/report` collects 28 structured/context fields in five sections. Buyer/target identity, mandate and basic business context are required; unavailable financial information remains unknown.
2. The buyer optionally authorizes a public company identity and website for cited company, competitor and industry research. The separate research request receives only that identity, industry and geography. It cannot receive the private price, financing, financials or buyer thesis through the request contract.
3. Secure checkout encrypts and stores the intake, creates a Stripe session for the configured buyer-report Price, and binds the resulting paid session to that intake. The customer sees the configured one-time price before checkout. No new price has been assumed or activated.
4. On return, the application verifies the paid session, correct product/price, quantity, completion and test/live mode. The service prepares public research, invokes Ella through the existing structured-model adapter, and validates all narrative citation IDs.
5. The report appears online and is rendered as a branded PDF. Email is sent only to the address verified through Stripe checkout. Repeated requests reuse the same encrypted report. Email failure preserves the report and supports delivery retry without regenerating the analysis.

The public API never accepts an arbitrary recipient or a client-supplied report. Payment is checked before model use. Seller purchases cannot unlock the buyer product. Checkout retries are idempotent, confidential storage keys are opaque, and request bodies are bounded. Stored intakes/reports expire after 30 days; the buyer should keep the emailed/downloaded PDF. The UI removes the checkout session ID from the URL and uses a no-referrer policy.

## Research and report boundaries

The implementation uses Anthropic's documented `web_search_20250305` tool with a bounded search budget and preserves its citation URLs/IDs. Reference: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool

Public research must return cited sources. If it cannot finish, the paid order remains retryable; the application does not silently claim to have researched the company. Public evidence can establish public facts, not verify private seller earnings. The report distinguishes buyer claims, evidence, inference and unknowns. The existing acquisition doctrine controls interpretation. Company/competitor names in a real report must be supported by the research or explicitly attributed intake.

The outcome is a **provisional buyer assessment**, with investigate/reprice/protect/pass, diligence priorities and evidence gates. There is no purchase or LOI approval, invented price recommendation, synthesized underwriting output, or claim that Mike personally reviewed the report. A model still requires substantive output evaluation; schema validation alone cannot guarantee factual correctness.

The Harbor sample is a clearly labeled, authored illustrative report based on a fictional acquisition and invented competitors. It demonstrates the report's depth and PDF layout. It is **not evidence of a successful production-model or live-research run**.

## Configuration and launch

This build deliberately opens no paid ordering until the dedicated mode and a valid Price are configured. It does not activate the older IC backend. Required settings are in `.env.example`:

- Existing reusable credentials: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`.
- Existing acquisition storage and delivery settings: `ACQUISITION_DATA_ENCRYPTION_KEY`, `ACQUISITION_REDIS_REST_URL`, `ACQUISITION_REDIS_REST_TOKEN`, `ACQUISITION_RESEND_FROM_EMAIL`.
- New mode: `ACQUISITION_DIAGNOSTIC_MODE=disabled|test|live`. Test requires a test Stripe secret; live requires a live secret. Default remains disabled.
- New Price: `ACQUISITION_DIAGNOSTIC_PRICE_ID`. Its active Stripe Product must have `metadata.product=acquisition_lens_buyer_report`; the Price must be active, one-time and match the selected mode.
- New app origin: `ACQUISITION_DIAGNOSTIC_BASE_URL`, e.g. the existing Vercel app origin `https://my-exitdesk.vercel.app`. This app hosts the checkout return and report page.

Before launch, select the intended one-time price, configure Stripe test mode, and run one actual paid test checkout → research → model → PDF → email cycle. Repeat retrieval must not regenerate or send twice. Check the buyer's invoice email, failure/retry behavior and the resulting prose. No real transaction information is needed for this test. This session had no callable Vercel configuration tool or locally supplied provider credentials, so the real-provider cycle remains a deployment gate.

The existing Webflow landing and screen are staged as drafts. Their report CTAs currently target the reviewed branch preview. Before public publication, regenerate with `ACQUISITION_BUYER_APP_ORIGIN=https://my-exitdesk.vercel.app npm run build:acquisition:screen`, stage those embeds, then merge and publish only the intended pages. The older root `/checkout`, `/intake` and `/success` draft pages are not linked from this product and should remain unpublished. No new subscription is required by the implementation, but AI/search, hosting, storage and email consume the corresponding provider accounts.

## Verification and maintenance

- `npm run typecheck`
- `npm run test:acquisition`: covers existing backend plus new doctrine preservation, research isolation, citation rejection, paid-product validation, retry/delivery behavior and real PDF rendering.
- `npm run test:acquisition:screen`: free entry screen regressions.
- `npm run build:acquisition:screen`: generates the Webflow embeds and standalone landing/screen previews.
- `npm run build`: existing seller routes require their provider environment settings even at build time. CI uses dummy values and does not call those providers.

The previously failing PDF tests were caused by CommonJS resolution of an ESM-only transitive PDF export. `lib/acquisition/package.json` declares that directory as ESM, matching its imports and dependencies. Existing PDF tests pass without dependency downgrades or changes to seller code.

The buyer PDF embeds licensed DejaVu Serif fonts; their license is included under `public/fonts/acquisition`. Route tracing includes these files for serverless PDF generation. The illustrative PDF was rendered and visually reviewed after embedding the fonts.
