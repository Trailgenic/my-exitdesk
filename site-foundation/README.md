# MikeYe.com — Phase 1 foundation

Checkpoint: 2026-09-07. Status: implemented and locally verified; staged for review, not a production release.

## What this phase delivers

- A separate native Webflow draft at `rebuild-foundation`, with semantic page structure, reusable authority header/footer, and six instances of an editable resource-card component. No full-page HTML embed was added.
- Ten draft M&A Topics and six draft M&A Resources catalogue records linking to existing canonical publications. The new resource schema covers methodology, judgment, sources, authorship, rights, versioning, review dates, related topics and related resources.
- A versioned content manifest, design tokens, responsive layout source, standalone design-intent preview, and supplemental machine-readable resource inventory. Planned pages and unlaunched products are not advertised as published resources.
- Backend stabilization: the PDF test module-resolution repair, a canonical redirect for the obsolete checkout route, a reproducible lockfile, and an updated verification workflow.
- Security maintenance: Next.js 14.2.5 → 15.5.24, React 19.2.8, compatible email rendering, asynchronous route parameters, and a pinned PostCSS 8.5.28 override. Removed unused browser Stripe packages belonging to the obsolete checkout; server-side Stripe checkout is unchanged.

The framework target follows the [official August 2026 security release](https://nextjs.org/blog/august-2026-security-release) and [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15). The PostCSS override addresses the remaining same-major transitive audit findings; retain it until the framework pins a fixed release.

## Verification performed

- Clean `npm ci --ignore-scripts` installation without forced peer-dependency overrides.
- TypeScript check passed.
- All 66 Acquisition Lens tests passed, including confidential PDF rendering, email-provider capture, paid entitlement checks, idempotency, and fail-closed authorization.
- Next.js optimized build passed using fake build-only provider keys, with no live provider calls.
- Local HTTP smoke checks passed: legacy checkout redirects without forwarding email/intake data, the existing score redirect is retained, and disabled Acquisition Lens readiness/order/delivery routes fail closed.
- Exit Desk WebMCP registration and result checks passed.
- Foundation checks passed: semantic HTML, anchors, labels, image alt, source responsive rules, text contrast, preservation inventory, and machine-readable draft boundaries.
- Production dependency audit reported **0 vulnerabilities** on September 7, 2026. This is a point-in-time package audit, not a penetration test.
- Native readback confirmed a separate draft page, sitemap exclusion, six reusable resource instances, two new schemas, and all 16 CMS records remaining drafts. Explicit native breakpoint and focus writes were accepted.

Browser/rendered visual QA and live payment/email tests were **not** performed. API style reads expose desktop defaults; responsive write responses were checked, but actual rendering remains a publication gate.

## Preservation and corrected audit findings

The 50 preexisting Webflow page records are preserved in `content-manifest.json`. No existing page, CMS record, site-wide custom code, DNS, production deployment, price, credential, model doctrine, or product activation was changed. Existing Stalled Exit and Acquisition Lens feature branches were left intact.

The missing `exit-campaign.js` is referenced by pending Stalled Exit work, not by the inspected live `/exit` page. It depends on a campaign event route not present on main. Do not deploy that script alone or publish all pending Webflow changes.

Acquisition Lens's 503 readiness response reflects its documented incomplete/frozen configuration. This rebuild does not activate the product or relax its launch gates.

The older Intelligence repository's unique doctrine was not archived or rewritten. Reconciling that legacy surface and expanding the production MCP registry are later content-governance tasks, not silent deletions in this phase.

## Visual review notes

The standalone preview demonstrates the intended EB Garamond / DM Mono typography. The native draft currently uses Georgia / Courier New fallbacks: Webflow could not install the preferred fonts, and an external stylesheet write to the draft head returned HTTP 406. No restricted font route was bypassed. The draft head retains `noindex,nofollow`.

Install approved brand fonts through supported site font settings, then perform desktop/mobile and keyboard visual QA before public release. Native breakpoints are Webflow medium (991), small (767), and tiny (478); the design-intent source's final mobile rule uses 479.

## Reproduce locally

```sh
npm ci --ignore-scripts
npm run typecheck -- --incremental false
npm run test:acquisition
npm run verify:webmcp
node scripts/build-foundation.mjs
node scripts/verify-foundation.mjs
npm audit --omit=dev --audit-level=high
STRIPE_SECRET_KEY=sk_test_phase1_build_placeholder RESEND_API_KEY=re_phase1_build_placeholder NEXT_TELEMETRY_DISABLED=1 npm run build
node scripts/verify-phase1-runtime.mjs
```

The HTML fragments and CSS are source material for native Webflow elements, not instructions to reintroduce embeds. `webflow-state.json` records the created IDs. Avoid re-running initial creation against an existing draft: update the recorded objects instead.

`generated/llms-resources.txt` and the resource JSON files are supplemental previews, **not replacements** for the full existing `llms.txt` or MCP registry. CMS template rendering and bidirectional manifest synchronization are not yet implemented; do not publish the blank collection templates or duplicate canonical article content.

## Publication gates and next phase

1. Review this draft and its typography on desktop/mobile before promoting any public-facing design.
2. Review and merge the isolated backend PR; verify a nonproduction deployment with intended operator configuration. Do not activate Acquisition Lens as part of that deployment.
3. Coordinate the independent Stalled Exit changes before any Webflow site-wide publish.
4. Build the M&A hub and resource templates, then the diligence/integration handbooks and workflow assets with Mike's substantive review.
5. Reconcile the complete canonical content inventory before changing global structured data, `llms.txt`, or MCP resources.

Rollback for this phase is to leave the PR unmerged and the new page/CMS items in draft. Public production needs no rollback because it was not changed. Only temporary duplicate elements created during this build were removed; their source remains in the versioned fragments and reusable component.
