import type {
  AcquisitionIntake,
  ConfidenceLevel,
  DecisionPosture,
  EvidenceSource,
  FindingDisposition,
  RiskFinding,
  RiskRating,
} from "./contracts";
import type { DealScreenResult } from "./deal-screen";
import type { AcquisitionUnderwritingResult } from "./underwriting";

export const ACQUISITION_REASONING_VERSION = "1.0.0" as const;

export const ACQUISITION_REASONING_TOOL_NAME =
  "submit_acquisition_reasoning" as const;

export type AcquisitionRiskDimension = RiskFinding["dimension"];

export type EvidenceStatus =
  | "verified"
  | "provided"
  | "claimed"
  | "missing"
  | "contradictory";

export type ReportReliancePosture =
  | "screen_grade"
  | "diligence_grade"
  | "senior_review_ready";

export interface AcquisitionEvidenceRecord {
  id: string;
  statement: string;
  source: EvidenceSource;
  confidence: ConfidenceLevel;
  status: EvidenceStatus;
  asOfDate: string | null;
  location: string | null;
}

export interface AcquisitionReasoningRequest {
  reasoningVersion: typeof ACQUISITION_REASONING_VERSION;
  reportId: string;
  generatedAt: string;
  intake: AcquisitionIntake;
  dealScreen: DealScreenResult;
  underwriting: AcquisitionUnderwritingResult;
  evidence: AcquisitionEvidenceRecord[];
}

export interface ReasonedAssessment {
  conclusion: string;
  analysis: string;
  implications: string;
  evidenceIds: string[];
}

export interface InvestmentCommitteeSnapshotDraft {
  headline: string;
  transactionFrame: string;
  definingOpportunity: string;
  definingUncertainty: string;
  reliancePosture: ReportReliancePosture;
}

export interface ReasoningFindingDraft {
  id: string;
  dimension: AcquisitionRiskDimension;
  title: string;
  rating: RiskRating;
  disposition: FindingDisposition;
  evidenceIds: string[];
  implication: string;
  requiredAction: string;
}

export interface DiligencePriorityDraft {
  rank: number;
  area: string;
  whyItMatters: string;
  evidenceRequired: string;
  decisionAffected: string;
  evidenceIds: string[];
}

export interface BuyerActionDraft {
  item: string;
  rationale: string;
  evidenceIds: string[];
}

export interface UncertaintyItemDraft {
  unknown: string;
  decisionConsequence: string;
  evidenceRequired: string;
  evidenceIds: string[];
}

export interface SellerQuestionDraft {
  rank: number;
  question: string;
  reason: string;
  decisionAffected: string;
  evidenceIds: string[];
}

export interface NextDecisionDraft {
  commitment: string;
  evidenceGate: string;
  stopCondition: string;
}

/**
 * Narrative-only model output. It intentionally contains no calculated values
 * and no model-selected decision posture.
 */
export interface AcquisitionReasoningDraft {
  investmentCommitteeSnapshot: InvestmentCommitteeSnapshotDraft;
  decisionInterpretation: string;
  thesisAssessment: ReasonedAssessment;
  buyerFitAssessment: ReasonedAssessment;
  economicsInterpretation: ReasonedAssessment;
  revenueQuality: ReasonedAssessment;
  earningsQuality: ReasonedAssessment;
  cashConversion: ReasonedAssessment;
  ownerDependence: ReasonedAssessment;
  managementDepth: ReasonedAssessment;
  customerConcentration: ReasonedAssessment;
  workingCapital: ReasonedAssessment;
  capitalExpenditure: ReasonedAssessment;
  aiExposure: ReasonedAssessment;
  financing: ReasonedAssessment;
  integration: ReasonedAssessment;
  sellerMotivation: ReasonedAssessment;
  findings: ReasoningFindingDraft[];
  diligencePressureMap: DiligencePriorityDraft[];
  actionMap: {
    investigate: BuyerActionDraft[];
    price: BuyerActionDraft[];
    protect: BuyerActionDraft[];
  };
  walkAwayConditions: BuyerActionDraft[];
  uncertaintySurface: UncertaintyItemDraft[];
  rankedSellerQuestions: SellerQuestionDraft[];
  nextDecision: NextDecisionDraft;
  limitations: string[];
}

export interface GoverningDecision {
  posture: DecisionPosture;
  confidence: ConfidenceLevel;
  coreReason: string;
  conditionsToAdvance: string[];
  hardVetoes: string[];
  compoundingRisks: string[];
}

export interface InvestmentCommitteeSnapshot
  extends InvestmentCommitteeSnapshotDraft {
  recommendation: DecisionPosture;
  confidence: ConfidenceLevel;
}

export interface AcquisitionReasoningReport {
  reasoningVersion: typeof ACQUISITION_REASONING_VERSION;
  contractVersion: AcquisitionIntake["contractVersion"];
  reportId: string;
  generatedAt: string;
  targetName: string;
  segment: AcquisitionIntake["segment"];
  stage: AcquisitionIntake["stage"];
  investmentCommitteeSnapshot: InvestmentCommitteeSnapshot;
  decision: GoverningDecision;
  decisionInterpretation: string;
  thesisAssessment: ReasonedAssessment;
  buyerFitAssessment: ReasonedAssessment;
  dealEconomics: {
    interpretation: ReasonedAssessment;
    deterministicUnderwriting: AcquisitionUnderwritingResult;
  };
  underwritingAssessment: {
    revenueQuality: ReasonedAssessment;
    earningsQuality: ReasonedAssessment;
    cashConversion: ReasonedAssessment;
    ownerDependence: ReasonedAssessment;
    managementDepth: ReasonedAssessment;
    customerConcentration: ReasonedAssessment;
    workingCapital: ReasonedAssessment;
    capitalExpenditure: ReasonedAssessment;
    aiExposure: ReasonedAssessment;
    financing: ReasonedAssessment;
    integration: ReasonedAssessment;
    sellerMotivation: ReasonedAssessment;
  };
  findings: ReasoningFindingDraft[];
  diligencePressureMap: DiligencePriorityDraft[];
  actionMap: AcquisitionReasoningDraft["actionMap"];
  walkAwayConditions: BuyerActionDraft[];
  uncertaintySurface: UncertaintyItemDraft[];
  rankedSellerQuestions: SellerQuestionDraft[];
  nextDecision: NextDecisionDraft;
  deterministicDealScreen: DealScreenResult;
  evidenceRegister: AcquisitionEvidenceRecord[];
  authorityNote: string;
  limitations: string[];
}

export interface AcquisitionReasoningModelRequest {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
  toolName: typeof ACQUISITION_REASONING_TOOL_NAME;
  toolSchema: Record<string, unknown>;
}

export interface AcquisitionReasoningModel {
  generateStructured(
    request: AcquisitionReasoningModelRequest,
  ): Promise<unknown>;
}
