# Companion working packs — 2026-09-07

The two handbook drafts now have usable Excel companions and working download links in the native library, the CMS guide bodies and the portable library preview.

## Delivered workbooks

| Pack | Worksheets | Practical result |
| --- | --- | --- |
| Diligence | Start Here; Diligence Checklist; Follow One Sale; Issue Log | Choose material questions, distinguish received from verified evidence, walk through a real sale and exception, assign an action and owner to findings |
| Integration | Start Here; Day 1; Change Tracker; Savings Tracker | Protect ordinary operations, test handovers, establish pause/fallback responsibilities and separate planned cost savings from verified results |

Each pack includes a clearly fictional cover example, readable input cells, status dropdowns, filters and a stated twenty-row capacity for working trackers. No client or customer data is supplied. There is no composite deal score, no macros and no external workbook links. The savings worksheet covers monthly cost changes in whole USD with one-time costs separately recorded; it is not a valuation, payback or revenue-synergy model.

Mike's documented principles drive the questions and decisions: reconstruct financials, test transferability, preserve uncertainty, keep the private price ceiling, require survivable downside, protect revenue while combining cost, and demand evidence for achieved savings. Instructions and source references are included inside the workbooks.

## Download and content versioning

- Versioned XLSX files and their reproducible builder are saved in `public/resources/` and `scripts/workbooks/`.
- Guide download URLs pin workbook commit `335b47a0dfac53743a8c29db3ec2afae2d2ee854`; later branch changes cannot silently alter those downloads.
- Workbooks are draft version 0.1. Guides advance to draft version 0.2 to record the new companion instructions and downloads.
- The content manifest includes file paths, sizes, hashes, worksheet names and verified URLs. Do not overwrite a released workbook version; add a new filename/version and update the manifest deliberately.
- Webflow's upload destination returned HTTP 403 for the initial XLSX transfer. Those uploads were not retried or linked. Two unused asset metadata records are listed in the state file. Downloads instead use the existing public GitHub repository, through its authorized connector.

## Verified

- Visually reviewed all eight worksheets and corrected crowded savings headers.
- Exercised open/closed findings, overdue and same-day dates, blank inputs, zero replacement cost, negative savings, missing evidence, verified savings and stopped opportunities.
- Scanned both workbooks: no formula errors. Exported XLSX structure retains dropdowns and formulas, with no macro or external-link parts.
- Both public downloads returned HTTP 200; downloaded SHA-256 hashes matched the checked workbook bytes.
- Native readback confirmed library links and matching CMS bodies, source notes, versions and download fields. Both guides remain draft with no invented review date or canonical publication URL.
- Local foundation/library checks passed, including workbook hash checks. The public resource inventory still lists six existing publications, excluding the draft guides and their downloads.

Workbook source and binaries are Git-backed. The portable library preview is updated separately under its existing file identity. No Webflow publication or production merge was performed. The prior brand-font, rendered-site review and coordinated launch gates remain.
