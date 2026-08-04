import type {
  AcquisitionIntake,
  ConfidenceLevel,
  EvidenceSource,
  MoneyAmount,
} from "./contracts";
import { ACQUISITION_CONTRACT_VERSION } from "./contracts";
import type { AcquisitionEvidenceRecord } from "./reasoning-contract";
import type {
  AcquisitionDealScreenFacts,
  AcquisitionOrchestrationPayload,
} from "./orchestration-contract";
import { ACQUISITION_ORCHESTRATION_VERSION } from "./orchestration-contract";
import type { AcquisitionUnderwritingInput } from "./underwriting";

export class AcquisitionOrchestrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionOrchestrationValidationError";
  }
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be an object.`,
    );
  }
  return value as Record<string, unknown>;
}

function exact(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
) {
  const extras = Object.keys(value).filter((key) => !keys.includes(key));
  const missing = keys.filter((key) => !(key in value));
  if (extras.length > 0) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} contains unsupported fields: ${extras.join(", ")}.`,
    );
  }
  if (missing.length > 0) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} is missing required fields: ${missing.join(", ")}.`,
    );
  }
}

function string(value: unknown, path: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be a non-empty string.`,
    );
  }
  return value;
}

function nullableString(value: unknown, path: string) {
  if (value === null) return;
  string(value, path);
}

function finiteNumber(
  value: unknown,
  path: string,
  options: { minimum?: number; maximum?: number; integer?: boolean } = {},
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be a finite number.`,
    );
  }
  if (options.integer && !Number.isInteger(value)) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be an integer.`,
    );
  }
  if (options.minimum !== undefined && value < options.minimum) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be at least ${options.minimum}.`,
    );
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be at most ${options.maximum}.`,
    );
  }
}

function nullableNumber(
  value: unknown,
  path: string,
  options: { minimum?: number; maximum?: number; integer?: boolean } = {},
) {
  if (value === null) return;
  finiteNumber(value, path, options);
}

function boolean(value: unknown, path: string) {
  if (typeof value !== "boolean") {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be a boolean.`,
    );
  }
}

function nullableBoolean(value: unknown, path: string) {
  if (value === null) return;
  boolean(value, path);
}

function oneOf<T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  path: string,
) {
  if (!allowed.includes(value as T)) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be one of: ${allowed.join(", ")}.`,
    );
  }
}

function array(value: unknown, path: string) {
  if (!Array.isArray(value)) {
    throw new AcquisitionOrchestrationValidationError(
      `${path} must be an array.`,
    );
  }
  return value;
}

function stringArray(value: unknown, path: string) {
  array(value, path).forEach((item, index) =>
    string(item, `${path}[${index}]`),
  );
}

function money(value: unknown, path: string, allowNegative = false) {
  const item = object(value, path);
  exact(item, ["amount", "currency"], path);
  finiteNumber(item.amount, `${path}.amount`,
    allowNegative ? {} : { minimum: 0 });
  if (item.currency !== "USD") {
    throw new AcquisitionOrchestrationValidationError(
      `${path}.currency must be USD.`,
    );
  }
}

function nullableMoney(
  value: unknown,
  path: string,
  allowNegative = false,
) {
  if (value === null) return;
  money(value, path, allowNegative);
}

const buyerTypes = [
  "individual_operator",
  "sba_buyer",
  "self_funded_searcher",
  "funded_searcher",
  "independent_sponsor",
  "family_office",
  "private_equity",
  "strategic_acquirer",
  "adjacent_operator",
  "other",
] as const;

function validateBuyer(value: unknown) {
  const item = object(value, "intake.buyer");
  exact(
    item,
    [
      "buyerType",
      "acquisitionThesis",
      "targetIndustries",
      "targetGeographies",
      "operatingIntent",
      "relevantExperience",
      "availableEquity",
      "financingPlan",
      "returnObjective",
      "holdPeriod",
      "nonNegotiableConstraints",
    ],
    "intake.buyer",
  );
  oneOf(item.buyerType, buyerTypes, "intake.buyer.buyerType");
  string(item.acquisitionThesis, "intake.buyer.acquisitionThesis");
  stringArray(item.targetIndustries, "intake.buyer.targetIndustries");
  stringArray(item.targetGeographies, "intake.buyer.targetGeographies");
  oneOf(
    item.operatingIntent,
    [
      "owner_operator",
      "install_operator",
      "integrate",
      "hold_existing_management",
    ],
    "intake.buyer.operatingIntent",
  );
  string(item.relevantExperience, "intake.buyer.relevantExperience");
  nullableMoney(item.availableEquity, "intake.buyer.availableEquity");
  nullableString(item.financingPlan, "intake.buyer.financingPlan");
  nullableString(item.returnObjective, "intake.buyer.returnObjective");
  nullableString(item.holdPeriod, "intake.buyer.holdPeriod");
  stringArray(
    item.nonNegotiableConstraints,
    "intake.buyer.nonNegotiableConstraints",
  );
}

