import type {
  AcquisitionSegment,
  BuyerType,
  ConfidenceLevel,
  DecisionPosture,
  MoneyAmount,
} from "./contracts";

export type InformationAvailability =
  | "provided"
  | "partial"
  | "unavailable"
  | "unknown";

export type FinancialStatementQuality =
  | "quality_of_earnings"
  | "audited"
  | "reviewed"
  | "management_only"
  | "tax_return_only"
  | "none"
  | "unknown";

export type FinancialTrend = "growing" | "stable" | "declining" | "unknown";

export type EvidenceStrength = "evidenced" | "claimed" | "none" | "unknown";

export type SellerResponseQuality =
  | "forthright"
  | "mixed"
  | "evasive"
  | "unknown";

export type MisrepresentationSeverity =
  | "none"
  | "minor"
  | "material"
  | "severe"
  | "unknown";

export type ValuationBasis =
  | "normalized_free_cash_flow_and_ebitda"
  | "normalized_sde"
  | "replacement_cost"
  | "insufficient_information";

export type PrimaryReturnMetric =
  | "payback_period"
  | "irr"
  | "cash_flow_resilience";

export type RangeStrategy =
  | "within_supported_range"
  | "advance_with_broad_range"
  | "reprice"
  | "above_hard_ceiling"
  | "insufficient_information";

export interface DealScreenInput {
  targetName: string;
  segment: AcquisitionSegment;
  buyerType: BuyerType;
  company: {
    descriptionProvided: boolean;
    industryProvided: boolean;
    competitorsIdentified: boolean;
    ownerOperated: boolean | null;
  };
  financials: {
    annualRevenue: MoneyAmount | null;
    reportedEbitda: MoneyAmount | null;
    reportedSde: MoneyAmount | null;
    freeCashFlow: MoneyAmount | null;
    cash: MoneyAmount | null;
    debt: MoneyAmount | null;
    askingPrice: MoneyAmount | null;
    standaloneValueLow: MoneyAmount | null;
    standaloneValueHigh: MoneyAmount | null;
    hardCeiling: MoneyAmount | null;
    revenueTrend: FinancialTrend;
    marginTrend: FinancialTrend;
    balanceSheetAvailable: boolean;
    cashFlowStatementAvailable: boolean;
  };
  ownership: {
    entityTypeKnown: boolean;
    capTableAvailable: boolean;
    sellersOwnMajority: boolean | null;
    ownerOperatorsHaveMeaningfulStake: boolean | null;
  };
  marketPosition: {
    categoryRank: 1 | 2 | "other" | "unknown";
    scarcity: EvidenceStrength;
    strategicallyImperative: boolean;
  };
  valueCreation: {
    turnaroundPotential: EvidenceStrength;
    buyerSpecificSynergies: EvidenceStrength;
    worstCaseSurvivable: boolean | null;
  };
  integrity: {
    sellerResponseQuality: SellerResponseQuality;
    misrepresentationSeverity: MisrepresentationSeverity;
  };
  evidence: {
    cim: InformationAvailability;
    financialStatements: InformationAvailability;
    financialStatementQuality: FinancialStatementQuality;
    topTenCustomers: InformationAvailability;
    employeeListing: InformationAvailability;
    revenueAndCustomerMix: InformationAvailability;
    generalLedger: InformationAvailability;
  };
}

export interface DealScreenSignal {
  code: string;
  message: string;
}

export interface LoiReadiness {
  minimumPackageComplete: boolean;
  readyToIssue: boolean;
  missingItems: string[];
}

export interface DealScreenResult {
  targetName: string;
  posture: DecisionPosture;
  confidence: ConfidenceLevel;
  valuationBasis: ValuationBasis;
  primaryReturnMetric: PrimaryReturnMetric;
  rangeStrategy: RangeStrategy;
  loiReadiness: LoiReadiness;
  strengths: DealScreenSignal[];
  concerns: DealScreenSignal[];
  hardStops: DealScreenSignal[];
  missingInformation: DealScreenSignal[];
  conditionsToAdvance: DealScreenSignal[];
  buyerOwnedSynergyNote: string;
  rationale: string;
}

const isProvided = (value: InformationAvailability) => value === "provided";

const amountOf = (value: MoneyAmount | null) => value?.amount ?? null;

