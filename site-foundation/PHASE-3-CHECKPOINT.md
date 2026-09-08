# Practical resources and career evidence — 2026-09-07

The rebuild now directs the deal-list call to action to `/about`. A separate career-evidence note labels `/about/record` as PMC mastheads documenting title and tenure. The native draft and generated homepage agree. Published About and archival masthead pages were read to verify the distinction; neither was modified.

## New resource drafts

- **Before You Buy: Follow the Work** — begin with a customer sale, reconstruct its financial trail, test whether someone else can do the work, and turn findings into investigate/price/protect/walk decisions. Includes starting requests, a workflow walkthrough, rights questions, an explicitly fictional example and a reusable issue note.
- **After the Deal: Keep the Business Working** — protect revenue, transfer diligence issues to named owners, check Day 1 continuity, test changes, preserve useful reporting and verify synergy delivery. Includes a fictional billing example, a handover note and a suggested weekly working meeting.

The two JSON manuscripts in `editorial/` are the source for the full local preview and native CMS content. `editorial/README.md` records the repositories and commits reviewed, the governing principle IDs, editorial applications, missing raw interview material and career-evidence rules. These are drafts prepared for Mike's review, not newly approved quotations or signed-off advice.

## Connected implementation

Two new M&A Resources CMS items are drafts, with complete body and source notes, version `0.1-draft`, no canonical publication URL and no invented review date. The library links to them in an explicit editorial-drafts section. Its existing available-resources query still selects the six original publications through their populated canonical URLs.

The resource template continues to bind body and source notes to CMS. Its unused original-publication button is hidden, so an authored guide cannot display an empty link. Existing catalogue entries retain their original publication links in source notes and in library cards. The reader-facing prompt is now “What this helps you decide.”

The standalone Library preview contains both complete guides, including working notes, within one portable HTML file. Technical terms are defined as they arise. The homepage workflow descriptions now give concrete starting tasks.

## Verification

- Native readback confirmed the deal link, PMC evidence note and handbook navigation.
- Both CMS bodies and source notes exactly matched the authored source; both remain draft with empty publication/review fields.
- Template bindings and hidden-button state were read back; the template retains `noindex,nofollow`.
- The rebuilt homepage and library remain draft pages.
- Local foundation/library checks passed: semantics, anchors, preserved routes, six original resource links, source-principle references, career-evidence labels and exclusion of draft guides from machine-readable public inventories.
- No backend behavior changed. CI on the draft PR runs the existing repository gates after this checkpoint is pushed.

Exact native IDs and verification results are in `phase-3-webflow-state.json`. Earlier checkpoint counts are historical: the current additive inventory is 10 draft Topics and 8 draft Resources.

## Remaining release work

Mike's editorial review, native brand fonts, rendered visual QA and the coordinated publication/redirect plan remain release gates. The original interview transcript and the legacy prompt's referenced Knowledge Capsule/Example Suite were not found; locating them may add further nuance. No production merge or Webflow publication was performed. Acquisition Lens and the independent pending Stalled Exit work retain their prior state.
