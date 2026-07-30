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
  ] as const;

export const ACQUISITION_DOCTRINE_AUTHORITY_NOTE =
  "This analysis applies the acquisition and portfolio-operations judgment framework of Mike Ye. It is not legal, tax, accounting, investment, lending, or formal valuation advice.";