function getValuationBasis(input: DealScreenInput): ValuationBasis {
  if (
    input.company.ownerOperated &&
    input.financials.reportedSde !== null
  ) {
    return "normalized_sde";
  }

  const ebitda = amountOf(input.financials.reportedEbitda);
  const freeCashFlow = amountOf(input.financials.freeCashFlow);

  if (
    ebitda !== null &&
    freeCashFlow !== null &&
    ebitda <= 0 &&
    freeCashFlow <= 0
  ) {
    return "replacement_cost";
  }

  if (ebitda !== null || freeCashFlow !== null) {
    return "normalized_free_cash_flow_and_ebitda";
  }

  return "insufficient_information";
}

function getPrimaryReturnMetric(buyerType: BuyerType): PrimaryReturnMetric {
  if (buyerType === "strategic_acquirer" || buyerType === "adjacent_operator") {
    return "payback_period";
  }

  if (
    buyerType === "private_equity" ||
    buyerType === "independent_sponsor" ||
    buyerType === "family_office"
  ) {
    return "irr";
  }

  return "cash_flow_resilience";
}

function getLoiReadiness(input: DealScreenInput): LoiReadiness {
  const requiredItems: Array<[string, InformationAvailability]> = [
    ["CIM", input.evidence.cim],
    ["Financial statements", input.evidence.financialStatements],
    ["Top 10 customer list", input.evidence.topTenCustomers],
    [
      "Employee listing with titles, functions, and compensation",
      input.evidence.employeeListing,
    ],
    ["Revenue and customer mix", input.evidence.revenueAndCustomerMix],
  ];
  const missingItems = requiredItems
    .filter(([, availability]) => !isProvided(availability))
    .map(([label]) => label);

  return {
    minimumPackageComplete: missingItems.length === 0,
    readyToIssue: false,
    missingItems,
  };
}

function getInitialMissingInformation(
  input: DealScreenInput,
): DealScreenSignal[] {
  const missing: DealScreenSignal[] = [];

  const add = (code: string, message: string, condition: boolean) => {
    if (condition) {
      missing.push({ code, message });
    }
  };

  add(
    "company_description_missing",
    "Company description is required.",
    !input.company.descriptionProvided,
  );
  add(
    "industry_missing",
    "Industry classification is required.",
    !input.company.industryProvided,
  );
  add(
    "competitors_missing",
    "Named competitors or credible alternatives are required.",
    !input.company.competitorsIdentified,
  );
  add(
    "revenue_missing",
    "Annual revenue is required.",
    input.financials.annualRevenue === null,
  );
  add(
    "earnings_missing",
    "EBITDA, free cash flow, or SDE for an owner-operated company is required.",
    input.financials.reportedEbitda === null &&
      input.financials.freeCashFlow === null &&
      (!input.company.ownerOperated ||
        input.financials.reportedSde === null),
  );
  add(
    "balance_sheet_missing",
    "A balance sheet is required to assess cash, debt, and other obligations.",
    !input.financials.balanceSheetAvailable,
  );
  add(
    "cash_flow_statement_missing",
    "A cash flow statement is required to assess cash conversion.",
    !input.financials.cashFlowStatementAvailable,
  );
  add(
    "cash_position_missing",
    "Cash position is required.",
    input.financials.cash === null,
  );
  add(
    "debt_position_missing",
    "Debt position is required.",
    input.financials.debt === null,
  );
  add(
    "asking_price_missing",
    "Asking price is required before price discipline can be assessed.",
    input.financials.askingPrice === null,
  );
  add(
    "entity_type_missing",
    "Entity type and proposed transaction form must be identified.",
    !input.ownership.entityTypeKnown,
  );
  add(
    "cap_table_missing",
    "The capitalization table or ownership schedule is required.",
    !input.ownership.capTableAvailable,
  );
  add(
    "seller_control_unknown",
    "Seller majority control must be confirmed.",
    input.ownership.sellersOwnMajority === null,
  );

  return missing;
}

function isTopCategoryOrScarce(input: DealScreenInput) {
  return (
    input.marketPosition.categoryRank === 1 ||
    input.marketPosition.categoryRank === 2 ||
    input.marketPosition.scarcity === "evidenced" ||
    input.marketPosition.strategicallyImperative
  );
}

