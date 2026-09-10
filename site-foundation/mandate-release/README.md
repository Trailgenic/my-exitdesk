# Acquisition Mandate & Target Screen

Version 1.0, September 10, 2026. Canonical guide: https://www.mikeye.com/ma-resources/acquisition-mandate-target-screen

Mike authorized this resource while Claude gathers Capital IQ data. The Comps Workbench remains the next resource when the data is available. Its locked specification in `site-foundation/RESOURCE-ROADMAP.md` is unchanged; do not redistribute licensed source data. No comps analysis was created in this phase.

## Scope and operating logic

The workbook distinguishes route choice, target screening, work priority, and mandate authority. Six tabs: Dashboard, Mandate, Routes, Targets, Screen, Guide. Twelve reserved target slots and six editable criteria support a ranked review queue and separate eligible shortlist. At least one criterion must remain required. The review order is an explicit team priority, not a computed attractiveness score or transaction recommendation.

Cash amounts are USD millions of incremental cash funding from buyer and financing sources over the common horizon entered on Mandate. Include applicable cash consideration, debt repayment, fees, integration, and incremental operating investment. Exclude noncash stock/rollover and undrawn facility capacity. The envelope is an early screening limit, not verified financing capacity. The 24-month example horizon is an Assumption.

Unknown, unverified, conflicting, stale, missing, or future-dated evidence cannot establish that a required condition is met. A fatal veto and a recorded Walk take precedence over priority. A recorded criterion failure holds a target while its basis is investigated. A documented scarce-asset consent exception stays conditional and outside the eligible shortlist. Mandate approval, target screening, outreach permission, and transaction approval are distinct.

Current mandate revision is D27, approved revision D31, and funding horizon D32 on Mandate. Targets AH records the reviewed revision. Screen O records the revision; P preserves the basis reviewed, while Q shows the current criterion definition and evidence test. Changed required definitions reopen evidence. Material mandate edits require the user to increment the revision, reassess records, and renew approval; arbitrary changes do not automatically increment it. Copy Q to P as values only after actually reassessing the criterion evidence.

Examples are fictional and labeled Assumption. Evidence references are fields for the user's target work, not research-source registers. A separate interview transcript was not available. The governing judgment came from Mike's saved acquisition doctrine, existing reasoning prompt, and locked resource brief; no interview quotations or actual target facts were invented.

## Canonical source and release files

- `scripts/workbooks/build-acquisition-mandate.mjs`
- `scripts/release-mandate.mjs` (requires the final workbook asset commit)
- `scripts/verify-mandate-release.py`
- `site-foundation/editorial/acquisition-mandate-target-screen.json`
- `site-foundation/content-manifest.json` and `site-foundation/transaction-path.json`
- This directory's workbook QA, calculation map, exported-feature QA, and production audit

The release generator preserves earlier resources and connects this tool to workflow, diligence, synergy, and LOI economics. It updates the first two transaction stages in the native page schemas, inventory, ontology, and machine guide. Use this phase's generator and current manifest; older broad launch generators may overwrite later additions.

## Native publication identifiers

- Webflow site: `69499e76d9c11f22288abc28`
- Resources collection: `6a9f1683bfb97f3c671ae853`
- Mandate resource item: `6aa216c7cb56102c6cda988a`
- Corporate development topic: `6a9f1878f05b49301190ceda`
- Tools & Models page: `6a9f3a7d2148e9081ffed5ea`
- New resource card: `b5c6f8d7-7e10-6598-a090-3d31d5b5fe56`
- Existing reusable resource-card component: `8cca3d98-0cb0-3861-2fc6-9f22d7ff87f2`
- Transaction-path component: `f1739b60-3609-0899-892e-9db64afdb4c4`
- Mandate link: `f1739b60-3609-0899-892e-9db64afdb4df`
- Thesis & Targets link: `f1739b60-3609-0899-892e-9db64afdb4f8`

The shared native resource template uses `schema-media-url`, `schema-media-name`, and `schema-media-format`. Always populate these along with `download-url` and the reusable full `structured-data-json` record. Its configuration is documented in `site-foundation/loi-release/resource-template-media.json`. This release uses those existing fields without changing the shared template.

Native index-page schemas reached Webflow's normalized markup length limit when adding the seventeenth resource. Resource ItemList entries now reference the complete resource nodes in the same graph instead of repeating each title and URL. All resource definitions, download metadata, ordered stages, and relationships remain present. The current library schema is close to the platform limit; future additions may require further removal of duplicated descriptions or references, while preserving the full ontology and per-resource records.

## Validation limits

Desktop Excel and a separate mobile browser viewport are unavailable. Workbook calculation checks use artifact-tool, with native exported filters, panes, formulas, and links inspected separately. Responsive presentation uses the existing native template and reusable card styles. This is an early screening tool, not a valuation, financing, legal-transferability, or transaction-approval model.

## Workbook release

Final workbook: 86,183 bytes; SHA-256 `76a89f6d0d40419817f5124b45c26651b8836d5e028bda6bb7cb471c1296b7ea`. Pinned asset commit: `00d7d6fd497644cadf65fa347c8420da058fffca`. All 59 focused calculation and workflow checks passed with no formula-error matches. Every sheet was rendered and visually reviewed. Two native filter tables and frozen panes were verified in the exported file. No macros or external workbook links exist. Full-record reordering was checked in the calculation engine; native Excel UI sorting was unavailable. The discovery worker passed 80 smoke checks.
