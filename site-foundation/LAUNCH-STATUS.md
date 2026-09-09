# MikeYe launch — September 8, 2026

The user authorized native conversion of `/exit`, `/exit/score`, and `/exit/checkout`, followed by publication. This supersedes the older manual embed restoration instructions in Phase 7 and its publish pack.

## Published and verified

- Webflow production publication succeeded for `www.mikeye.com` and `mikeye.com`.
- All 18 production URLs passed the HTML, canonical, JSON-LD, landmark, native funnel, sitemap and download-link audit. The sitemap contains 109 URLs and excludes unfinished Acquisition Lens, thin topic pages and the draft homepage.
- Seven public Excel downloads match their approved SHA-256 hashes: five valuation models and two working packs.
- Native Exit Desk overview, diagnostic and checkout use the shared site design. Legacy embed sections remain hidden for rollback. The separate Cashflow Routes bridge remains.
- Score runtime 1.0.2 and checkout runtime 1.0.1 are deployed through Vercel and applied as registered Webflow scripts with integrity hashes.
- Browser QA covered keyboard selection, question progression, the 93-point Main Street path, the 100-point path, a 10-point action-plan path, and repeated high-to-low assessments. The low path now returns no stale checkout URL through WebMCP.
- Synthetic Stripe sessions displayed the correct $199 Main Street and $499 Full Report prices. No payment, email, or customer information was submitted. Email CORS and local runtime handling were checked; inbox delivery was not exercised.
- Direct mobile screenshots are unavailable through the supported browser. Desktop rendering and responsive CSS were checked; no device-rendering claim is made.

## Machine discovery

Worker PR 11 was merged at `3e6b1d73f130332a8c3b85dd703d9ef4f5c418f3`. Cloudflare deployment run `34182988273` succeeded. Its dataset and ontology contain 13 resources and 10 topics.

Direct verification requests to `mcp.mikeye.com` received Cloudflare 403 / error 1010. No security settings were changed. The available plugin search returned no accessible Cloudflare integration.

The website repository also generates public discovery copies at `/ontology.json`, `/datasets/ma-library.json`, and `/llms.txt` on `my-exitdesk.vercel.app`. All three returned HTTP 200 and matched the source bytes exactly after PR 103 deployed at `48b59d9`. The ontology uses `application/ld+json`. They preserve all canonical MikeYe entity and methodology URLs. Global discovery links now point to these public copies. The root `www.mikeye.com/llms.txt` is separately managed and remains unchanged; its available file-management API requires Enterprise hosting.

## Source of truth and continuation

The canonical content manifest has been promoted only after a successful production audit. Its 13 resources now reflect actual publication; future builds no longer omit the seven new guides as drafts. The ontology and inventory remain generated from that manifest.

Current production code merges: PR 100 (`126e518`), PR 101 (`714c755`), PR 102 (`c549dcd`), and PR 103 (`48b59d9`). PR 103 passed GitHub Actions run `34183389101`; its production Vercel deployment also succeeded. Native controls, script versions and rollback IDs are documented in `native-funnel/README.md`. HTML, download and public machine-data audit evidence is under `launch/production-*.json`.

Daily additions can proceed from this published foundation. Keep Acquisition Lens and the separate Stalled Exit campaign unlaunched until their own work is approved and verified.

The next major editorial phase is recorded in `FUTURE-UPDATES.md`: an end-to-end M&A deal workflow checklist, a comprehensive due diligence checklist, and a comprehensive post-deal integration checklist. Each resource will combine credible research with Mike's documented judgment and will require Mike's review and approval before it becomes canonical or is published.

On September 9, 2026, Mike approved the comprehensive 112-item due diligence checklist and 104-action post-deal integration checklist. Both versioned workbooks, their handbook download blocks, hub references, CMS metadata, JSON-LD, `llms.txt`, ontology, and resource inventory were promoted together. The end-to-end M&A deal workflow checklist remains the next major editorial deliverable.
