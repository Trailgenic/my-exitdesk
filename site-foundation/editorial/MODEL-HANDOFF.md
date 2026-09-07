# Company model handoff

Four starting guides are staged. The workbook build belongs to Claude. This checkpoint contains no company financials, valuation outputs, forecast assumptions, or workbook downloads for these four companies.

## Stable mapping

| Company | Resource ID | Staged CMS route |
| --- | --- | --- |
| Gap | gap-valuation-model | /ma-resources/gap-retail-valuation-model |
| Salesforce | salesforce-valuation-model | /ma-resources/salesforce-software-valuation-model |
| Ziff Davis | ziff-davis-valuation-model | /ma-resources/ziff-davis-media-valuation-model |
| Surgery Partners | surgery-partners-valuation-model | /ma-resources/surgery-partners-healthcare-valuation-model |

The hub route is `/tools-and-models`. Reuse the same CMS records and slugs when models arrive; do not create parallel pages. The existing resource template renders the starting guides now and can hold the completed methodology later.

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

- Model records are draft pages with `workbookStatus: awaiting-delivery`, null `download`, null valuation and review dates, and no public canonical URL.
- Guides provide original practical questions based on documented acquisition principles. They are not attributed as verbatim interviews or completed company analysis.
- Company references were selected in the rebuild conversation on 2026-09-07. There are no copied proprietary financial tables.
- Public resource JSON, schema, and llms inventory exclude every pending model, even though the private design-intent preview shows the guides.
- Existing diligence and integration XLSX files remain usable and retain their immutable versioned links.