function validateTarget(value: unknown) {
  const item = object(value, "intake.target");
  exact(
    item,
    [
      "companyName",
      "companyDescription",
      "industry",
      "geography",
      "yearsInBusiness",
      "annualRevenue",
      "reportedEbitda",
      "reportedSde",
      "revenueGrowth",
      "marginTrajectory",
      "revenueModel",
      "recurringRevenuePercent",
      "largestCustomerPercent",
      "customerTenure",
      "ownerRole",
      "ownerTransitionOffer",
      "managementDepth",
      "employeeCount",
      "keyEmployeeRisk",
      "systemsDocumentation",
      "financialCleanliness",
      "addBackSummary",
      "workingCapitalProfile",
      "capitalExpenditureProfile",
      "facilityAndLeaseProfile",
      "legalAndRegulatoryExposure",
      "claimedDefensibility",
      "industryDynamics",
      "aiExposure",
      "sellerMotivation",
      "knownDiligenceIssues",
    ],
    "intake.target",
  );
  string(item.companyName, "intake.target.companyName");
  string(item.companyDescription, "intake.target.companyDescription");
  for (const key of [
    "industry",
    "geography",
    "revenueGrowth",
    "marginTrajectory",
    "revenueModel",
    "customerTenure",
    "ownerRole",
    "ownerTransitionOffer",
    "managementDepth",
    "keyEmployeeRisk",
    "systemsDocumentation",
    "financialCleanliness",
    "addBackSummary",
    "workingCapitalProfile",
    "capitalExpenditureProfile",
    "facilityAndLeaseProfile",
    "legalAndRegulatoryExposure",
    "industryDynamics",
    "aiExposure",
    "sellerMotivation",
  ]) {
    nullableString(item[key], `intake.target.${key}`);
  }
  nullableNumber(item.yearsInBusiness, "intake.target.yearsInBusiness", {
    minimum: 0,
  });
  nullableMoney(item.annualRevenue, "intake.target.annualRevenue");
  nullableMoney(item.reportedEbitda, "intake.target.reportedEbitda", true);
  nullableMoney(item.reportedSde, "intake.target.reportedSde", true);
  nullableNumber(
    item.recurringRevenuePercent,
    "intake.target.recurringRevenuePercent",
    { minimum: 0, maximum: 100 },
  );
  nullableNumber(
    item.largestCustomerPercent,
    "intake.target.largestCustomerPercent",
    { minimum: 0, maximum: 100 },
  );
  nullableNumber(item.employeeCount, "intake.target.employeeCount", {
    minimum: 0,
    integer: true,
  });
  stringArray(item.claimedDefensibility, "intake.target.claimedDefensibility");
  stringArray(item.knownDiligenceIssues, "intake.target.knownDiligenceIssues");
}

function validateTerms(value: unknown) {
  const item = object(value, "intake.proposedTerms");
  exact(
    item,
    [
      "askingPrice",
      "transactionStructure",
      "buyerEquity",
      "seniorDebt",
      "sellerFinancing",
      "earnout",
      "rolloverEquityPercent",
      "assumedDebt",
      "workingCapitalIncluded",
      "expectedFees",
      "otherMaterialTerms",
    ],
    "intake.proposedTerms",
  );
  nullableMoney(item.askingPrice, "intake.proposedTerms.askingPrice");
  oneOf(
    item.transactionStructure,
    ["asset_purchase", "stock_purchase", "merger", "unknown"],
    "intake.proposedTerms.transactionStructure",
  );
  for (const key of [
    "buyerEquity",
    "seniorDebt",
    "sellerFinancing",
    "earnout",
    "assumedDebt",
    "workingCapitalIncluded",
    "expectedFees",
  ]) {
    nullableMoney(item[key], `intake.proposedTerms.${key}`);
  }
  nullableNumber(
    item.rolloverEquityPercent,
    "intake.proposedTerms.rolloverEquityPercent",
    { minimum: 0, maximum: 100 },
  );
  stringArray(item.otherMaterialTerms, "intake.proposedTerms.otherMaterialTerms");
}

