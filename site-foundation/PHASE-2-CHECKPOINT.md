# Phase 2 checkpoint — Library and reading architecture

Status: staged implementation. No public Webflow publish or production merge.

## Approved copy

**The Deal Is Only the Beginning.**

M&A frameworks, valuation models, and practical tools built from 25 years of acquiring businesses, integrating operations, and creating value.

Applied to the existing rebuild homepage and its source. The original public homepage remains unchanged.

## New connected surfaces

- `/m-and-a`: a separate unpublished library. Resource cards are native CMS items, not copied embeds. The shared card binds format, name, summary, and the original publication URL. The query requires a canonical URL and sorts by name.
- Lifecycle index: native topic collection ordered by lifecycle order. Ten existing draft topics; no fabricated handbooks, spreadsheets, or download links.
- M&A Resources Template: CMS-bound title, format, summary, decision answered, author, original-publication link, methodology, judgment notes, and sources. Methodology/judgment regions have no standalone placeholder headings when their fields are empty.
- M&A Topics Template: CMS-bound name and summary with a clear development-state note and a route back to the available resource catalogue.
- Existing rebuild header/footer reused across all three surfaces. The header now points to the library rather than page-specific anchors that would break on reading pages.

All 16 topic/resource records remain drafts. The new catalogue templates are not a migration of existing articles; original publication URLs remain authoritative. Both collection templates and the library carry `noindex,nofollow`; the library is excluded from the sitemap. Collection template `draft:false` metadata does not publish its draft items.

## Preview and source

`generated/MikeYe-Library-Preview.html` is a standalone design-intent preview generated from the existing canonical manifest. It is not an HTML embed or the Webflow CMS runtime. Native catalogue bindings are recorded separately in `phase-2-webflow-state.json`.

The three `*-shell` / `*-template` files document the native page scaffolds. Their temporary heading labels must never be published as standalone pages: the Webflow reading templates bind them to actual CMS fields. Native rich-text starter content was replaced by CMS bindings.

The standalone homepage preview keeps its navigation local to that preview. The native shared header's Applied Products link temporarily targets `/rebuild-foundation#products`; change it to the approved homepage destination when the rebuild is promoted.

## Verification scope

Structural checks cover the approved headline, unique main/H1 elements, preview anchor integrity, all six original publication links, truthful availability language, and draft indexing boundaries. Native API readback checks the content bindings and list source/sort configuration. The native base-variant reader supports checking mobile grid and focus values without a browser.

No browser/rendered visual QA or real purchase/email tests are claimed. Brand-font installation remains an explicit release gate from Phase 1; no blocked font operation was retried. No backend dependency or transaction-judgment changes are included in this checkpoint.

## What comes next

1. Complete approved brand fonts and rendered desktop/mobile review before public release.
2. Author and substantively review the workflow diligence and integration flagships; populate methodology and judgment fields rather than filling the library with thin duplicate pages.
3. Add optional resource versions, review dates, download controls, and related-resource presentation only when actual reviewed content/files exist.
4. Reconcile canonical paths, page metadata, global structured data, and the full machine-readable registry before launch. Current collection paths are staging scaffolds; topic canonical URL fields remain unset.
5. Coordinate the independent Stalled Exit branch before publishing any site-wide Webflow changes.

Only new builder placeholder copy was removed in this phase. Existing published content, downloads, funnels, prices, credentials, and product activation remain unchanged.