function getRangeStrategy(
  input: DealScreenInput,
  isScarce: boolean,
): RangeStrategy {
  const askingPrice = amountOf(input.financials.askingPrice);
  const supportedHigh = amountOf(input.financials.standaloneValueHigh);
  const hardCeiling = amountOf(input.financials.hardCeiling);

  if (askingPrice === null) {
    return "insufficient_information";
  }

  if (hardCeiling !== null && askingPrice > hardCeiling) {
    return "above_hard_ceiling";
  }

  if (supportedHigh === null) {
    return "insufficient_information";
  }

  if (askingPrice <= supportedHigh) {
    return "within_supported_range";
  }

  if (isScarce) {
    return "advance_with_broad_range";
  }

  return "reprice";
}

function getConfidence(
  input: DealScreenInput,
  missingInformation: DealScreenSignal[],
): ConfidenceLevel {
  if (
    input.evidence.financialStatementQuality === "quality_of_earnings" &&
    isProvided(input.evidence.generalLedger) &&
    missingInformation.length === 0
  ) {
    return "high";
  }

  if (
    (input.evidence.financialStatementQuality === "quality_of_earnings" ||
      input.evidence.financialStatementQuality === "audited" ||
      input.evidence.financialStatementQuality === "reviewed") &&
    missingInformation.length <= 2
  ) {
    return "moderate";
  }

  if (
    input.evidence.financialStatementQuality === "none" ||
    input.evidence.financialStatementQuality === "unknown"
  ) {
    return "unknown";
  }

  return "low";
}