function validateIntake(value: unknown) {
  const item = object(value, "intake");
  exact(
    item,
    [
      "contractVersion",
      "segment",
      "stage",
      "buyer",
      "target",
      "proposedTerms",
      "sourceMaterialSummary",
      "buyerQuestions",
      "additionalContext",
    ],
    "intake",
  );
  if (item.contractVersion !== ACQUISITION_CONTRACT_VERSION) {
    throw new AcquisitionOrchestrationValidationError(
      `intake.contractVersion must be ${ACQUISITION_CONTRACT_VERSION}.`,
    );
  }
  oneOf(
    item.segment,
    ["main_street", "lower_middle_market", "strategic"],
    "intake.segment",
  );
  oneOf(
    item.stage,
    ["screen", "teaser", "cim", "loi", "diligence"],
    "intake.stage",
  );
  validateBuyer(item.buyer);
  validateTarget(item.target);
  validateTerms(item.proposedTerms);
  nullableString(item.sourceMaterialSummary, "intake.sourceMaterialSummary");
  stringArray(item.buyerQuestions, "intake.buyerQuestions");
  nullableString(item.additionalContext, "intake.additionalContext");
}

function validateDealScreenFacts(value: unknown) {
  const item = object(value, "dealScreenFacts");
  exact(
    item,
    [
      "company",
      "financials",
      "ownership",
      "marketPosition",
      "valueCreation",
      "integrity",
      "evidence",
    ],
    "dealScreenFacts",
  );

  const company = object(item.company, "dealScreenFacts.company");
  exact(
    company,
    [
      "descriptionProvided",
      "industryProvided",
      "competitorsIdentified",
      "ownerOperated",
    ],
    "dealScreenFacts.company",
  );
  boolean(company.descriptionProvided, "dealScreenFacts.company.descriptionProvided");
  boolean(company.industryProvided, "dealScreenFacts.company.industryProvided");
  boolean(company.competitorsIdentified, "dealScreenFacts.company.competitorsIdentified");
  nullableBoolean(company.ownerOperated, "dealScreenFacts.company.ownerOperated");

  const financials = object(item.financials, "dealScreenFacts.financials");
  exact(
    financials,
    [
      "cash",
      "debt",
      "revenueTrend",
      "marginTrend",
      "balanceSheetAvailable",
      "cashFlowStatementAvailable",
    ],
    "dealScreenFacts.financials",
  );
  nullableMoney(financials.cash, "dealScreenFacts.financials.cash");
  nullableMoney(financials.debt, "dealScreenFacts.financials.debt");
  oneOf(financials.revenueTrend, ["growing", "stable", "declining", "unknown"], "dealScreenFacts.financials.revenueTrend");
  oneOf(financials.marginTrend, ["growing", "stable", "declining", "unknown"], "dealScreenFacts.financials.marginTrend");
  boolean(financials.balanceSheetAvailable, "dealScreenFacts.financials.balanceSheetAvailable");
  boolean(financials.cashFlowStatementAvailable, "dealScreenFacts.financials.cashFlowStatementAvailable");

  const ownership = object(item.ownership, "dealScreenFacts.ownership");
  exact(ownership, ["entityTypeKnown", "capTableAvailable", "sellersOwnMajority", "ownerOperatorsHaveMeaningfulStake"], "dealScreenFacts.ownership");
  boolean(ownership.entityTypeKnown, "dealScreenFacts.ownership.entityTypeKnown");
  boolean(ownership.capTableAvailable, "dealScreenFacts.ownership.capTableAvailable");
  nullableBoolean(ownership.sellersOwnMajority, "dealScreenFacts.ownership.sellersOwnMajority");
  nullableBoolean(ownership.ownerOperatorsHaveMeaningfulStake, "dealScreenFacts.ownership.ownerOperatorsHaveMeaningfulStake");

  const market = object(item.marketPosition, "dealScreenFacts.marketPosition");
  exact(market, ["categoryRank", "scarcity", "strategicallyImperative"], "dealScreenFacts.marketPosition");
  oneOf(market.categoryRank, [1, 2, "other", "unknown"], "dealScreenFacts.marketPosition.categoryRank");
  oneOf(market.scarcity, ["evidenced", "claimed", "none", "unknown"], "dealScreenFacts.marketPosition.scarcity");
  boolean(market.strategicallyImperative, "dealScreenFacts.marketPosition.strategicallyImperative");

  const valueCreation = object(item.valueCreation, "dealScreenFacts.valueCreation");
  exact(valueCreation, ["turnaroundPotential", "buyerSpecificSynergies"], "dealScreenFacts.valueCreation");
  oneOf(valueCreation.turnaroundPotential, ["evidenced", "claimed", "none", "unknown"], "dealScreenFacts.valueCreation.turnaroundPotential");
  oneOf(valueCreation.buyerSpecificSynergies, ["evidenced", "claimed", "none", "unknown"], "dealScreenFacts.valueCreation.buyerSpecificSynergies");

  const integrity = object(item.integrity, "dealScreenFacts.integrity");
  exact(integrity, ["sellerResponseQuality", "misrepresentationSeverity"], "dealScreenFacts.integrity");
  oneOf(integrity.sellerResponseQuality, ["forthright", "mixed", "evasive", "unknown"], "dealScreenFacts.integrity.sellerResponseQuality");
  oneOf(integrity.misrepresentationSeverity, ["none", "minor", "material", "severe", "unknown"], "dealScreenFacts.integrity.misrepresentationSeverity");

  const evidence = object(item.evidence, "dealScreenFacts.evidence");
  exact(evidence, ["cim", "financialStatements", "financialStatementQuality", "topTenCustomers", "employeeListing", "revenueAndCustomerMix", "generalLedger"], "dealScreenFacts.evidence");
  for (const key of ["cim", "financialStatements", "topTenCustomers", "employeeListing", "revenueAndCustomerMix", "generalLedger"]) {
    oneOf(evidence[key], ["provided", "partial", "unavailable", "unknown"], `dealScreenFacts.evidence.${key}`);
  }
  oneOf(evidence.financialStatementQuality, ["quality_of_earnings", "audited", "reviewed", "management_only", "tax_return_only", "none", "unknown"], "dealScreenFacts.evidence.financialStatementQuality");
}

