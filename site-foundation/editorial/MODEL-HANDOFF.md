# Company model handoff

All five supplied workbooks have been repaired, reviewed, and approved by Mike for upload. Version 1.2 downloads are connected to the existing staged guides and Tools & Models hub. See PHASE-6-CHECKPOINT.md for download verification and release status.

## Stable mapping

| Company | Resource ID | Staged CMS route |
| --- | --- | --- |
| Gap | gap-valuation-model | /ma-resources/gap-retail-valuation-model |
| Salesforce | salesforce-valuation-model | /ma-resources/salesforce-software-valuation-model |
| Ziff Davis | ziff-davis-valuation-model | /ma-resources/ziff-davis-media-valuation-model |
| Surgery Partners | surgery-partners-valuation-model | /ma-resources/surgery-partners-healthcare-valuation-model |
| NVIDIA | nvidia-valuation-model | /ma-resources/nvidia-ai-infrastructure-valuation-model |

The hub route is `/tools-and-models`. The same CMS records and slugs now contain the completed workbook downloads and instructions. Future versions should update these records rather than create parallel pages.

NVIDIA adds a semiconductor/AI infrastructure example alongside Salesforce's software example. Its model should address disclosed business mix, customer concentration, product transitions, supply commitments, inventory and prepayments, investment gains/assets, dilution, and a defensible fade from rapid growth. Do not invent separately disclosed software economics or present an acquisition-return illustration as a feasible takeover of NVIDIA. Apply the same source, methodology, and verification requirements below.

## Requested delivery from Claude

For each company: populated editable XLSX, methodology Markdown, source/adjustment register, actual exported-file verification report, and build code if used. Keep internal Capital IQ material separate from any redistribution-ready workbook. Private research, proprietary exports and confidential examples must not be committed to this public repository or placed in public CMS fields.

## Acceptance before enabling a download

1. Identify the company, security, valuation date, price date, reporting periods, units, currency, and workbook version. Record rather than infer any missing field.
2. Review source rights and produce the intended public workbook. Confirm it works without a provider subscription, macros, or external workbook links.
3. Recalculate the exported XLSX and inspect the sheets. Tie statements, cash flow, enterprise/equity bridges, shares, leases, and minority interests to sources and consistent definitions.
4. Verify actual scenario/sensitivity behavior and meaningful missing/zero/negative input cases. Check that standalone value, transaction control value, and buyer-specific affordability remain distinct. Do not imply SOTP or transaction evidence exists where it does not.
5. Compare the manuscript to the delivered workbook: actual tabs, formulas, input instructions, supported methods, limits, and version. Revise the current starting guide accordingly; do not retain unfulfilled method promises.
6. Preserve Mike's judgment references and his approval state. Financial validation is not Mike's editorial approval. Set reviewed-date only after an actual review and record its scope.
7. Save an immutable versioned public workbook; verify bytes and a successful download. Populate filename, path, URL, SHA-256, bytes, sheets and version in the manifest. Change workbookStatus only after the checks are recorded.
8. Replace the coming-soon message with the verified download in the hub, CMS methodology, and source-rendered preview together. Update source notes and changelog. Run foundation/library checks. Publishing remains a separate coordinated release action.

## Current behavior

- All five models have `workbookStatus: available`, immutable verified downloads, a 2026-09-04 valuation date, and version 1.2.
- Each download returned HTTP 200 and matched the approved file's SHA-256 and byte count on 2026-09-08.
- The guide instructions refer to the actual delivered worksheet names and company-specific issues. Source principles remain tied to Mike's saved acquisition doctrine.
- Resource pages remain staged: public canonical URLs and editorial review dates are not invented. Workbook verification is recorded separately from publication.
- Public resource JSON, schema, and llms inventory still exclude the unpublished guides. Promote those entries only as part of the coordinated public launch.
- Existing diligence and integration working packs retain their versioned downloads.