export function screenAcquisitionDeal(
  input: DealScreenInput,
): DealScreenResult {
  const strengths: DealScreenSignal[] = [];
  const concerns: DealScreenSignal[] = [];
  const hardStops: DealScreenSignal[] = [];
  const conditionsToAdvance: DealScreenSignal[] = [];
  const missingInformation = getInitialMissingInformation(input);
  const loiReadiness = getLoiReadiness(input);
  const isScarce = isTopCategoryOrScarce(input);
  const rangeStrategy = getRangeStrategy(input, isScarce);
  const valuationBasis = getValuationBasis(input);
  const primaryReturnMetric = getPrimaryReturnMetric(input.buyerType);

  if (
    input.marketPosition.categoryRank === 1 ||
    input.marketPosition.categoryRank === 2
  ) {
    strengths.push({
      code: "top_two_category_position",
      message: "The target is represented as number one or two in its category.",
    });
  }

  if (input.marketPosition.scarcity === "evidenced") {
    strengths.push({
      code: "established_scarcity",
      message: "Scarcity is supported by evidence rather than assertion alone.",
    });
  } else if (input.marketPosition.scarcity === "claimed") {
    concerns.push({
      code: "scarcity_unverified",
      message: "Scarcity is claimed but has not yet been substantiated.",
    });
  }

  if (input.ownership.ownerOperatorsHaveMeaningfulStake === true) {
    strengths.push({
      code: "owner_operator_alignment",
      message:
        "Owner-operators retain meaningful economic alignment for transition.",
    });
  } else if (input.ownership.ownerOperatorsHaveMeaningfulStake === false) {
    concerns.push({
      code: "weak_owner_operator_alignment",
      message:
        "Owner-operators do not appear to have meaningful economic alignment.",
    });
  }

  if (input.valueCreation.worstCaseSurvivable === false) {
    hardStops.push({
      code: "worst_case_not_survivable",
      message:
        "The deal does not survive the modeled revenue decline and margin compression.",
    });
  } else if (input.valueCreation.worstCaseSurvivable === null) {
    conditionsToAdvance.push({
      code: "downside_case_required",
      message:
        "Model best, most-likely, and worst cases, including financing cost and required capital.",
    });
  } else {
    strengths.push({
      code: "worst_case_survivable",
      message:
        "The modeled downside remains survivable under the stated assumptions.",
    });
  }

  if (input.ownership.sellersOwnMajority === false) {
    if (isScarce) {
      concerns.push({
        code: "seller_control_exception",
        message:
          "The sellers do not control the required majority, but scarcity preserves a narrow path to investigate.",
      });
      conditionsToAdvance.push({
        code: "credible_consent_path_required",
        message:
          "Confirm a credible path to the required investor or shareholder consent before committing material resources.",
      });
    } else {
      hardStops.push({
        code: "seller_lacks_control",
        message:
          "The sellers do not control the required majority and the asset does not justify an exception.",
      });
    }
  }

  if (rangeStrategy === "above_hard_ceiling") {
    hardStops.push({
      code: "asking_price_above_hard_ceiling",
      message:
        "The asking price exceeds the buyer's hard ceiling; preserve discipline and pass.",
    });
  }

  const hasEvidencedValueCreation =
    input.valueCreation.turnaroundPotential === "evidenced" ||
    input.valueCreation.buyerSpecificSynergies === "evidenced";
  const requiresIntegrityInvestigation =
    input.integrity.misrepresentationSeverity === "material" ||
    input.integrity.misrepresentationSeverity === "severe" ||
    input.integrity.sellerResponseQuality === "evasive";

  if (
    rangeStrategy === "reprice" &&
    !isScarce &&
    !hasEvidencedValueCreation
  ) {
    hardStops.push({
      code: "average_asset_unsupported_price",
      message:
        "The asking price exceeds standalone value without scarcity or evidenced value creation.",
    });
  } else if (rangeStrategy === "advance_with_broad_range") {
    conditionsToAdvance.push({
      code: "broad_range_with_ceiling",
      message:
        "Use a broad, non-binding range to stay in the process without disclosing buyer-specific synergy or exceeding the hard ceiling.",
    });
  } else if (rangeStrategy === "reprice") {
    conditionsToAdvance.push({
      code: "reprice_to_supported_economics",
      message:
        "Reprice to normalized standalone economics before advancing.",
    });
  }

  if (
    input.integrity.misrepresentationSeverity === "material" ||
    input.integrity.misrepresentationSeverity === "severe"
  ) {
    concerns.push({
      code: "potential_misrepresentation",
      message:
        "Potential misrepresentation requires a severity- and context-specific investigation; it is not assumed to be an automatic walk.",
    });
    conditionsToAdvance.push({
      code: "reconcile_financials_to_gl",
      message:
        "Reconstruct the financial statements from the general ledger and tie material items to cash, tax filings, invoices, and contracts.",
    });
  }

  if (input.integrity.sellerResponseQuality === "evasive") {
    concerns.push({
      code: "evasive_seller_responses",
      message:
        "Evasive or inconsistent seller responses reduce trust and increase diligence risk.",
    });
  } else if (input.integrity.sellerResponseQuality === "forthright") {
    strengths.push({
      code: "forthright_seller_responses",
      message:
        "Forthright and diligent seller responses support the current trust assessment.",
    });
  }

  if (!isProvided(input.evidence.generalLedger)) {
    conditionsToAdvance.push({
      code: "general_ledger_required_for_diligence",
      message:
        "Obtain the general ledger before completing financial diligence; the minimum LOI package does not replace financial reconstruction.",
    });
  }

  for (const item of loiReadiness.missingItems) {
    missingInformation.push({
      code: `loi_${item.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      message: `${item} is required for the minimum LOI information package.`,
    });
  }

  let posture: DecisionPosture;
  if (hardStops.length > 0) {
    posture = "pass";
  } else if (
    rangeStrategy === "reprice" &&
    hasEvidencedValueCreation
  ) {
    posture = "reprice";
  } else if (
    loiReadiness.minimumPackageComplete &&
    missingInformation.length === 0 &&
    input.valueCreation.worstCaseSurvivable === true &&
    rangeStrategy === "within_supported_range" &&
    !requiresIntegrityInvestigation
  ) {
    posture = "proceed";
  } else {
    posture = "investigate";
  }

  loiReadiness.readyToIssue =
    loiReadiness.minimumPackageComplete &&
    missingInformation.length === 0 &&
    posture !== "pass";

  const rationale =
    posture === "pass"
      ? "A hard stop overrides the remaining positive attributes."
      : posture === "proceed"
        ? "The minimum LOI package is complete, the price is within the supported standalone range, and the downside case is survivable."
        : posture === "reprice"
          ? "There is a credible reason to remain engaged, but the current price is not supported by standalone economics."
          : "The opportunity may justify continued access, but material facts, evidence, pricing, control, or downside work remains unresolved.";

  return {
    targetName: input.targetName,
    posture,
    confidence: getConfidence(input, missingInformation),
    valuationBasis,
    primaryReturnMetric,
    rangeStrategy,
    loiReadiness,
    strengths,
    concerns,
    hardStops,
    missingInformation,
    conditionsToAdvance,
    buyerOwnedSynergyNote:
      "Buyer-specific synergies are not included in standalone value and should not be shared with the seller.",
    rationale,
  };
}