function validateAdjustment(value: unknown, index: number) {
  const path = `underwritingInput.operating.adjustments[${index}]`;
  const item = object(value, path);
  exact(item, ["id", "label", "category", "amount", "treatment", "status", "affectsEbitda", "affectsSde", "affectsFreeCashFlow", "source", "rationale"], path);
  string(item.id, `${path}.id`);
  string(item.label, `${path}.label`);
  oneOf(item.category, ["one_time_event", "accounting_adjustment", "non_ordinary_course", "owner_compensation", "family_payroll", "personal_expense", "growth_investment", "deferred_maintenance", "other"], `${path}.category`);
  money(item.amount, `${path}.amount`);
  oneOf(item.treatment, ["add_back", "deduct", "no_adjustment"], `${path}.treatment`);
  oneOf(item.status, ["accepted", "rejected", "pending"], `${path}.status`);
  boolean(item.affectsEbitda, `${path}.affectsEbitda`);
  boolean(item.affectsSde, `${path}.affectsSde`);
  boolean(item.affectsFreeCashFlow, `${path}.affectsFreeCashFlow`);
  oneOf(item.source, ["buyer_provided", "seller_provided", "calculated", "externally_verified", "unknown"], `${path}.source`);
  string(item.rationale, `${path}.rationale`);
}

