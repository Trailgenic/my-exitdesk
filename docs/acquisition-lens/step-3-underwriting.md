# Acquisition Lens — Step 3 Deterministic Underwriting

## Purpose

Step 3 creates the calculation source of truth for Acquisition Lens. It turns
explicit, sourced assumptions into normalized earnings, standalone value,
equity value, capital requirements, buyer returns, and best/most-likely/worst
scenario outputs before the judgment layer interprets the transaction.

It does not change any Exit Desk route, prompt, checkout, report, email, or
Webflow integration.

## Governing principle

**Code calculates. Mike Ye's acquisition judgment guides the interpretation.**

The engine does not invent add-backs, multiples, financing terms, exit values,
or synergies. Every judgment-bearing input remains visible and sourced. The
engine applies accepted inputs deterministically and surfaces incomplete or
weakly supported assumptions.

## Calculation sequence

1. **Normalize earnings**
   - Begin with reported EBITDA, SDE, and unlevered free cash flow.
   - Apply only accepted adjustments.
   - Exclude rejected and pending adjustments.
   - Preserve the category, treatment, evidence source, rationale, and affected
     earnings measures for every adjustment.
2. **Calculate standalone enterprise value**
   - Apply the entered low and high multiple to normalized EBITDA, normalized
     SDE, or normalized unlevered free cash flow.
   - Use an entered replacement-cost range when earnings and free cash flow do
     not support an earnings valuation.
   - Exclude buyer-specific synergy from every standalone calculation.
3. **Bridge enterprise value to equity value**
   - Add cash delivered.
   - Subtract debt, debt-like items, working-capital shortfall, and deferred
     maintenance.
   - On a cash-free/debt-free transaction, cash and debt are entered as zero;
     the normalized working-capital peg remains explicit.
4. **Build closing sources and uses**
   - Start with equity purchase price.
   - Separate earnout and rollover from cash consideration at close.
   - Add refinanced debt, fees, incremental working capital, and near-term
     capital expenditure.
   - Subtract senior debt and seller financing to calculate buyer cash.
5. **Calculate buyer returns**
   - Calculate annual post-debt cash flow, cash-on-cash return, and payback.
   - Calculate IRR only from an explicit annual cash-flow series and exit equity
     value.
   - Identify payback as the primary strategic-buyer return metric and IRR as
     the primary financial-sponsor metric.
6. **Run decision-useful scenarios**
   - Model revenue change and EBITDA-margin change independently so the worst
     case can contain both revenue decline and margin compression.
   - Convert scenario EBITDA to unlevered free cash flow using the entered
     conversion assumption.
   - Test debt-service coverage, minimum annual cash buffer, cash-on-cash
     return, payback, and survivability.

## Add-back governance

The engine accepts the treatment decision but never hides it. The intake and
later judgment layer must apply Mike Ye's doctrine before marking an adjustment as
accepted:

- One-time events, one-time accounting adjustments, and non-ordinary-course
  expenses may be added back when supported.
- Owner compensation is normalized to market compensation; an underpaid owner
  creates a deduction rather than an add-back.
- Family payroll is retained when the role is required and compensation is at
  market; only the unsupported or above-market portion is adjusted.
- Personal expenses are added back only when removal does not affect ordinary
  operations.
- Normal historical growth investment remains included; only spending above
  the normal run rate may be adjusted.
- Deferred maintenance reduces equity value because the buyer must fund it.

## Decision triggers

The engine identifies, but does not narratively resolve:

- Offer value above the buyer's private hard ceiling.
- Offer value above the standalone enterprise-value range.
- A worst case that cannot cover debt service and the required cash buffer.
- Pending or weakly supported accepted adjustments.
- Incomplete valuation or scenario inputs.
- Negative equity value, negative closing consideration, or financing sources
  exceeding uses.

The Step 2 Deal Screen consumes these outputs later. A failed worst case or
hard-ceiling breach remains a pass condition; the judgment layer cannot reason around the
math.

The result includes a small `dealScreenBridge` containing the offer, standalone
range, hard ceiling, and worst-case survivability so the later orchestration
layer does not need to recompute or translate those values.

## Explicit non-goals

Step 3 does not:

- Select market multiples or a replacement-cost range.
- Decide whether seller evidence is credible.
- Share buyer-created synergy with the seller.
- Produce a quality-of-earnings report or replace financial diligence.
- Calculate tax, purchase-accounting, covenant, or legal conclusions.
- Call an AI model or generate the final report.
- Add an API route, database, document upload, Stripe product, or Webflow page.

Those remain later layers built on this deterministic calculation contract.
