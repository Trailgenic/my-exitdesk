# Ontology and launch preparation — September 8, 2026

Mike authorized the schema review, corrections, and publication after the three launch tasks. This checkpoint records a **staging release, not a production publication**.

## Applied in Webflow

- Installed the approved native homepage on the existing root page `69499e77d9c11f22288abc5d`; hid the prior section `e93a706e-a92b-f80d-147b-c66487668349`. The separate `/rebuild-foundation` page remains a draft.
- Updated the global Person and WebSite graph around Mike's M&A authority. Preserved existing advertising code and verified identity profiles. Removed Ella's unrelated SoftwareApplication from global code; her own page retains her profile.
- Added server-rendered native schema fields for the homepage, library, tools hub, resource template, Intelligence, glossary hub/template, and podcast hub/template. Kept existing hub styling by moving it into page-ID-scoped global CSS.
- Native resource schema uses resolved CMS name, slug, summary, decision, and version bindings. The complete resource/Excel relationships are in the hub graphs and machine ontology. The CMS `structured-data-json` field is a source record; it is not itself emitted by the template.
- Made the two hubs and all 13 resource records available on staging. Seven new resource pages have canonical URLs, authorship, versions, and approved copy. Six legacy catalogue records link to their original public resources and are excluded from the sitemap.
- Included the seven new guides in the sitemap; excluded all 10 thin topic detail pages. Topic summaries remain visible in the library. The topic template and unfinished Acquisition Lens pages retain their draft/indexing boundaries.
- Corrected shared navigation to `/#products`, simplified card actions, removed obsolete draft notices from launch pages, and added `tabindex="-1"` to main landmarks so skip links transfer keyboard focus.
- About remains the deal record; `/about/record` remains PMC masthead/title/tenure evidence. Company workbook examples do not imply Mike worked on those transactions.

## Source and rollback

The `launch/` directory contains the original global/page custom code, metadata, CMS records, and homepage tree snapshot. Restore the original root section's visibility and hide/remove only the newly installed native section if a rollback is needed; restore prior global and page code together because the old page styles have moved.

Build the intended release files with:

```sh
node scripts/build-launch.mjs
node scripts/build-legacy-hub-schemas.mjs
node scripts/verify-launch-inventory.mjs
python scripts/verify-launch.py https://mike-ye.webflow.io
```

The HTML `*-head.html` files provide source graphs. Their JSON-LD was applied through Webflow's **native schema fields**, not by copying those HTML blocks into page custom code. `global-head-final.html` is the actual global head content. The global footer is empty; duplicate body-end schema is unnecessary. `resource-template.schema.json` is the source for the native CMS template schema.

`publication-resources.json`, `ma-library.json`, `ontology.json`, and `llms.txt` describe the **intended production release**. Do not treat them as evidence of live publication. The existing canonical manifest retains its pre-launch published/draft distinction until production verification succeeds.

## Verified

- Staging HTTP/HTML audit: 18 pages, resolved JSON-LD, expected canonicals and titles, launch page landmarks, seven workbook links, and sitemap boundaries. See `launch/staging-audit.json`.
- Native desktop screenshots: root homepage, library, tools hub, a company model guide, and diligence handbook. No horizontal overflow on those reviewed pages. Resource headings use Georgia, matching the native editorial style.
- Keyboard skip link was verified to move focus into the main landmark after the Webflow scroll transition.
- Foundation/library checks and exact approved workbook hash checks pass.
- Companion worker changes add `/ontology.json`, `/datasets/ma-library.json`, `/llms.txt`, and MCP dataset discovery while preserving existing tools. Local smoke suite: 63 passed. The worker changes must be merged/deployed with the website release, not ahead of it.

## Outstanding launch gate and access limits

**Native mobile visual review is still outstanding.** The supported browser exposes no viewport resize/device emulation capability. The browser security policy rejected a data-URL preview harness and explicitly prohibited indirect workarounds; the local preview was also blocked. Static responsive-rule checks do not substitute for a rendered mobile review. Obtain a real mobile review of the staging homepage, library, tools hub, and representative resource pages before marking this gate complete.

Webflow rejected nonempty page freeform-code writes with HTTP 406. The supported native schema/SEO fields were used successfully instead. Its Enterprise-only robots/redirect API also rejected this site's plan. The existing root `/llms.txt` therefore remains unchanged; a replacement is prepared at `mcp.mikeye.com/llms.txt`, linked from the new global head, pending the coordinated worker deployment. No root-file replacement or immediate AI ingestion is claimed.

Before release, require successful checks and Vercel preview for the current PR #100 commit and the worker PR. Then publish the Webflow custom domain IDs `6949dc464ea017d4cdaee884` and `6949dc454ea017d4cdaee791`, deploy the companion worker, and rerun the HTTP/schema/download audit against production. Update the canonical resource manifest's seven new publication states only after that verification. User publication authorization already exists; no repeat blanket approval is required.
