export interface AcquisitionDoctrinePrinciple {
  id: string;
  title: string;
  rule: string;
  acquisitionApplication: string;
}

/**
 * Durable acquisition doctrine distilled from Mike Ye's Exit Desk judgment
 * system. These principles govern reasoning; they do not contain temporary
 * market statistics, product pricing, report formatting, or model settings.
 */
export const MIKE_ACQUISITION_DOCTRINE: readonly AcquisitionDoctrinePrinciple[] =
  [
    {
      id: "frame-before-detail",
      title: "Frame before detail",
      rule: "Describe the opportunity as an experienced buyer would describe it internally before accepting the seller's narrative.",
      acquisitionApplication:
        "State what is actually being acquired, why it may matter, and the defining uncertainty before deeper analysis.",
    },
    {
      id: "underwrite-not-admire",
      title: "Underwrite rather than admire",
      rule: "Growth and narrative receive no credit until revenue durability, earnings quality, concentration, and cash conversion support them.",
      acquisitionApplication:
        "Separate reported performance from underwritable performance and identify what must be verified.",
    },
    {
      id: "transferability",
      title: "Determine what transfers",
      rule: "A company has acquisition value only to the extent its revenue, capability, relationships, systems, and licenses survive a change in ownership.",
      acquisitionApplication:
        "Identify what transfers at close, what requires transition support, and what may not transfer at all.",
    },
    {
      id: "motivation-is-data",
      title: "Treat motivation as data",
      rule: "Seller motivation must be tested against financial trajectory, operating reality, and process timing.",
      acquisitionApplication:
        "Name inconsistencies and explain how urgency or ambiguity may affect diligence, price, and leverage.",
    },
    {
      id: "veto-versus-compounding-risk",
      title: "Distinguish vetoes from compounded risk",
      rule: "One fatal condition is different from several moderate risks that may be priced, investigated, or protected through structure.",
      acquisitionApplication:
        "Classify findings as investigate, price, protect, or walk and identify any hard veto explicitly.",
    },
    {
      id: "bankability-shapes-market",
      title: "Bankability shapes the transaction",
      rule: "Financing capacity determines the feasible buyer universe, purchase-price capacity, and negotiating dynamics.",
      acquisitionApplication:
        "Test the proposed capital structure against normalized cash flow and downside cases rather than treating financing as an afterthought.",
    },
    {
      id: "evidence-before-moat",
      title: "Require evidence for defensibility",
      rule: "Claimed moats receive no credit until supported by contracts, licenses, switching costs, scarce capability, durable relationships, or operating evidence.",
      acquisitionApplication:
        "Separate substantiated defensibility from seller assertion and identify the evidence still required.",
    },
    {
      id: "unknowns-are-findings",
      title: "Unknowns are findings",
      rule: "Missing, withheld, contradictory, or unverified information defines the uncertainty surface and must never be silently filled with assumptions.",
      acquisitionApplication:
        "State what cannot be concluded, why it matters, and what evidence would resolve the uncertainty.",
    },
    {
      id: "scale-calibrates-judgment",
      title: "Calibrate judgment to the real transaction",
      rule: "Buyer behavior, financing, vocabulary, diligence, and process dynamics change with scale and buyer type.",
      acquisitionApplication:
        "Use the appropriate segment adapter instead of applying institutional language to an owner-operated acquisition or vice versa.",
    },
    {
      id: "decision-not-description",
      title: "Convert analysis into a decision",
      rule: "Analysis is incomplete until it changes what the buyer should investigate, price, protect, or reject.",
      acquisitionApplication:
        "End with a decision posture, conditions to advance, walk-away conditions, and the next irreversible commitment.",
    },
    {
      id: "control-and-alignment",
      title: "Require control and seller alignment",
      rule: "A buyer should know who can deliver the company, whether the sellers control the required vote, and whether the owner-operators retain enough economic alignment to support a stable transition.",
      acquisitionApplication:
        "Treat missing seller control as a potential early stop. Preserve an exception only for a genuinely scarce or strategically imperative asset with a credible consent path.",
    },
    {
      id: "value-from-underwritable-economics",
      title: "Value underwritable economics",
      rule: "Value a company from normalized free cash flow and EBITDA, use normalized SDE for an owner-operated business, and use replacement cost when earnings and free cash flow are negative.",
      acquisitionApplication:
        "Vet add-backs, accounting policies, owner compensation, family payroll, personal expenses, growth investment, and deferred maintenance before relying on reported earnings.",
    },
    {
      id: "buyer-keeps-synergy",
      title: "Keep buyer-created synergy separate",
      rule: "The seller is paid for the value created to date; buyer-specific synergy belongs to the buyer who must fund, execute, and bear the risk of realizing it.",
      acquisitionApplication:
        "Do not increase standalone value for buyer-specific synergy. Use credible synergy only to assess strategic fit, affordability, and the buyer's private hard ceiling.",
    },
    {
      id: "survive-the-downside",
      title: "Require downside survivability",
      rule: "A transaction must remain survivable through both revenue decline and margin compression.",
      acquisitionApplication:
        "Model best, most-likely, and worst cases, including financing cost and required capital. If the worst case is not survivable, do not advance.",
    },
    {
      id: "replicate-the-financials",
      title: "Replicate the financials",
      rule: "Reported results are not fully underwritten until they can be reconstructed from the general ledger and tied to cash, tax filings, invoices, and contracts.",
      acquisitionApplication:
        "Prefer a quality-of-earnings report, then audited financials. Investigate overstated revenue, understated expense, concentration, and undisclosed obligations without treating every explainable variance as fraud.",
    },
    {
      id: "protect-revenue-integrate-cost",
      title: "Protect revenue while integrating cost",
      rule: "Revenue-producing functions should be integrated carefully; back-office cost functions can usually be integrated more quickly.",
      acquisitionApplication:
        "Preserve a standalone operating view for up to six months when helpful for transition and earnout measurement, while planning earlier integration of finance, HR, technology, and other support functions.",
    },
    {
      id: "ceiling-and-patience",
      title: "Maintain a ceiling and patience",
      rule: "A broad range may preserve access to a scarce asset, but every deal requires a hard ceiling and the discipline to walk when it is reached.",
      acquisitionApplication:
        "Stay available if an over-priced process fails. A later re-entry at a supportable valuation is preferable to winning an uneconomic auction.",
    },
    {
      id: "structure-liability-deliberately",
      title: "Structure liability deliberately",
      rule: "Prefer an asset purchase to select the assets and liabilities acquired; accept stock or membership interests when strategic necessity, scarcity, or continuity justifies the additional exposure.",
      acquisitionApplication:
        "Separate enterprise value from equity value, subtract debt unless specifically assumed, normalize the working-capital peg, and assess contracts, licenses, leases, and ordinary-course obligations for continuity and risk.",
    },
    {
      id: "use-contingency-for-alignment",
      title: "Use contingency for alignment",
      rule: "Earnouts are most useful when the seller remains with the business and can influence the result.",
      acquisitionApplication:
        "A typical starting point balances revenue and EBITDA targets equally, with the EBITDA definition and accounting policies stated precisely. Structural inflexibility may be cured through a lower price.",
    },
    {
      id: "match-return-metric-to-buyer",
      title: "Match the return metric to the buyer",
      rule: "Strategic buyers should emphasize payback period, while financial sponsors should emphasize internal rate of return.",
      acquisitionApplication:
        "Do not let the wrong headline return metric obscure the capital, financing, and downside risks that matter to the actual buyer.",
    },
    {
      id: "trust-is-earned-in-diligence",
      title: "Let diligence update trust",
      rule: "Forthright, consistent, and timely seller responses increase trust; evasiveness, inconsistency, and unexplained delay reduce it.",
      acquisitionApplication:
        "Assess a suspected misrepresentation by its type, severity, materiality, and explanation. Investigate intentional conduct rigorously without making it an automatic walk in every case.",
    },
    {
      id: "loi-fixes-core-economics",
      title: "Use the LOI to fix core economics",
      rule: "The LOI should define valuation, cash-free debt-free treatment, timing, exclusivity, and the principal economic and structural assumptions without prematurely negotiating every definitive-agreement provision.",
      acquisitionApplication:
        "Include customary representations and warranties at a high level. Leave detailed indemnification, caps, baskets, survival periods, and known-liability allocation for definitive agreements unless a specific risk requires earlier agreement.",
    },
  ] as const;

export const ACQUISITION_DOCTRINE_AUTHORITY_NOTE =
  "This analysis applies the acquisition and portfolio-operations judgment framework of Mike Ye. It is not legal, tax, accounting, investment, lending, or formal valuation advice.";
