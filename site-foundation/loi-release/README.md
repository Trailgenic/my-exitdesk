# LOI Economics & Risk Allocator release

Version 1.0, September 10, 2026. Canonical page: https://www.mikeye.com/ma-resources/loi-economics-risk-allocator

This phase adds the LOI economics workbook and native CMS methodology, a reusable Tools & Models card, the LOI & Diligence stage link, and reciprocal relationships with the deal workflow, diligence, synergy, and integration guides. The seven transaction stages, ten knowledge pillars, and all existing resources remain in place. The inventory now contains 16 resources and ten verified workbook downloads.

## Continue from here

Next major resource: **Capital IQ Comps Workbench**. Preserve the locked specification in `site-foundation/RESOURCE-ROADMAP.md`. Publish methodology and an import template; do not redistribute licensed Capital IQ data. No Comps Workbench was built in this phase.

Current canonical sources:

- `site-foundation/content-manifest.json`
- `site-foundation/transaction-path.json`
- `site-foundation/editorial/loi-economics-risk-allocator.json`
- `scripts/workbooks/build-loi-economics.mjs`
- `scripts/release-loi.mjs`
- `scripts/verify-loi-release.py`
- This directory’s `workbook-qa.json`, `xlsx-structure-qa.json`, `calculation-map.json`, and `production-audit.json`

The release generator requires the verified workbook asset commit. It preserves existing resources and updates the resource inventory, ontology, machine guide, native page schemas, reciprocal editorial links, and roadmap. Do not run older broad launch generators without adapting them to the latest manifest.

## Workbook

The six tabs are Dashboard, Assumptions, Economics, Contingencies, Conditions, and Guide. The first pass is designed for 10–15 minutes. A single Base/Downside selector controls active assumptions and contingent-payment inputs. The template supports six contingent-payment slots and fourteen condition slots.

All monetary amounts are USD thousands, except explicitly labeled USD/share. Share counts are thousands of shares. Examples are labeled Assumption. No Sources tab, source register, public production notes, macros, or external workbook links are included.

The EV-to-equity bridge deducts both repaid and retained debt, adds eligible excess cash and the signed working-capital adjustment, and allocates fixed consideration to stock, rollover, and residual cash. Funded escrow and unfunded holdback remain inside fixed cash consideration. Fixed-share and fixed-value mechanisms are distinct. No ownership percentage, collar, or complex security waterfall is calculated.

Buyer PV equity cost discounts expected contingent cash and the unfunded holdback; funded escrow remains a cash outflow at close. The full-cap EV comparison uses nominal contingent caps and the selected stock price, so it is not an absolute cap on every future deal cost. Required operating cash means additional cash injected. Eligible target cash stays in the acquired business and is not a closing source in this template. New debt means committed funding assumed drawn at close, excluding undrawn facility capacity. Buyer cash is independently entered availability, with a real funding surplus or gap.

Conditions require a named owner, evidence, action, resolution, consequence, and date before a Closed entry is accepted. The model cannot establish that the evidence is true or adequate. Price ceilings, funding gaps, missing definitions, rollover terms, open conditions, walk decisions, and exclusivity timing remain visible. Calculation completeness is distinct from decision readiness.

### Validation

All 44 calculation and scenario checks passed, including signed negative working capital, stock-free transactions, both stock modes, future exclusivity starts, missing versus zero inputs, retained/repaid debt, contingency caps and probabilities, funding gaps, condition prerequisites, and supported table extension/reordering. All six tabs were rendered and visually inspected. Independent financial and UX review found no remaining substantive blocker. Native filter, frozen headers and identifying columns, and saved workbook formula errors were checked.

Desktop Excel was unavailable; calculation checks used artifact-tool. Native page desktop rendering was inspected, with no horizontal overflow. Responsive wrapping and existing template breakpoints were retained; a separate mobile viewport was unavailable. No debt-service, covenant, tax, interest, uncapped-liability, purchase-accounting, or legal-document model is presented.

## Publication identifiers

- Webflow site: `69499e76d9c11f22288abc28`
- Resources collection: `6a9f1683bfb97f3c671ae853`
- LOI resource item: `6aa2095323a4984befe0ccef`
- Tools & Models page: `6a9f3a7d2148e9081ffed5ea`
- New resource-card instance: `3a4f5838-a31c-e3ce-6644-61009a2e8433`
- Existing resource-card component: `8cca3d98-0cb0-3861-2fc6-9f22d7ff87f2`
- Transaction-path component: `f1739b60-3609-0899-892e-9db64afdb4c4`
- Stage 4 native resource link: `f1739b60-3609-0899-892e-9db64afdb528`
- Asset commit: `7dbfacd24c1e5fbae5c0d8154613cbc6b1505856`
- Workbook SHA-256: `a6adad0cf1d79beae2e61391bb629269744efa7e4155fa8b7f3f8f6b6e71a8eb`
- Workbook size: 47,265 bytes

The governing content came from Mike’s saved acquisition doctrine, reasoning system, and locked roadmap. A separate raw interview transcript was not available; no new interview quotations or transaction facts were invented.
