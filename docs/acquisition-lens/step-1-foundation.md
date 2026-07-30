# Acquisition Lens — Step 1 Foundation

## Purpose

Step 1 establishes the durable product contract for Acquisition Lens without
changing any Exit Desk route, prompt, checkout, report, email, or Webflow
integration.

The foundation separates four concerns that are combined in the current Exit
Desk prompts:

1. Mike Ye's durable acquisition doctrine.
2. The segment-specific transaction context.
3. Deterministic deal facts and calculations.
4. The required Acquisition Lens report output.

## Governing principle

**Code calculates. Ella interprets.**

Price mechanics, implied multiples, normalized earnings, debt service, buyer
cash requirements, working capital, capital expenditures, and sensitivity
cases must be calculated deterministically. The reasoning engine may interpret
those calculations, but it must not invent or silently recompute them.

## Step 1 modules

- `lib/acquisition/contracts.ts`
  - Canonical intake, buyer, target, deal-term, metric, finding, decision, and
    report types.
- `lib/acquisition/doctrine.ts`
  - Durable acquisition principles distilled from the Exit Desk judgment
    system.
- `lib/acquisition/segments.ts`
  - Main Street, lower-middle-market, and strategic reasoning adapters.
- `lib/acquisition/report-contract.ts`
  - Ordered report sections, evidence requirements, and output constraints.
- `lib/acquisition/index.ts`
  - Public exports for later Acquisition Lens services.

## Explicit non-goals

Step 1 does not:

- Add an API route.
- Call an AI model.
- Add scoring or financial calculations.
- Add Stripe products or prices.
- Accept confidential documents.
- Generate or deliver a report.
- Change Exit Desk behavior.
- Change any Webflow page.

## Next dependency

Before the final Acquisition Lens reasoning prompt is written, complete a
buyer-side delta interview with Mike Ye covering the judgment not required by
Exit Desk:

- Thesis fit.
- Price and return discipline.
- Add-back treatment.
- Financing and downside tolerance.
- Deal structure.
- Integration.
- Synergy evidence.
- LOI conditions.
- Walk-away conditions.
- Opportunity cost.

The resulting answers should extend `MIKE_ACQUISITION_DOCTRINE` rather than
being buried inside a single report-formatting prompt.
