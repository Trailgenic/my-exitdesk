# Carve-Out Perimeter & TSA Planner — independent review

Reviewed the builder, editorial JSON, release generator and initial workbook renders on September 10, 2026. Workbook/editorial review is complete with no remaining blocking findings. Production audit has not yet been run.

## Findings

1. **Partial records must not disappear.** The initial builder treated a blank service/cost description as Unused even when fee, term or amount inputs existed. This excluded the entered amount without increasing the invalid-record count. The same pattern existed for workflow and perimeter descriptions. Requested explicit invalid states for partially populated rows, while reserved IDs alone remain unused. **Resolved:** owning status columns distinguish partially populated records from unused rows. Focused scenario checks confirm invalid TSA/cost counts, blocked workflow coverage and invalid perimeter status. Dashboard TSA service count now includes non-Unused records, so an unnamed partial service also prevents an all-exits conclusion.
2. **Public Guide production note.** **Resolved:** removed the sentence about an external research-source register; the final Guide retains only useful evidence instructions.
3. **Builder corrections already identified during author QA.** A surplus TSA header label and a linked-dependency count formula parenthesis were corrected by the workbook author before final review.

## Substantive review

The workbook keeps Day 1 continuity separate from TSA exit. A positive Day 1 conclusion requires scope review, expected required dependency coverage, current row revisions, verified rights, appropriate service coverage and a separately evidenced workflow test. Fixed monthly TSA fees are counted once per service, independently of the number of linked workflow dependencies. Contract end uses EDATE(start, months) minus one day; the closing-date boundary is inclusive. Exit after expiry and missed notice timing remain visible and do not grant an extension.

Cost views distinguish buyer standalone annual run rate, seller stranded annual run rate, buyer/seller one-time separation, and temporary TSA fees. Structurally valid assumptions remain in entered subtotals and are separately flagged as unverified. Duplicate economic scope with different wording requires human overlap review.

The seven tabs, USD thousands unit and capacities match the editorial: 10 workflows, 22 perimeter assets, 40 dependencies, 10 TSA services, 20 costs. The guide covers all eleven perimeter categories in the roadmap. Manual revision increments and completeness reattestation are explicit limitations.

## Visual review

Inspected current renders from all seven tabs: dashboard, workflows-readiness, perimeter-scope, dependencies-readiness, tsa-tests, costs-evidence and guide-1. Headers, wrapped inputs, formula status columns and cost separation are readable. No clipping found in these reviewed regions. The changed Guide was rechecked after removal of the production note. Formula-only status fixes preserve the reviewed layout.

## Release verifier

Created scripts/verify-carve-out-release.py, syntax checked without running it. It checks 18 resources, 12 workbook downloads, 13 tools, five reciprocal guides, original seven primary stage destinations, actual anchor links, canonical routes, JSON-LD, workbook byte counts and SHA256, and synchronized machine endpoints. Visual statements come from a separate visual-qa.json record rather than inheriting previous-release claims.

## Final workbook evidence

The final workbook has 49 author-run input/scenario checks passing, zero reported formula errors, and no failed checks. Independently reconciled the QA metadata to the exact delivered bytes: 74,465 bytes; SHA256 `ac112844a858a5e81b1211702e3b87c76d05981b7a2c554d2f60da26f80269d7`. The focused tests demonstrate that unnamed partial records remain invalid and an unnamed partial TSA prevents the all-exits conclusion.

This review inspected formulas and scenario evidence; it did not run desktop Excel. Desktop Excel remains unavailable. Automated status reflects entered evidence and manual scope/revision attestations, not independent verification of the underlying transaction facts.
