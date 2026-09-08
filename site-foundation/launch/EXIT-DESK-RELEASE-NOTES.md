# Preserve the live Exit Desk funnel for the library launch

The M&A library is staged at https://mike-ye.webflow.io/. Publishing the entire Webflow site would also release previously pending seller-funnel changes. Their campaign script currently returns 404 and its backend is outside this rebuild.

The available Webflow tools cannot edit the existing HTML Embed code. These three prepared files reproduce the current production embed content, extracted from the inspected public HTML. The separate pending versions and their diffs remain saved in this directory.

In Webflow Designer, replace the content of the existing principal HTML Embed on each page with the corresponding **production** file:

| Page | Production content to restore |
| --- | --- |
| `/exit` | `exit-production-embed.html` |
| `/exit/score` | `exit-score-production-embed.html` |
| `/exit/checkout` | `exit-checkout-production-embed.html` |

Keep the surrounding page, global code, and other page elements. Do not use the files ending in `staging-embed.html`; those preserve the pending campaign work. Do not publish the production domains yet. Publish only to the Webflow staging subdomain and check the refreshed staging site on a phone.

Mobile review: open the homepage, M&A Library, Tools & Models, and a model or handbook from the tools hub. Check navigation wrapping, readable headings/body text, sideways overflow, and downloadable files. Some library cards use production canonical URLs and will become available at that domain after launch; use the relative guide links in Tools & Models for staging review.

After these two gates, the existing authorization covers publication. The agent can rerun staging verification, release the Webflow custom domains with the companion worker, and verify the live site. The worker PR is https://github.com/Trailgenic/mikeye-workers/pull/11; the rebuild PR is https://github.com/Trailgenic/my-exitdesk/pull/100.

The root `www.mikeye.com/llms.txt` could not be replaced through the available API on this hosting plan. An updated guide is prepared in `llms.txt` and will be served at `mcp.mikeye.com/llms.txt` with links from the new global head. This does not claim the root file has changed or that AI services will ingest the site immediately.