function validateUnderwriting(value: unknown) {
  const item = object(value, "underwritingInput");
  exact(item, ["targetName", "asOfDate", "buyerType", "operating", "valuation", "equityBridge", "financing", "returns", "scenarios"], "underwritingInput");
  string(item.targetName, "underwritingInput.targetName");
  string(item.asOfDate, "underwritingInput.asOfDate");
  oneOf(item.buyerType, buyerTypes, "underwritingInput.buyerType");

  const operating = object(item.operating, "underwritingInput.operating");
  exact(operating, ["annualRevenue", "reportedEbitda", "reportedSde", "reportedUnleveredFreeCashFlow", "ownerOperated", "adjustments"], "underwritingInput.operating");
  money(operating.annualRevenue, "underwritingInput.operating.annualRevenue");
  nullableMoney(operating.reportedEbitda, "underwritingInput.operating.reportedEbitda", true);
  nullableMoney(operating.reportedSde, "underwritingInput.operating.reportedSde", true);
  nullableMoney(operating.reportedUnleveredFreeCashFlow, "underwritingInput.operating.reportedUnleveredFreeCashFlow", true);
  boolean(operating.ownerOperated, "underwritingInput.operating.ownerOperated");
  array(operating.adjustments, "underwritingInput.operating.adjustments").forEach(validateAdjustment);

  const valuation = object(item.valuation, "underwritingInput.valuation");
  exact(valuation, ["basis", "lowMultiple", "highMultiple", "replacementCostLow", "replacementCostHigh", "offerEnterpriseValue", "hardCeilingEnterpriseValue", "excludedBuyerSpecificSynergies"], "underwritingInput.valuation");
  oneOf(valuation.basis, ["normalized_ebitda", "normalized_sde", "normalized_free_cash_flow", "replacement_cost"], "underwritingInput.valuation.basis");
  nullableNumber(valuation.lowMultiple, "underwritingInput.valuation.lowMultiple", { minimum: 0 });
  nullableNumber(valuation.highMultiple, "underwritingInput.valuation.highMultiple", { minimum: 0 });
  for (const key of ["replacementCostLow", "replacementCostHigh", "offerEnterpriseValue", "hardCeilingEnterpriseValue", "excludedBuyerSpecificSynergies"]) {
    nullableMoney(valuation[key], `underwritingInput.valuation.${key}`);
  }

  const bridge = object(item.equityBridge, "underwritingInput.equityBridge");
  exact(bridge, ["cashDelivered", "debtAssumedOrRefinanced", "debtLikeItems", "normalizedWorkingCapitalPeg", "workingCapitalDelivered", "deferredMaintenance"], "underwritingInput.equityBridge");
  for (const key of Object.keys(bridge)) money(bridge[key], `underwritingInput.equityBridge.${key}`);

  const financing = object(item.financing, "underwritingInput.financing");
  exact(financing, ["debtRefinancedAtClose", "transactionFees", "incrementalWorkingCapitalFunding", "nearTermCapitalExpenditure", "seniorDebt", "sellerFinancing", "earnout", "rolloverEquity", "annualSeniorDebtService", "annualSellerDebtService"], "underwritingInput.financing");
  for (const key of Object.keys(financing)) money(financing[key], `underwritingInput.financing.${key}`);

  const returns = object(item.returns, "underwritingInput.returns");
  exact(returns, ["annualCashFlowsToBuyer", "exitEquityValue"], "underwritingInput.returns");
  array(returns.annualCashFlowsToBuyer, "underwritingInput.returns.annualCashFlowsToBuyer").forEach((cashFlow, index) => money(cashFlow, `underwritingInput.returns.annualCashFlowsToBuyer[${index}]`, true));
  nullableMoney(returns.exitEquityValue, "underwritingInput.returns.exitEquityValue");

  const scenarios = array(item.scenarios, "underwritingInput.scenarios");
  scenarios.forEach((value, index) => {
    const path = `underwritingInput.scenarios[${index}]`;
    const scenario = object(value, path);
    exact(scenario, ["name", "revenueChangePercent", "ebitdaMarginChangeBasisPoints", "freeCashFlowConversionPercent", "minimumAnnualCashBuffer"], path);
    oneOf(scenario.name, ["worst_case", "most_likely", "best_case"], `${path}.name`);
    finiteNumber(scenario.revenueChangePercent, `${path}.revenueChangePercent`);
    finiteNumber(scenario.ebitdaMarginChangeBasisPoints, `${path}.ebitdaMarginChangeBasisPoints`);
    finiteNumber(scenario.freeCashFlowConversionPercent, `${path}.freeCashFlowConversionPercent`);
    money(scenario.minimumAnnualCashBuffer, `${path}.minimumAnnualCashBuffer`);
  });
}

