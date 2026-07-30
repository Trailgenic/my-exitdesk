export const ACQUISITION_CONTRACT_VERSION = "1.0.0" as const;

export type AcquisitionSegment =
  | "main_street"
  | "lower_middle_market"
  | "strategic";

export type AcquisitionStage =
  | "screen"
  | "teaser"
  | "cim"
  | "loi"
  | "diligence";

export type BuyerType =
  | "individual_operator"
  | "sba_buyer"
  | "self_funded_searcher"
  | "funded_searcher"
  | "independent_sponsor"
  | "family_office"
  | "private_equity"
  | "strategic_acquirer"
  | "adjacent_operator"
  | "other";

export type DecisionPosture =
  | "proceed"
  | "investigate"
  | "reprice"
  | "protect"
  | "pass";

export type ConfidenceLevel = "high" | "moderate" | "low" | "unknown";

export type RiskRating = "high" | "moderate" | "low" | "unknown";

export type EvidenceSource =
  | "buyer_provided"
  | "seller_provided"
  | "calculated"
  | "externally_verified"
  | "unknown";

export type FindingDisposition =
  | "investigate"
  | "price"
  | "protect"
  | "walk";

export interface MoneyAmount {
  amount: number;
  currency: "USD";
}

export interface BuyerProfile {
  buyerType: BuyerType;
  acquisitionThesis: string;
  targetIndustries: string[];
  targetGeographies: string[];
  operatingIntent:
    | "owner_operator"
    | "install_operator"
    | "integrate"
    | "hold_existing_management";
  relevantExperience: string;
  availableEquity: MoneyAmount | null;
  financingPlan: string | null;
  returnObjective: string | null;
  holdPeriod: string | null;
  nonNegotiableConstraints: string[];
}

export interface TargetCompanyProfile {
  companyName: string;
  companyDescription: string;
  industry: string | null;
  geography: string | null;
  yearsInBusiness: number | null;
  annualRevenue: MoneyAmount | null;
  reportedEbitda: MoneyAmount | null;
  reportedSde: MoneyAmount | null;
  revenueGrowth: string | null;
  marginTrajectory: string | null;
  revenueModel: string | null;
  recurringRevenuePercent: number | null;
  largestCustomerPercent: number | null;
  customerTenure: string | null;
  ownerRole: string | null;
  ownerTransitionOffer: string | null;
  managementDepth: string | null;
  employeeCount: number | null;
  keyEmployeeRisk: string | null;
  systemsDocumentation: string | null;
  financialCleanliness: string | null;
  addBackSummary: string | null;
  workingCapitalProfile: string | null;
  capitalExpenditureProfile: string | null;
  facilityAndLeaseProfile: string | null;
  legalAndRegulatoryExposure: string | null;
  claimedDefensibility: string[];
  industryDynamics: string | null;
  aiExposure: string | null;
  sellerMotivation: string | null;
  knownDiligenceIssues: string[];
}

export interface ProposedDealTerms {
  askingPrice: MoneyAmount | null;
  transactionStructure:
    | "asset_purchase"
    | "stock_purchase"
    | "merger"
    | "unknown";
  buyerEquity: MoneyAmount | null;
  seniorDebt: MoneyAmount | null;
  sellerFinancing: MoneyAmount | null;
  earnout: MoneyAmount | null;
  rolloverEquityPercent: number | null;
  assumedDebt: MoneyAmount | null;
  workingCapitalIncluded: MoneyAmount | null;
  expectedFees: MoneyAmount | null;
  otherMaterialTerms: string[];
}

export interface AcquisitionIntake {
  contractVersion: typeof ACQUISITION_CONTRACT_VERSION;
  segment: AcquisitionSegment;
  stage: AcquisitionStage;
  buyer: BuyerProfile;
  target: TargetCompanyProfile;
  proposedTerms: ProposedDealTerms;
  sourceMaterialSummary: string | null;
  buyerQuestions: string[];
  additionalContext: string | null;
}

export interface CalculationAssumption {
  id: string;
  label: string;
  value: string;
  source: EvidenceSource;
}

export interface SensitivityCase {
  name: "downside" | "base" | "upside";
  revenueChangePercent: number | null;
  earningsChangePercent: number | null;
  normalizedEarnings: MoneyAmount | null;
  debtServiceCoverageRatio: number | null;
  buyerCashOnCashReturnPercent: number | null;
}

export interface DealMetrics {
  calculatedAt: string;
  assumptions: CalculationAssumption[];
  normalizedEarnings: MoneyAmount | null;
  enterpriseValue: MoneyAmount | null;
  impliedRevenueMultiple: number | null;
  impliedEbitdaMultiple: number | null;
  impliedSdeMultiple: number | null;
  buyerCashRequired: MoneyAmount | null;
  annualDebtService: MoneyAmount | null;
  debtServiceCoverageRatio: number | null;
  workingCapitalRequirement: MoneyAmount | null;
  nearTermCapitalExpenditure: MoneyAmount | null;
  sensitivityCases: SensitivityCase[];
}

export interface EvidenceItem {
  statement: string;
  source: EvidenceSource;
  confidence: ConfidenceLevel;
}

export interface RiskFinding {
  id: string;
  dimension:
    | "thesis_fit"
    | "revenue_quality"
    | "earnings_quality"
    | "customer_concentration"
    | "owner_dependence"
    | "management_depth"
    | "key_employee"
    | "financial_cleanliness"
    | "working_capital"
    | "capital_expenditure"
    | "legal_regulatory"
    | "defensibility"
    | "ai_exposure"
    | "financing"
    | "integration"
    | "seller_motivation"
    | "other";
  title: string;
  rating: RiskRating;
  disposition: FindingDisposition;
  evidence: EvidenceItem[];
  implication: string;
  requiredAction: string;
}

export interface DecisionSignal {
  posture: DecisionPosture;
  confidence: ConfidenceLevel;
  coreReason: string;
  conditionsToAdvance: string[];
  hardVetoes: string[];
  compoundingRisks: string[];
}

export interface AcquisitionReport {
  contractVersion: typeof ACQUISITION_CONTRACT_VERSION;
  reportId: string;
  generatedAt: string;
  segment: AcquisitionSegment;
  stage: AcquisitionStage;
  buyerName: string | null;
  targetName: string;
  executiveSnapshot: string;
  decision: DecisionSignal;
  acquisitionThesisAssessment: string;
  buyerFitAssessment: string;
  metrics: DealMetrics;
  findings: RiskFinding[];
  diligencePressureMap: string[];
  itemsToInvestigate: string[];
  itemsToPrice: string[];
  itemsToProtect: string[];
  walkAwayConditions: string[];
  uncertaintySurface: string[];
  rankedSellerQuestions: string[];
  nextDecision: string;
  authorityNote: string;
  limitations: string[];
}
