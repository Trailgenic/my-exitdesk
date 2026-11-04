# mikeye.com content

mikeye.com is served by this project (moved from Webflow on 2026-11-04).
Every page is static HTML in `public/_site/<address>/index.html`.

## Collection pages are generated

Four kinds of page come from one entry each, so adding one is a single entry,
not a hand-built page:

| Collection | Content file | Address |
|---|---|---|
| Glossary terms | `content/glossary.json` | `/glossary/<slug>` |
| Podcast episodes | `content/podcast.json` | `/podcast/<slug>` |
| M&A topics | `content/ma-topics.json` | `/ma-topics/<slug>` |
| Tools and models | `content/ma-resources.json` | `/ma-resources/<slug>` |

Each file lists its `fields`, the `defaults` used when a field is left out,
and the `items`. Text fields are written the way they appear in the page
(`&#x27;` for an apostrophe, `&amp;` for &); long fields are HTML.

The layout of each kind of page is in `templates/<collection>.html`; the
row shown on its index page is `templates/<collection>.hub-item.html`.

### Add or change an entry

1. Edit the item in `content/<collection>.json`. For a new item, copy an
   existing one; fields listed in `defaults` can be left out.
2. To list it on the index page, add its slug to `hub.lists` in the same
   file (glossary: the category list; podcast: top of the list; topics: in
   order, with `order_number`).
3. Run `python3 scripts/site/build.py`. It writes the page, the index-page
   list and the sitemap entry.
4. Run `python3 scripts/site/build.py --check` (CI runs it too).

Also update by hand when relevant: `public/llms.txt`,
`public/datasets/ma-library.json` and `public/ontology.json` (what AI
models read), and for tools and models, the catalogue sections on
`/m-and-a` and `/tools-and-models`. Upcoming podcast episodes are the second
list on `/podcast` and are edited there directly.

## Every other page

Edit the HTML in `public/_site/` directly. Keep each page's structured data
(`application/ld+json` blocks) valid JSON.

Downloads Webflow hosted are in `public/assets/webflow/`; the site's own
downloads are in `public/resources/`.