function validateEvidence(value: unknown) {
  const ids = new Set<string>();
  const reservedIds = new Set([
    "buyer-intake",
    "deal-screen",
    "underwriting",
  ]);
  array(value, "evidence").forEach((recordValue, index) => {
    const path = `evidence[${index}]`;
    const record = object(recordValue, path);
    exact(record, ["id", "statement", "source", "confidence", "status", "asOfDate", "location"], path);
    const id = string(record.id, `${path}.id`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(id)) {
      throw new AcquisitionOrchestrationValidationError(
        `${path}.id must be 3-128 URL-safe characters.`,
      );
    }
    if (reservedIds.has(id)) {
      throw new AcquisitionOrchestrationValidationError(
        `${path}.id is reserved by Acquisition Lens.`,
      );
    }
    if (ids.has(id)) {
      throw new AcquisitionOrchestrationValidationError(
        `${path}.id is duplicated.`,
      );
    }
    ids.add(id);
    string(record.statement, `${path}.statement`);
    oneOf(record.source, ["buyer_provided", "seller_provided", "calculated", "externally_verified", "unknown"], `${path}.source`);
    oneOf(record.confidence, ["high", "moderate", "low", "unknown"], `${path}.confidence`);
    oneOf(record.status, ["verified", "provided", "claimed", "missing", "contradictory"], `${path}.status`);
    nullableString(record.asOfDate, `${path}.asOfDate`);
    nullableString(record.location, `${path}.location`);
  });
}

function sameMoney(left: MoneyAmount | null, right: MoneyAmount | null) {
  return left?.amount === right?.amount && left?.currency === right?.currency;
}

function validateCrossSourceConsistency(
  intake: AcquisitionIntake,
  facts: AcquisitionDealScreenFacts,
  underwriting: AcquisitionUnderwritingInput,
) {
  if (intake.target.companyName !== underwriting.targetName) {
    throw new AcquisitionOrchestrationValidationError(
      "Intake and underwriting target names must match exactly.",
    );
  }
  if (intake.buyer.buyerType !== underwriting.buyerType) {
    throw new AcquisitionOrchestrationValidationError(
      "Intake and underwriting buyer types must match exactly.",
    );
  }
  if (
    intake.target.annualRevenue !== null &&
    !sameMoney(
      intake.target.annualRevenue,
      underwriting.operating.annualRevenue,
    )
  ) {
    throw new AcquisitionOrchestrationValidationError(
      "Intake and underwriting annual revenue must match.",
    );
  }
  for (const [label, left, right] of [
    [
      "reported EBITDA",
      intake.target.reportedEbitda,
      underwriting.operating.reportedEbitda,
    ],
    [
      "reported SDE",
      intake.target.reportedSde,
      underwriting.operating.reportedSde,
    ],
  ] as const) {
    if (left !== null && !sameMoney(left, right)) {
      throw new AcquisitionOrchestrationValidationError(
        `Intake and underwriting ${label} must match.`,
      );
    }
  }
  if (
    facts.company.ownerOperated !== null &&
    facts.company.ownerOperated !== underwriting.operating.ownerOperated
  ) {
    throw new AcquisitionOrchestrationValidationError(
      "Deal Screen and underwriting owner-operated status must match.",
    );
  }
}

export function parseAcquisitionOrchestrationPayload(
  value: unknown,
): AcquisitionOrchestrationPayload {
  const payload = object(value, "payload");
  exact(
    payload,
    [
      "orchestrationVersion",
      "reportId",
      "intake",
      "dealScreenFacts",
      "underwritingInput",
      "evidence",
    ],
    "payload",
  );
  if (payload.orchestrationVersion !== ACQUISITION_ORCHESTRATION_VERSION) {
    throw new AcquisitionOrchestrationValidationError(
      `orchestrationVersion must be ${ACQUISITION_ORCHESTRATION_VERSION}.`,
    );
  }
  const reportId = string(payload.reportId, "reportId");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(reportId)) {
    throw new AcquisitionOrchestrationValidationError(
      "reportId must be 3-128 URL-safe characters.",
    );
  }
  validateIntake(payload.intake);
  validateDealScreenFacts(payload.dealScreenFacts);
  validateUnderwriting(payload.underwritingInput);
  validateEvidence(payload.evidence);

  const parsed = payload as unknown as AcquisitionOrchestrationPayload;
  validateCrossSourceConsistency(
    parsed.intake,
    parsed.dealScreenFacts,
    parsed.underwritingInput,
  );
  return parsed;
}

export function validateAcquisitionCommandIdentity(
  requestId: string,
  idempotencyKey: string,
) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(requestId)) {
    throw new AcquisitionOrchestrationValidationError(
      "requestId must be 8-128 URL-safe characters.",
    );
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(idempotencyKey)) {
    throw new AcquisitionOrchestrationValidationError(
      "Idempotency-Key must be 8-128 URL-safe characters.",
    );
  }
}
