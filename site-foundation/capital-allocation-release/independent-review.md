# Capital Allocation & Deal Affordability Tool — Independent Review

Mathematical review: passed. No remaining material calculation blocker identified in the reviewed draft. Production publication and visual review are separate release gates.

## Decision and model conventions

- Maximum affordable enterprise value is conditional on the selected committed debt and equity amounts. It is the minimum reserve-preserving price bound at close and each of five year ends. It does not optimize across capital structures.
- The fixed financing must satisfy every modeled annual opening-gross-debt / forecast-combined-EBITDA and EBITDA / cash-interest constraint. Reducing price cannot repair a ratio breach under unchanged debt amounts.
- The hard walk-away is the lowest affordable, opportunity-adjusted return-supported and strategic price limit. A single active forecast is used. Base and Upside withhold the reviewed hard walk-away; selecting Downside, completing evidence and outcome fields, confirming funding, and confirming Buy feasibility are prerequisites.
- Price is debt-free, cash-free enterprise value with normalized working capital. Seller equity proceeds require a separate closing bridge.
- Buyer cash deducts restricted cash, the unrestricted reserve and other closing commitments once. Residual closing cash carries forward. Future buyer cash excludes debt service, which the model deducts separately.
- All new debt principal remaining at Year 5 is repaid. Terminal sale proceeds and assumed refinancing cannot support operating liquidity.
- Standalone cash flows are separate from buyer synergy. Every negative annual discounted synergy cash flow reduces price fully; only the entered share of each positive annual discounted synergy cash flow enters the price premium.
- Unlevered project IRR includes the Year 5 sale. Operating payback excludes it and reports the first whole year of recovery. IRR is unavailable under the documented negative-future-flow guard.
- Year 1 standalone ROIC is NOPAT / (enterprise value + additional investment at close + Year 1 follow-on investment), excluding fees and buyer synergy. It is explicitly an acquisition-cost proxy.
- Comparable mutually exclusive alternatives use the same horizon, hurdle and baseline. The highest positive feasible nonbuy NPV is the opportunity-cost deduction. Explicit zero remains zero.

## Resolved findings

The review prompted corrections to committed-financing gates, fixed-financing price bounds, original-source blank checks before case selection, zero financing and zero opportunity-cost treatment, the starting-reserve and existing-debt prerequisite gate, the required-outcome field, infeasible Buy status, negative synergy treatment and methodology wording.

## Independent verification

33 of 33 independent checks passed after importing the exported workbook and recalculating. JavaScript arithmetic independently reconstructed the five annual standalone cash flows, cash balances, leverage and coverage, discounted values, funding price bounds, economic NPV, ROIC, opportunity cost and hard ceiling. Base IRR was solved independently by bisection. Additional tests confirmed that a Year 5 ratio breach and an existing-debt breach with zero new borrowing suppress the affordability result.

Illustrative reviewed Downside inputs produced a $28.6275 million financing-conditioned affordability limit and a $12.091671 million hard ceiling. The latter is constrained by economic value rather than available financing. The Base project IRR was 18.1947262%. These are fictional Assumption inputs, not deal conclusions.

The companion builder reported 43 focused checks passing when this mathematical review was completed. Its final release record may include further presentation and boundary checks. The independent check detail is in `independent-math.json`.

## Methodology reconciliation

The native website methodology draft was reconciled to the actual price convention, fixed-financing calculation, annual liquidity timing, IRR, payback, ROIC and annual synergy treatment. No mismatch remained at review.

## Production verifier

Prepared `my-exitdesk/scripts/verify-capital-allocation-release.py`. It expects 19 resources, 13 workbook downloads and 14 Tools items; checks reciprocal links to acquisition mandate, LOI economics, synergy bridge, carve-out planner and deal workflow; and preserves all seven primary stage destinations. Syntax checked without generating bytecode. Production execution is pending the release owner's deployment signal.

## Limits

Desktop Excel was unavailable. Imported formula recalculation used the spreadsheet engine, with an independent JavaScript arithmetic cross-check. Annual periods can miss intra-year liquidity troughs. Financing commitments, evidence and alternative feasibility remain human review inputs and require renewal when assumptions change.
