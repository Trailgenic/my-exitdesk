> Superseded as the flagship product: the first-look screen is now only the free entry point. See `buyer-report-release.md` for the AI buyer assessment built from the existing acquisition doctrine.

# Acquisition Lens: focused first-look release

## Product decision

The first release answers one buyer question: **Is this established operating business worth taking into initial diligence, and what must be verified next?** It serves acquisition teams and individual buyers at the same early decision point. It does not attempt to cover every deal type or automate an entire acquisition process.

MikeYe.com has two complementary workflows:

- **Exit Desk:** seller readiness and preparation.
- **Acquisition Lens:** buyer screening and a focused diligence agenda.

This supports a credible portfolio demonstration of translating M&A judgment into usable software. It does not imply a buyer/seller marketplace, completed transaction execution, shared confidential deal data, or proven customer outcomes.

## Audit findings

The prior Webflow screen contained five sections and asked for a supported standalone value, private ceiling, scarcity, seller control, a modeled downside, and an LOI package. Its results sold a full IC memo. The existing backend additionally supports underwriting, AI reasoning, payments, encrypted persistence, and report delivery, while the August integration handoff records missing public payment/intake bridges and a disabled launch state. This created a large dependency chain before the user could complete the advertised journey.

The focused release removes that dependency from the first-look experience. It asks three groups of questions: buyer fit, reported economics, and transferability/evidence. A company alias is optional; missing numbers stay unknown. The output is a transparent disposition, reported economics, supporting inputs, risks, evidence gaps, and follow-up questions. A fictional case can be explored immediately. The brief downloads as text and has a print layout for saving as PDF.

## Method boundary

This is a separate **first-look method v1.0.0**, not a reimplementation or claim of parity with the later `lib/acquisition/deal-screen.ts` underwriting contract. That existing contract has different prerequisites and remains unchanged.

- A stated mandate mismatch means set aside for that mandate, not that the business is intrinsically unattractive.
- Startup, distressed, minority, zero-revenue, and nonpositive-earnings cases are routed to specialist review.
- Unknown fit or incomplete basic economics require basic facts.
- Evidence gaps and unresolved operating/consent issues trigger investigation.
- Complete supplied answers can support initial diligence only. They do not approve an LOI or purchase.
- Ownership percentage alone is not a veto; the relevant question is the required authorization and consent path.
- Evidence is explicitly buyer-reported. No documents are ingested or verified, and no confidence percentage is generated.
- Asking EV / reported EBITDA is calculated only for an explicitly identified enterprise-value price and positive reported EBITDA. Equity price and SDE are never substituted. The ratio is descriptive, not a market multiple or value conclusion.
- There are no default leverage ratios, valuation multiples, return targets, normalized earnings, or invented missing amounts.

## Source and build

- `public/acquisition-first-look.js`: shared deterministic method, normalization, fictional sample, and export.
- `public/acquisition-first-look-ui.js`: accessible three-step form and result rendering; text is inserted with `textContent`.
- `docs/acquisition-lens/webflow/*.template.html` and `first-look.css`: authoritative presentation sources.
- `npm run build:acquisition:screen`: regenerates self-contained Webflow embeds and noindex standalone previews. Never hand-edit generated copies.
- `npm run test:acquisition:screen`: first-look decision, numeric validation, evidence, and export regression tests.

The embed includes the exact method and UI scripts tested in the repo. It needs no API deployment, external JavaScript CDN, credentials, payment, AI call, or form submission. It uses no local/session storage. Google Fonts remains a presentation dependency; standard serif/monospace fallbacks are specified. Existing host-level Webflow analytics are outside the screen's code.

## Review and launch

The existing Webflow landing `/acquisition-lens` and free screen `/screen` receive the generated embeds in draft. Their metadata should describe first-look screening. The paid checkout, intake, and success pages remain unpublished, and the first-look pages contain no links to them. `ACQUISITION_BACKEND_MODE=disabled` remains the default; no backend secrets or live environments are changed.

Review the branch/PR and the fictional sample before merging and publishing the two free pages. Verify that those pages are the intended publication scope and that unrelated draft paid pages remain unpublished. After publication, add the buyer/seller pair to the relevant MikeYe.com portfolio navigation; do not describe Acquisition Lens as launched before this gate is complete.

Suggested portfolio description **after publication**: “Built complementary seller-readiness and buyer-screening tools that translate M&A judgment into evidence gaps, decision rules, and actionable next steps.” Before publication, describe the buyer tool as a working prototype.

## Later-stage work

The existing IC memo/underwriting backend is preserved as optional later work. Any paid release still requires the private-to-public bridge, supported canonical underwriting inputs, payment and delivery checks, and explicit activation described in `webflow-integration-handoff.md`. Do not imply those services are available from the first-look release.

Success for this release is a complete sample-to-brief demonstration and useful feedback from target users or interview conversations. No new subscription or outreach automation is required.
