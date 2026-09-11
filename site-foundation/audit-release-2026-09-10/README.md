# MikeYe.com content and ontology release — September 2026

Approved implementation of the comprehensive site audit. Exit Desk valuation-uplift marketing claims are explicitly preserved. Further Exit Score schema work is deferred at Mike’s request on September 11.

## Changes

- Home: concise introduction, transaction evidence, six selected resources and seller/product paths; repeated directories and promotions removed.
- M&A Library: seven transaction stages, ten distinct topic guides and one 22-resource catalogue. Tools & Models: 16 verified downloads generated from the same source.
- Ten topic guides and eight resource guides edited for concrete decisions and related tools. Comparable-company analysis replaces the broader comps label while preserving the existing slug and identity.
- Five decision framework pages shortened while retaining cases; glossary and podcast handoffs clarified.
- Sample reports correctly labeled fictional; sample and Main Street product copy aligned. Valuation uplift promises preserved.
- Stable resource IDs, reciprocal relationships, current Comps v1.1 metadata, Pipeline and IC Memo coverage synchronized across CMS snapshots, public JSON, ontology and MCP service.
- Six catalogue shells retained as CMS references but suppressed as public routes; catalogue entries lead to their original publications.
- Podcast description line breaks normalized to repair invalid JSON. An experimental schema binding was removed before release.

## Verification

- Worker smoke suite: 93 passed, zero failed.
- All 16 download targets fetched successfully; workbook ZIP integrity, sheet names, byte sizes and SHA-256 hashes recorded in catalogue/downloads.json.
- Browser review of staged Home and Tools: expected content, 16 downloads, no horizontal overflow.

## Deferred platform settings

- Exit Score schema: manual follow-up, explicitly deferred by Mike.
- Webflow root /llms.txt: replace the older copy with site-foundation/launch/llms.txt. Vercel and MCP copies are part of this release.
- Webflow robots.txt: remove its duplicate Sitemap line, keeping a single https://www.mikeye.com/sitemap.xml declaration. The available settings API requires Enterprise hosting for robots and redirect management; current site is ineligible. No DNS or hosting routes were changed.

## Maintenance

Edit site-foundation/catalogue/cms.json and the supporting source files, then run node scripts/sync-library.mjs. This regenerates the site catalogue embeds, schema update payloads and machine-readable exports. Apply generated Webflow updates and publish both repositories alongside the website. Do not re-publish the six catalogueReference CMS shells.
