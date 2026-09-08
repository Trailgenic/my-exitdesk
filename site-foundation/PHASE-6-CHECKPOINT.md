# Company model downloads — 2026-09-08

Mike approved continued building and uploading the five completed models. All five approved files are now hosted publicly, with downloads connected to the existing staged Webflow guides and native Tools & Models hub. Publication of the rebuilt website has not occurred.

## Completed and verified

- Uploaded the exact approved GAP, CRM, ZD, SGRY, and NVDA workbooks as versioned 1.2 files in `public/resources`.
- Each public download is pinned to commit `122684a0aad30a99e7cc44878b79a4633558cdd2`. All five returned HTTP 200 and matched the approved byte counts and SHA-256 hashes on 2026-09-08.
- Updated the existing five CMS records, preserving slugs and publication flags. Native readback matched each saved methodology, source note, version, author, change log, and download URL exactly.
- Replaced native hub placeholders with direct Excel downloads and retained each matching guide link. Readback verified all five card-to-file mappings.
- Added practical instructions using actual workbook tabs: Start Here, Valuation Summary, Assumptions, Sources & Adjustments, Operating Forecast, DCF, Sensitivities, and Checks. Each guide also addresses a specific operating or ownership issue in its company workbook.
- Updated the content manifest, editorial source, portable preview, library doorway, and method introduction. Model hash and availability checks pass alongside existing foundation/library checks.
- No new workbook financial calculations were performed in this website integration pass. File verification here confirms the exact approved versions and delivery integrity; prior workbook repair/recalculation work remains the financial review record.
- Workbook verification dates are separate from guide editorial approval and publication dates. New staged guides remain excluded from the public JSON, schema, and llms inventory until launch.

## Existing Webflow destinations

Site: `69499e76d9c11f22288abc28`.

| Surface | Page or item ID | Intended route |
| --- | --- | --- |
| Rebuilt homepage | 6a9f1608e824c600831d2eaf | / (currently /rebuild-foundation) |
| M&A Library | 6a9f20d0a616017e7bdf9a95 | /m-and-a |
| Tools & Models | 6a9f3a7d2148e9081ffed5ea | /tools-and-models |
| Resource template | 6a9f1684bfb97f3c671ae859 | /ma-resources/{slug} |
| Gap | 6a9f3af084946e9b265e5820 | /ma-resources/gap-retail-valuation-model |
| Salesforce | 6a9f3af084946e9b265e5822 | /ma-resources/salesforce-software-valuation-model |
| Ziff Davis | 6a9f3af084946e9b265e5824 | /ma-resources/ziff-davis-media-valuation-model |
| Surgery Partners | 6a9f3af084946e9b265e5826 | /ma-resources/surgery-partners-healthcare-valuation-model |
| NVIDIA | 6a9f3f2c598f07756d56ea73 | /ma-resources/nvidia-ai-infrastructure-valuation-model |

Four existing model records return isDraft:false and NVIDIA returns isDraft:true. Those flags were preserved; they do not prove live publication. The resource template and new static pages retain their draft/indexing boundaries.

## Remaining launch pass

1. **Native rendered review.** Inspect the rebuilt homepage, library, tools hub, both handbooks, and five model guides in Webflow preview at desktop and mobile widths. Check navigation, keyboard focus, CMS binding, overflow, readable tables, typography, and download clicks. Native styles currently use Georgia/Courier fallbacks; confirm these or install the intended EB Garamond/DM Mono through a supported route. Browser visual QA is not claimed: the API has no documented rendered draft preview endpoint, and the current cloud browser could not access the local HTTP preview (`ERR_BLOCKED_BY_CLIENT`).
2. **Coordinated homepage and indexing switch.** Prepare a rollback snapshot of the current homepage. Promote the rebuilt homepage, update links still pointing to /rebuild-foundation, set canonical URLs and publication dates for approved resources, remove noindex only from launch pages, and update sitemap/public machine inventories together. Validate topic links lead to useful content. Preserve About as the deal list and PMC mastheads as tenure evidence.
3. **Release verification.** Require successful current-commit GitHub checks and Vercel preview, review the pending Webflow change set, then obtain the final publication instruction. Do not publish independent Stalled Exit or unfinished Acquisition Lens changes as a side effect. After release, check live routes, canonical tags, sitemap entries, and all seven Excel downloads.

The first public release can contain the new authority homepage, practical library, two handbooks with working packs, five valuation models, and existing published resources. Broader comps databases, additional lifecycle handbooks, synergy tools, and the unfinished Acquisition Lens product can follow. They are further product development, not a reason to keep this useful initial library waiting indefinitely.
