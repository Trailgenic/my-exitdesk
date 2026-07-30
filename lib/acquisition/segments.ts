import type { AcquisitionSegment, BuyerType } from "./contracts";

export interface AcquisitionSegmentProfile {
  id: AcquisitionSegment;
  label: string;
  typicalBuyers: readonly BuyerType[];
  governingQuestion: string;
  primaryDecisionFactors: readonly string[];
  vocabularyGuidance: string;
  prohibitedFraming: readonly string[];
}

/**
 * Segment profiles adapt the durable doctrine to the actual buyer and deal.
 * They intentionally avoid hard-coded market statistics and financing rules.
 */
export const ACQUISITION_SEGMENT_PROFILES: Record<
  AcquisitionSegment,
  AcquisitionSegmentProfile
> = {
  main_street: {
    id: "main_street",
    label: "Main Street and owner-operator acquisition",
    typicalBuyers: ["individual_operator", "sba_buyer", "adjacent_operator"],
    governingQuestion:
      "Can this buyer acquire, finance, transition, and personally operate the target without destroying the cash flow being purchased?",
    primaryDecisionFactors: [
      "Transferable owner earnings",
      "Financing resilience",
      "Owner transition",
      "Customer and employee retention",
      "License and lease transferability",
      "Buyer operating fit",
    ],
    vocabularyGuidance:
      "Use plain operating and acquisition language. Explain SDE, debt service, seller financing, transition, and personal operating obligations on first use.",
    prohibitedFraming: [
      "Do not describe an owner-operated business as a private-equity platform.",
      "Do not assume a competitive auction or institutional diligence process.",
      "Do not treat ordinary founder involvement as an automatic veto.",
    ],
  },
  lower_middle_market: {
    id: "lower_middle_market",
    label: "Lower-middle-market acquisition",
    typicalBuyers: [
      "self_funded_searcher",
      "funded_searcher",
      "independent_sponsor",
      "family_office",
      "private_equity",
    ],
    governingQuestion:
      "Does normalized cash flow, management transferability, and the proposed capital structure support the acquisition thesis under a credible downside case?",
    primaryDecisionFactors: [
      "Normalized EBITDA",
      "Revenue and earnings quality",
      "Management depth",
      "Customer concentration",
      "Capital structure",
      "Diligence and integration risk",
    ],
    vocabularyGuidance:
      "Use investment-committee precision while defining specialist terms for first-time or self-funded buyers.",
    prohibitedFraming: [
      "Do not assume reported add-backs are accepted.",
      "Do not credit synergies in the base case without an executable owner and timeline.",
      "Do not allow financing availability to substitute for price discipline.",
    ],
  },
  strategic: {
    id: "strategic",
    label: "Strategic or adjacent-operator acquisition",
    typicalBuyers: ["strategic_acquirer", "adjacent_operator"],
    governingQuestion:
      "Does ownership create a durable strategic advantage that exceeds the standalone value and integration cost of the target?",
    primaryDecisionFactors: [
      "Strategic control or scarce capability",
      "Standalone value",
      "Synergy evidence",
      "Integration complexity",
      "Customer and talent retention",
      "Alternative build, partner, or wait options",
    ],
    vocabularyGuidance:
      "Separate standalone underwriting from strategic value and identify the specific owner of every claimed synergy.",
    prohibitedFraming: [
      "Do not use strategic rationale to excuse weak standalone economics.",
      "Do not count revenue synergies as certain.",
      "Do not ignore the build-versus-buy alternative.",
    ],
  },
};
