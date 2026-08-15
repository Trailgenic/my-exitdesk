# Acquisition Lens — Step 2 Deal Screen

## Purpose

Step 2 converts Mike Ye's buyer-side judgment into a deterministic early deal
screen. It decides whether the current facts support proceeding, continued
investigation, repricing, or passing before the judgment layer writes the narrative.

It does not change any Exit Desk route, prompt, checkout, report, email, or
Webflow integration.

## Governing principle

**Code calculates and applies explicit gates. Mike Ye's acquisition judgment guides the interpretation.**

The deal screen is categorical rather than a weighted score. A numerical score
could hide a fatal issue by allowing attractive attributes to offset it.
Instead, the engine returns strengths, concerns, hard stops, missing
information, and conditions to advance.

## Decision hierarchy

1. **Downside survivability**
   - The deal must survive both revenue decline and margin compression.
   - A failed worst case is a hard stop.
2. **Hard valuation ceiling**
   - The buyer always maintains a private hard ceiling.
   - Scarcity and strategic importance do not override that ceiling.
3. **Seller control**
   - A seller without majority control is ordinarily an early stop.
   - A genuinely scarce or strategically imperative asset may remain under
     investigation only if there is a credible consent path.
4. **Standalone value**
   - Free cash flow and normalized EBITDA govern most valuations.
   - Normalized SDE governs owner-operated businesses.
   - Replacement cost governs when EBITDA and free cash flow are negative.
   - Buyer-specific synergies do not increase standalone value.
5. **Scarcity and category position**
   - A number-one or number-two category position and evidenced scarcity can
     justify staying in a process with a broad non-binding range.
   - An average asset with an unsupported price and no credible economic
     turnaround or synergy bridge is a pass.
6. **Evidence and trust**
   - Missing information remains visible.
   - Evasive responses and inconsistencies increase diligence risk.
   - Even intentional misrepresentation is assessed by type, severity, and
     context rather than treated as an automatic walk.

## Minimum information package before an LOI

The engine requires all of the following to mark the package complete:

- CIM.
- Financial statements, preferably audited.
- Top 10 customer list.
- Employee listing with titles, functions, and compensation; redacted
  compensation is acceptable.
- Revenue and customer mix.

Completing the package does not complete diligence. The general ledger remains
required to reconstruct the financial statements and tie material items to
cash, tax filings, invoices, and contracts.

## Inputs and outputs

`lib/acquisition/deal-screen.ts` accepts:

- Business, industry, competitor, and ownership facts.
- Revenue, EBITDA, SDE, free cash flow, balance-sheet, cash, debt, price, value
  range, and hard-ceiling facts.
- Category position, scarcity, and strategic-importance evidence.
- Turnaround, synergy, and downside-survivability evidence.
- Seller-response and potential-misrepresentation signals.
- LOI package and financial-evidence availability.

It returns:

- Decision posture and confidence.
- Valuation basis and primary return metric.
- Range strategy.
- LOI package completion and readiness.
- Strengths, concerns, hard stops, missing information, and conditions to
  advance.
- An explicit reminder that buyer-created synergies are not shared with the
  seller or included in standalone value.

## Explicit non-goals

Step 2 does not:

- Calculate normalized earnings, value, IRR, payback, or financing scenarios.
- Call an AI model.
- Generate an Acquisition Lens report.
- Add an API route, database, document upload, Stripe product, or Webflow page.
- Change Exit Desk behavior.

Those capabilities belong in later steps after the deterministic calculation
layer is defined.

## Doctrine captured for later steps

The Step 2 doctrine extension also preserves decisions that are not yet inputs
to the early screen:

- Asset purchases are preferred, with stock or membership-interest exceptions
  for scarce, strategically imperative, or continuity-sensitive assets.
- Debt ordinarily reduces equity value; cash, assumed obligations, leases, and
  the normalized working-capital peg are treated explicitly.
- Earnouts are favored when a continuing seller can influence performance,
  with revenue and EBITDA as the default balanced targets and the EBITDA
  definition fixed precisely.
- Strategic buyers emphasize payback period; financial sponsors emphasize IRR.
- The LOI fixes core economics, structure, timing, cash-free debt-free
  treatment, and exclusivity while detailed indemnification ordinarily waits
  for definitive agreements.
- Integration protects the revenue engine while consolidating back-office cost
  functions more quickly.
