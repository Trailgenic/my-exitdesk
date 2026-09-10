# Public Company Comps Workbench release

Published September 10, 2026 to www.mikeye.com and mikeye.com.

- Guide: https://www.mikeye.com/ma-resources/public-company-comps-workbench
- CMS resource: `6aa23404a5b0f1fce8b86f53`
- Native Tools card: `ca977905-b37c-4c14-38ea-146681baf9a2`, using MY Resource Card v1.
- Workbook: `public/resources/MikeYe-Public-Company-Comps-Workbench-v1.0.xlsx`
- Immutable asset commit: `a10eafcef6e045b4bc275073cf5053997ba92005`
- SHA-256: `54b31ceca2721933cf4b78242bd377b7b97658e5313965703343836f2f72a802`
- Size: 119,891 bytes.

The public workbook is blank. It contains no Capital IQ company values, private attachment data, or precedent M&A sample. The original supplied dataset and scratch extraction were not modified or added to either repository.

Four tabs: Dashboard, Controls, Peer data, Guide. Twelve sector choices, editable peer groups, 300 record slots, five EV multiples, normalized EBITDA, core and broader peer statistics, IQR review flags and selected implied EV/equity/per-share ranges. Source values and decisions remain separate from formulas. The input-to-output path is Controls and Peer data to Dashboard. There are no terminal audit dependencies.

Twenty-five synthetic recalculation checks passed. Final exported XML contains no populated company-input cells, no cached formula errors and no external workbook links. All four tabs were rendered and reviewed in six regions. Desktop Excel was unavailable, so no native Excel execution is claimed. Native browser review confirmed one H1, no horizontal overflow and the exact pinned download URL. The guide and tools card reuse the existing responsive Webflow components; separate mobile viewport emulation was unavailable.

Publication adds the guide to the native Library CMS list, Tools card, both index schema graphs, full ontology, resource inventories, llms guide and MCP dataset. Four related guides link reciprocally. The tools introduction and SEO mention public comps. Homepage features and seven primary transaction-stage destinations remain intact.

Run `node scripts/release-public-comps.mjs a10eafcef6e045b4bc275073cf5053997ba92005 --published` from the main repository to regenerate synchronized metadata. Fresh native-schema-before.json is the additive schema baseline. Run `python3 scripts/verify-public-comps-release.py` after both repository deployments finish. Do not run older broad launch builders against the live site.
