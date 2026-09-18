# Native funnel v2: revenue selection and referral preservation

Prepared September 18, 2026 from main f979273ade0355c67695331ebab9d3bbf00ec7c3.

This replaces only the two independently useful funnel changes from PR #99.
The Stalled Exit outreach pilot is parked; its branch and original PR retain
the evidence engine, research rules, tests and campaign design for future review.
Do not deploy the six legacy campaign embeds from that branch.

## Behavior

- Score preserves a URL-supplied `ref` through its generated checkout link.
  Checkout passes the same tag to the existing Stripe session API. Tags use
  1–64 ASCII letters, digits, underscores or hyphens. Invalid tags are dropped.
  No storage, tracking token, campaign service, or automatic commission is added.
  Scope is the native Score-to-checkout path and direct tagged checkout links;
  cross-page journeys through sample/valuation and cross-device attribution are
  not added by this release.
- Checkout accepts the existing diagnostic q1 values a–e. For missing or invalid
  q1, it displays an accessible annual-revenue radio group and blocks payment
  until selected: under $1M selects a/$199; $1M or more selects b/$499.
  It updates edition, price and calibration together. The selector is inserted
  into the existing native checkout layout by the runtime; no page reimport.
- In-flight payment disables both payment and revenue controls; failure restores
  them. Direct calls to startCheckout cannot bypass the revenue/duplicate gate.
- Existing scoring, low-score routing, repeated-result reset, product wording,
  backend routes, report generation and subscription handling remain intact.
  The backend still has its historical missing-q1 fallback; this release fixes
  the native user flow without changing that API contract.

## Build and verification

Run `node scripts/build-native-funnel-v2.mjs`, then
`node scripts/verify-native-funnel.mjs`. The builder derives v2 from the reviewed
v1 runtimes using checked, single-occurrence edits; it fails if those anchors
change. Run it after any intentional v1 regeneration and review all generated
changes. The dedicated Native Exit Desk funnel workflow checks reproducibility.

Local DOM tests passed: 67 scoring parity cases, high/low/high result reset,
native controls, all five diagnostic revenue answers, missing/invalid revenue,
both direct-entry selections, switching tiers, duplicate prevention, failure
recovery, and referral propagation with all eight diagnostic answers preserved.
No Stripe payment or email submission was made. No live Webflow browser test
or full Next.js production build is claimed by this local verification.

## Activation after merge

1. Confirm Vercel serves the two new files with the hashes in
   `v2-runtime-manifest.json`. Existing v1 assets are untouched.
2. In Webflow, register the new hosted runtime versions with the manifest's
   integrity hashes. Replace the score page registration with
   `exit-score-native-v2.js` and checkout with `exit-checkout-native-v2.js`.
   Remove the matching v1 page registration: never run both versions together.
   Keep the native layout, shared CSS, global code and other pages unchanged.
3. Publish to staging first. Check keyboard/mobile layout, direct checkout with
   no q1, both prices, a tagged Score-to-checkout journey, low-score routing,
   repeated results and checkout failure recovery. Use owned test data; no real
   payment or subscription is needed for these checks.
4. Publish only the two affected pages once verified, then recheck production.
   Repository merge alone does not activate these new runtime URLs in Webflow.

Rollback: restore the prior score v1.0.2 and checkout v1.0.1 registrations.
Do not restore any legacy embeds or apply the parked pilot's rollback procedure.

## Parked pilot

PR #99 / `stalled-exit-pilot-v0` remains the historical implementation reference.
Any restart needs a fresh scope, current-source review and native integration.
Its sender, cohort, storage, suppression and attribution launch gates remain
unresolved. This replacement adds none of that infrastructure.
