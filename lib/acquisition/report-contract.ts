export interface AcquisitionReportSectionContract {
  id: string;
  order: number;
  title: string;
  purpose: string;
  requiredEvidence: readonly string[];
}

export const ACQUISITION_REPORT_SECTIONS: readonly AcquisitionReportSectionContract[] =
  [
    {
      id: "executive-snapshot",
      order: 0,
      title: "Investment Committee Snapshot",
      purpose:
        "Frame the target in the language an experienced buyer would use internally before accepting the seller's narrative.",
      requiredEvidence: [
        "Target identity and category",
        "Scale",
        "Defining opportunity",
        "Defining uncertainty",
      ],
    },
    {
      id: "decision-posture",
      order: 1,
      title: "Decision Posture",
      purpose:
        "State Proceed, Investigate, Reprice, Protect, or Pass with confidence and conditions to advance.",
      requiredEvidence: [
        "Core reason",
        "Hard vetoes",
        "Compounding risks",
        "Conditions to advance",
      ],
    },
    {
      id: "thesis-and-fit",
      order: 2,
      title: "Acquisition Thesis and Buyer Fit",
      purpose:
        "Test whether the target fits this buyer's capabilities, constraints, operating intent, and acquisition thesis.",
      requiredEvidence: [
        "Buyer thesis",
        "Relevant experience",
        "Operating intent",
        "Target characteristics",
      ],
    },
    {
      id: "deal-economics",
      order: 3,
      title: "Deal Economics",
      purpose:
        "Present deterministic price, earnings, financing, working-capital, capital-expenditure, and downside calculations.",
      requiredEvidence: [
        "Calculation assumptions",
        "Normalized earnings",
        "Implied multiples",
        "Buyer cash requirement",
        "Downside sensitivity",
      ],
    },
    {
      id: "underwriting",
      order: 4,
      title: "What Is Actually Being Underwritten",
      purpose:
        "Assess revenue, earnings, cash conversion, concentration, and transferability without granting credit to unsupported claims.",
      requiredEvidence: [
        "Revenue quality",
        "Earnings quality",
        "Customer concentration",
        "Owner dependence",
        "Management depth",
      ],
    },
    {
      id: "diligence-pressure-map",
      order: 5,
      title: "Diligence Pressure Map",
      purpose:
        "Rank the questions and evidence requests most likely to change the decision.",
      requiredEvidence: [
        "Ranked diligence areas",
        "Reason each matters",
        "Evidence required",
      ],
    },
    {
      id: "investigate-price-protect-walk",
      order: 6,
      title: "Investigate, Price, Protect, Walk",
      purpose:
        "Convert each material finding into a buyer action rather than a descriptive risk list.",
      requiredEvidence: [
        "Items to investigate",
        "Items to price",
        "Items to protect",
        "Walk-away conditions",
      ],
    },
    {
      id: "uncertainty-surface",
      order: 7,
      title: "Uncertainty Surface",
      purpose:
        "Name missing, withheld, contradictory, or unverified information and explain what would resolve it.",
      requiredEvidence: [
        "Unknown fact",
        "Decision consequence",
        "Required evidence",
      ],
    },
    {
      id: "seller-questions",
      order: 8,
      title: "Questions for the Seller",
      purpose:
        "Provide the ranked questions that most efficiently test the acquisition thesis.",
      requiredEvidence: ["Question", "Reason", "Decision affected"],
    },
    {
      id: "next-decision",
      order: 9,
      title: "Next Decision",
      purpose:
        "Identify the next commitment, the evidence required before making it, and the condition that would stop the process.",
      requiredEvidence: [
        "Next commitment",
        "Evidence gate",
        "Stop condition",
      ],
    },
  ] as const;

export const ACQUISITION_REPORT_CONSTRAINTS = [
  "Do not invent facts, financials, market statistics, financing rules, or diligence findings.",
  "Distinguish seller-provided claims from calculated or externally verified evidence.",
  "Do not let narrative language override deterministic calculations.",
  "Do not present an implied multiple or scenario as a formal valuation opinion.",
  "Do not credit add-backs, synergies, or defensibility without stated evidence.",
  "State critical unknowns and their decision consequences explicitly.",
  "Calibrate vocabulary and process assumptions to the selected acquisition segment.",
  "Every material finding must map to investigate, price, protect, or walk.",
  "End with a decision posture and the next evidence-gated commitment.",
] as const;
