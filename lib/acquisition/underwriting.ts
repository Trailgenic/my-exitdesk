import type { BuyerType, EvidenceSource, MoneyAmount } from "./contracts";

export type NormalizationCategory =
  | "one_time_event"
  | "accounting_adjustment"
  | "non_ordinary_course"
  | "owner_compensation"
  | "family_payroll"
  | "personal_expense"
  | "growth_investment"
  | "deferred_maintenance"
  | "other";

export type AdjustmentTreatment = "add_back" | "deduct" | "no_adjustment";

export type AdjustmentStatus = "accepted" | "rejected" | "pending";

export type UnderwritingValuationBasis =
  | "normalized_ebitda"
  | "normalized_sde"
  | "normalized_free_cash_flow"
  | "replacement_cost";

export type UnderwritingScenarioName =
  | "worst_case"
  | "most_likely"
  | "best_case";

export type UnderwritingPrimaryReturnMetric =
  | "payback_period"
  | "irr"
  | "cash_flow_resilience";

export interface NormalizationAdjustment {
  id: string;
  label: string;
  category: NormalizationCategory;
  amount: MoneyAmount;
  treatment: AdjustmentTreatment;
  status: AdjustmentStatus;
  affectsEbitda: boolean;
  affectsSde: boolean;
  affectsFreeCashFlow: boolean;
  source: EvidenceSource;
  rationale: string;
}

export interface UnderwritingScenarioInput {
  name: UnderwritingScenarioName;
  revenueChangePercent: number;
  ebitdaMarginChangeBasisPoints: number;
  freeCashFlowConversionPercent: number;
  minimumAnnualCashBuffer: MoneyAmount;
}

export interface AcquisitionUnderwritingInput {
  targetName: string;
  asOfDate: string;
  buyerType: BuyerType;
  operating: {
    annualRevenue: MoneyAmount;
    reportedEbitda: MoneyAmount | null;
    reportedSde: MoneyAmount | null;
    reportedUnleveredFreeCashFlow: MoneyAmount | null;
    ownerOperated: boolean;
    adjustments: NormalizationAdjustment[];
  };
  valuation: {
    basis: UnderwritingValuationBasis;
    lowMultiple: number | null;
    highMultiple: number | null;
    replacementCostLow: MoneyAmount | null;
    replacementCostHigh: MoneyAmount | null;
    offerEnterpriseValue: MoneyAmount | null;
    hardCeilingEnterpriseValue: MoneyAmount | null;
    excludedBuyerSpecificSynergies: MoneyAmount | null;
  };
  equityBridge: {
    cashDelivered: MoneyAmount;
    debtAssumedOrRefinanced: MoneyAmount;
    debtLikeItems: MoneyAmount;
    normalizedWorkingCapitalPeg: MoneyAmount;
    workingCapitalDelivered: MoneyAmount;
    deferredMaintenance: MoneyAmount;
  };
  financing: {
    debtRefinancedAtClose: MoneyAmount;
    transactionFees: MoneyAmount;
    incrementalWorkingCapitalFunding: MoneyAmount;
    nearTermCapitalExpenditure: MoneyAmount;
    seniorDebt: MoneyAmount;
    sellerFinancing: MoneyAmount;
    earnout: MoneyAmount;
    rolloverEquity: MoneyAmount;
    annualSeniorDebtService: MoneyAmount;
    annualSellerDebtService: MoneyAmount;
  };
  returns: {
    annualCashFlowsToBuyer: MoneyAmount[];
    exitEquityValue: MoneyAmount | null;
  };
  scenarios: UnderwritingScenarioInput[];
}

export interface AppliedNormalizationAdjustment
  extends NormalizationAdjustment {
  signedAmount: MoneyAmount;
}

export interface NormalizedEarningsResult {
  reportedEbitda: MoneyAmount | null;
  reportedSde: MoneyAmount | null;
  reportedUnleveredFreeCashFlow: MoneyAmount | null;
  normalizedEbitda: MoneyAmount | null;
  normalizedSde: MoneyAmount | null;
  normalizedUnleveredFreeCashFlow: MoneyAmount | null;
  acceptedAdjustments: AppliedNormalizationAdjustment[];
  pendingAdjustments: NormalizationAdjustment[];
  rejectedAdjustments: NormalizationAdjustment[];
}

export interface ValueRange {
  low: MoneyAmount | null;
  high: MoneyAmount | null;
}

export interface EquityValueBridge {
  enterpriseValue: MoneyAmount;
  cashDelivered: MoneyAmount;
  debtAssumedOrRefinanced: MoneyAmount;
  debtLikeItems: MoneyAmount;
  workingCapitalShortfall: MoneyAmount;
  deferredMaintenance: MoneyAmount;
  equityValue: MoneyAmount;
}

export interface CapitalStackResult {
  equityPurchasePrice: MoneyAmount | null;
  cashConsiderationAtClose: MoneyAmount | null;
  debtRefinancedAtClose: MoneyAmount;
  transactionFees: MoneyAmount;
  incrementalWorkingCapitalFunding: MoneyAmount;
  nearTermCapitalExpenditure: MoneyAmount;
  totalUsesAtClose: MoneyAmount | null;
  seniorDebt: MoneyAmount;
  sellerFinancing: MoneyAmount;
  buyerCashRequired: MoneyAmount | null;
  financingSurplus: MoneyAmount | null;
  deferredEarnout: MoneyAmount;
  rolloverEquity: MoneyAmount;
  totalAnnualDebtService: MoneyAmount;
}

export interface ReturnResult {
  annualCashFlowToBuyer: MoneyAmount | null;
  cashOnCashReturnPercent: number | null;
  paybackPeriodYears: number | null;
  irrPercent: number | null;
}

export interface UnderwritingScenarioResult {
  name: UnderwritingScenarioName;
  revenueChangePercent: number;
  ebitdaMarginChangeBasisPoints: number;
  projectedRevenue: MoneyAmount;
  projectedEbitdaMarginPercent: number | null;
  projectedEbitda: MoneyAmount | null;
  projectedUnleveredFreeCashFlow: MoneyAmount | null;
  totalAnnualDebtService: MoneyAmount;
  debtServiceCoverageRatio: number | null;
  annualCashFlowToBuyer: MoneyAmount | null;
  buyerCashOnCashReturnPercent: number | null;
  paybackPeriodYears: number | null;
  minimumAnnualCashBuffer: MoneyAmount;
  survivable: boolean | null;
}

export interface UnderwritingSignal {
  code: string;
  message: string;
}

export interface AcquisitionUnderwritingResult {
  targetName: string;
  asOfDate: string;
  normalizedEarnings: NormalizedEarningsResult;
  valuationBasis: UnderwritingValuationBasis;
  primaryReturnMetric: UnderwritingPrimaryReturnMetric;
  standaloneEnterpriseValueRange: ValueRange;
  standaloneEquityValueRange: ValueRange;
  offerEquityBridge: EquityValueBridge | null;
  capitalStack: CapitalStackResult;
  returns: ReturnResult;
  scenarios: UnderwritingScenarioResult[];
  worstCaseSurvivable: boolean | null;
  dealScreenBridge: {
    offerEnterpriseValue: MoneyAmount | null;
    standaloneValueLow: MoneyAmount | null;
    standaloneValueHigh: MoneyAmount | null;
    hardCeiling: MoneyAmount | null;
    worstCaseSurvivable: boolean | null;
  };
  calculationChecks: UnderwritingSignal[];
  decisionTriggers: UnderwritingSignal[];
  excludedBuyerSpecificSynergies: MoneyAmount | null;
  buyerSpecificSynergyTreatment: string;
}

const USD = "USD" as const;

const money = (amount: number): MoneyAmount => ({ amount, currency: USD });

const amountOf = (value: MoneyAmount | null) => value?.amount ?? null;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const roundRatio = (value: number) => Math.round(value * 10_000) / 10_000;

function assertFinite(label: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertMoney(label: string, value: MoneyAmount, allowNegative = false) {
  assertFinite(label, value.amount);
  if (!allowNegative && value.amount < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
}

function validateInput(input: AcquisitionUnderwritingInput) {
  assertMoney("Annual revenue", input.operating.annualRevenue);

  if (
    input.valuation.basis === "normalized_sde" &&
    !input.operating.ownerOperated
  ) {
    throw new Error(
      "Normalized SDE may be used only for an owner-operated business.",
    );
  }

  if (input.operating.reportedEbitda) {
    assertMoney("Reported EBITDA", input.operating.reportedEbitda, true);
  }
  if (input.operating.reportedSde) {
    assertMoney("Reported SDE", input.operating.reportedSde, true);
  }
  if (input.operating.reportedUnleveredFreeCashFlow) {
    assertMoney(
      "Reported unlevered free cash flow",
      input.operating.reportedUnleveredFreeCashFlow,
      true,
    );
  }

  for (const adjustment of input.operating.adjustments) {
    assertMoney(`Adjustment ${adjustment.id}`, adjustment.amount);
    if (
      adjustment.category === "deferred_maintenance" &&
      adjustment.treatment !== "no_adjustment"
    ) {
      throw new Error(
        "Deferred maintenance belongs in the equity-value bridge, not earnings normalization.",
      );
    }
  }

  const nonNegativeMoney: Array<[string, MoneyAmount | null]> = [
    ["Replacement cost low", input.valuation.replacementCostLow],
    ["Replacement cost high", input.valuation.replacementCostHigh],
    ["Offer enterprise value", input.valuation.offerEnterpriseValue],
    ["Hard ceiling", input.valuation.hardCeilingEnterpriseValue],
    ["Excluded buyer-specific synergies", input.valuation.excludedBuyerSpecificSynergies],
    ["Cash delivered", input.equityBridge.cashDelivered],
    ["Debt assumed or refinanced", input.equityBridge.debtAssumedOrRefinanced],
    ["Debt-like items", input.equityBridge.debtLikeItems],
    ["Working-capital peg", input.equityBridge.normalizedWorkingCapitalPeg],
    ["Working capital delivered", input.equityBridge.workingCapitalDelivered],
    ["Deferred maintenance", input.equityBridge.deferredMaintenance],
    ["Debt refinanced at close", input.financing.debtRefinancedAtClose],
    ["Transaction fees", input.financing.transactionFees],
    ["Incremental working-capital funding", input.financing.incrementalWorkingCapitalFunding],
    ["Near-term capital expenditure", input.financing.nearTermCapitalExpenditure],
    ["Senior debt", input.financing.seniorDebt],
    ["Seller financing", input.financing.sellerFinancing],
    ["Earnout", input.financing.earnout],
    ["Rollover equity", input.financing.rolloverEquity],
    ["Annual senior debt service", input.financing.annualSeniorDebtService],
    ["Annual seller debt service", input.financing.annualSellerDebtService],
    ["Exit equity value", input.returns.exitEquityValue],
  ];

  for (const [label, value] of nonNegativeMoney) {
    if (value) assertMoney(label, value);
  }

  for (const [index, value] of input.returns.annualCashFlowsToBuyer.entries()) {
    assertMoney(`Annual buyer cash flow ${index + 1}`, value, true);
  }

  if (input.valuation.lowMultiple !== null) {
    assertFinite("Low multiple", input.valuation.lowMultiple);
    if (input.valuation.lowMultiple < 0) {
      throw new Error("Low multiple cannot be negative.");
    }
  }
  if (input.valuation.highMultiple !== null) {
    assertFinite("High multiple", input.valuation.highMultiple);
    if (input.valuation.highMultiple < 0) {
      throw new Error("High multiple cannot be negative.");
    }
  }
  if (
    input.valuation.lowMultiple !== null &&
    input.valuation.highMultiple !== null &&
    input.valuation.lowMultiple > input.valuation.highMultiple
  ) {
    throw new Error("Low multiple cannot exceed high multiple.");
  }

  if (
    input.valuation.replacementCostLow &&
    input.valuation.replacementCostHigh &&
    input.valuation.replacementCostLow.amount >
      input.valuation.replacementCostHigh.amount
  ) {
    throw new Error("Replacement-cost low cannot exceed replacement-cost high.");
  }

  const scenarioNames = new Set<UnderwritingScenarioName>();
  for (const scenario of input.scenarios) {
    if (scenarioNames.has(scenario.name)) {
      throw new Error(`Scenario ${scenario.name} is duplicated.`);
    }
    scenarioNames.add(scenario.name);
    assertFinite("Revenue change", scenario.revenueChangePercent);
    assertFinite("Margin change", scenario.ebitdaMarginChangeBasisPoints);
    assertFinite(
      "Free-cash-flow conversion",
      scenario.freeCashFlowConversionPercent,
    );
    if (scenario.revenueChangePercent <= -100) {
      throw new Error("Revenue change must be greater than -100%.");
    }
    assertMoney("Minimum annual cash buffer", scenario.minimumAnnualCashBuffer);
  }
}

function signedAdjustmentAmount(adjustment: NormalizationAdjustment) {
  if (adjustment.treatment === "add_back") return adjustment.amount.amount;
  if (adjustment.treatment === "deduct") return -adjustment.amount.amount;
  return 0;
}

function normalizeEarnings(
  input: AcquisitionUnderwritingInput,
): NormalizedEarningsResult {
  const acceptedAdjustments = input.operating.adjustments
    .filter(({ status }) => status === "accepted")
    .map((adjustment) => ({
      ...adjustment,
      signedAmount: money(signedAdjustmentAmount(adjustment)),
    }));

  const adjustmentFor = (
    predicate: (adjustment: NormalizationAdjustment) => boolean,
  ) =>
    acceptedAdjustments
      .filter(predicate)
      .reduce((sum, adjustment) => sum + adjustment.signedAmount.amount, 0);

  const normalized = (
    reported: MoneyAmount | null,
    predicate: (adjustment: NormalizationAdjustment) => boolean,
  ) =>
    reported === null
      ? null
      : money(roundMoney(reported.amount + adjustmentFor(predicate)));

  return {
    reportedEbitda: input.operating.reportedEbitda,
    reportedSde: input.operating.reportedSde,
    reportedUnleveredFreeCashFlow:
      input.operating.reportedUnleveredFreeCashFlow,
    normalizedEbitda: normalized(
      input.operating.reportedEbitda,
      ({ affectsEbitda }) => affectsEbitda,
    ),
    normalizedSde: normalized(
      input.operating.reportedSde,
      ({ affectsSde }) => affectsSde,
    ),
    normalizedUnleveredFreeCashFlow: normalized(
      input.operating.reportedUnleveredFreeCashFlow,
      ({ affectsFreeCashFlow }) => affectsFreeCashFlow,
    ),
    acceptedAdjustments,
    pendingAdjustments: input.operating.adjustments.filter(
      ({ status }) => status === "pending",
    ),
    rejectedAdjustments: input.operating.adjustments.filter(
      ({ status }) => status === "rejected",
    ),
  };
}

function calculateEnterpriseValueRange(
  input: AcquisitionUnderwritingInput,
  earnings: NormalizedEarningsResult,
): ValueRange {
  if (input.valuation.basis === "replacement_cost") {
    return {
      low: input.valuation.replacementCostLow,
      high: input.valuation.replacementCostHigh,
    };
  }

  const basisAmount =
    input.valuation.basis === "normalized_ebitda"
      ? amountOf(earnings.normalizedEbitda)
      : input.valuation.basis === "normalized_sde"
        ? amountOf(earnings.normalizedSde)
        : amountOf(earnings.normalizedUnleveredFreeCashFlow);

  if (
    basisAmount === null ||
    input.valuation.lowMultiple === null ||
    input.valuation.highMultiple === null
  ) {
    return { low: null, high: null };
  }

  return {
    low: money(roundMoney(basisAmount * input.valuation.lowMultiple)),
    high: money(roundMoney(basisAmount * input.valuation.highMultiple)),
  };
}

function getPrimaryReturnMetric(
  buyerType: BuyerType,
): UnderwritingPrimaryReturnMetric {
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

function bridgeEnterpriseValue(
  enterpriseValue: MoneyAmount,
  input: AcquisitionUnderwritingInput,
): EquityValueBridge {
  const workingCapitalShortfall = Math.max(
    0,
    input.equityBridge.normalizedWorkingCapitalPeg.amount -
      input.equityBridge.workingCapitalDelivered.amount,
  );
  const equityValue =
    enterpriseValue.amount +
    input.equityBridge.cashDelivered.amount -
    input.equityBridge.debtAssumedOrRefinanced.amount -
    input.equityBridge.debtLikeItems.amount -
    workingCapitalShortfall -
    input.equityBridge.deferredMaintenance.amount;

  return {
    enterpriseValue,
    cashDelivered: input.equityBridge.cashDelivered,
    debtAssumedOrRefinanced: input.equityBridge.debtAssumedOrRefinanced,
    debtLikeItems: input.equityBridge.debtLikeItems,
    workingCapitalShortfall: money(roundMoney(workingCapitalShortfall)),
    deferredMaintenance: input.equityBridge.deferredMaintenance,
    equityValue: money(roundMoney(equityValue)),
  };
}

function calculateCapitalStack(
  input: AcquisitionUnderwritingInput,
  offerBridge: EquityValueBridge | null,
): CapitalStackResult {
  const totalAnnualDebtService =
    input.financing.annualSeniorDebtService.amount +
    input.financing.annualSellerDebtService.amount;

  if (!offerBridge) {
    return {
      equityPurchasePrice: null,
      cashConsiderationAtClose: null,
      debtRefinancedAtClose: input.financing.debtRefinancedAtClose,
      transactionFees: input.financing.transactionFees,
      incrementalWorkingCapitalFunding:
        input.financing.incrementalWorkingCapitalFunding,
      nearTermCapitalExpenditure: input.financing.nearTermCapitalExpenditure,
      totalUsesAtClose: null,
      seniorDebt: input.financing.seniorDebt,
      sellerFinancing: input.financing.sellerFinancing,
      buyerCashRequired: null,
      financingSurplus: null,
      deferredEarnout: input.financing.earnout,
      rolloverEquity: input.financing.rolloverEquity,
      totalAnnualDebtService: money(roundMoney(totalAnnualDebtService)),
    };
  }

  const cashConsiderationAtClose =
    offerBridge.equityValue.amount -
    input.financing.earnout.amount -
    input.financing.rolloverEquity.amount;
  const totalUsesAtClose =
    cashConsiderationAtClose +
    input.financing.debtRefinancedAtClose.amount +
    input.financing.transactionFees.amount +
    input.financing.incrementalWorkingCapitalFunding.amount +
    input.financing.nearTermCapitalExpenditure.amount;
  const fundingGap =
    totalUsesAtClose -
    input.financing.seniorDebt.amount -
    input.financing.sellerFinancing.amount;

  return {
    equityPurchasePrice: offerBridge.equityValue,
    cashConsiderationAtClose: money(roundMoney(cashConsiderationAtClose)),
    debtRefinancedAtClose: input.financing.debtRefinancedAtClose,
    transactionFees: input.financing.transactionFees,
    incrementalWorkingCapitalFunding:
      input.financing.incrementalWorkingCapitalFunding,
    nearTermCapitalExpenditure: input.financing.nearTermCapitalExpenditure,
    totalUsesAtClose: money(roundMoney(totalUsesAtClose)),
    seniorDebt: input.financing.seniorDebt,
    sellerFinancing: input.financing.sellerFinancing,
    buyerCashRequired: money(roundMoney(Math.max(0, fundingGap))),
    financingSurplus: money(roundMoney(Math.max(0, -fundingGap))),
    deferredEarnout: input.financing.earnout,
    rolloverEquity: input.financing.rolloverEquity,
    totalAnnualDebtService: money(roundMoney(totalAnnualDebtService)),
  };
}

function npv(rate: number, cashFlows: number[]) {
  return cashFlows.reduce(
    (total, cashFlow, index) => total + cashFlow / (1 + rate) ** index,
    0,
  );
}

export function calculateIrr(cashFlows: number[]): number | null {
  if (
    cashFlows.length < 2 ||
    !cashFlows.some((value) => value < 0) ||
    !cashFlows.some((value) => value > 0)
  ) {
    return null;
  }

  let low = -0.9999;
  let high = 10;
  let lowNpv = npv(low, cashFlows);
  let highNpv = npv(high, cashFlows);

  while (lowNpv * highNpv > 0 && high < 1_000) {
    high *= 2;
    highNpv = npv(high, cashFlows);
  }

  if (lowNpv * highNpv > 0) return null;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointNpv = npv(midpoint, cashFlows);

    if (Math.abs(midpointNpv) < 0.000001) return midpoint;

    if (lowNpv * midpointNpv <= 0) {
      high = midpoint;
      highNpv = midpointNpv;
    } else {
      low = midpoint;
      lowNpv = midpointNpv;
    }
  }

  return (low + high) / 2;
}

function calculateReturns(
  input: AcquisitionUnderwritingInput,
  earnings: NormalizedEarningsResult,
  capitalStack: CapitalStackResult,
): ReturnResult {
  const buyerCash = amountOf(capitalStack.buyerCashRequired);
  const normalizedFreeCashFlow = amountOf(
    earnings.normalizedUnleveredFreeCashFlow,
  );
  const annualCashFlowToBuyer =
    normalizedFreeCashFlow === null
      ? null
      : normalizedFreeCashFlow - capitalStack.totalAnnualDebtService.amount;
  const cashOnCashReturnPercent =
    buyerCash && annualCashFlowToBuyer !== null
      ? (annualCashFlowToBuyer / buyerCash) * 100
      : null;
  const paybackPeriodYears =
    buyerCash && annualCashFlowToBuyer !== null && annualCashFlowToBuyer > 0
      ? buyerCash / annualCashFlowToBuyer
      : null;

  let irrPercent: number | null = null;
  if (buyerCash && input.returns.annualCashFlowsToBuyer.length > 0) {
    const cashFlows = [
      -buyerCash,
      ...input.returns.annualCashFlowsToBuyer.map(({ amount }) => amount),
    ];
    if (input.returns.exitEquityValue) {
      cashFlows[cashFlows.length - 1] +=
        input.returns.exitEquityValue.amount;
    }
    const irr = calculateIrr(cashFlows);
    irrPercent = irr === null ? null : roundRatio(irr * 100);
  }

  return {
    annualCashFlowToBuyer:
      annualCashFlowToBuyer === null
        ? null
        : money(roundMoney(annualCashFlowToBuyer)),
    cashOnCashReturnPercent:
      cashOnCashReturnPercent === null
        ? null
        : roundRatio(cashOnCashReturnPercent),
    paybackPeriodYears:
      paybackPeriodYears === null ? null : roundRatio(paybackPeriodYears),
    irrPercent,
  };
}

function calculateScenarios(
  input: AcquisitionUnderwritingInput,
  earnings: NormalizedEarningsResult,
  capitalStack: CapitalStackResult,
): UnderwritingScenarioResult[] {
  const revenue = input.operating.annualRevenue.amount;
  const normalizedEbitda = amountOf(earnings.normalizedEbitda);
  const buyerCash = amountOf(capitalStack.buyerCashRequired);
  const baseMargin =
    normalizedEbitda === null || revenue === 0
      ? null
      : normalizedEbitda / revenue;
  const debtService = capitalStack.totalAnnualDebtService.amount;

  return input.scenarios.map((scenario) => {
    const projectedRevenue =
      revenue * (1 + scenario.revenueChangePercent / 100);
    const projectedMargin =
      baseMargin === null
        ? null
        : baseMargin + scenario.ebitdaMarginChangeBasisPoints / 10_000;
    const projectedEbitda =
      projectedMargin === null ? null : projectedRevenue * projectedMargin;
    const projectedFreeCashFlow =
      projectedEbitda === null
        ? null
        : projectedEbitda *
          (scenario.freeCashFlowConversionPercent / 100);
    const annualCashFlowToBuyer =
      projectedFreeCashFlow === null
        ? null
        : projectedFreeCashFlow - debtService;
    const debtServiceCoverageRatio =
      projectedFreeCashFlow === null || debtService === 0
        ? null
        : projectedFreeCashFlow / debtService;
    const cashOnCash =
      annualCashFlowToBuyer === null || !buyerCash
        ? null
        : (annualCashFlowToBuyer / buyerCash) * 100;
    const payback =
      annualCashFlowToBuyer === null ||
      annualCashFlowToBuyer <= 0 ||
      !buyerCash
        ? null
        : buyerCash / annualCashFlowToBuyer;
    const survivable =
      projectedEbitda === null || projectedFreeCashFlow === null
        ? null
        : projectedEbitda >= 0 &&
          projectedFreeCashFlow >=
            debtService + scenario.minimumAnnualCashBuffer.amount;

    return {
      name: scenario.name,
      revenueChangePercent: scenario.revenueChangePercent,
      ebitdaMarginChangeBasisPoints:
        scenario.ebitdaMarginChangeBasisPoints,
      projectedRevenue: money(roundMoney(projectedRevenue)),
      projectedEbitdaMarginPercent:
        projectedMargin === null ? null : roundRatio(projectedMargin * 100),
      projectedEbitda:
        projectedEbitda === null
          ? null
          : money(roundMoney(projectedEbitda)),
      projectedUnleveredFreeCashFlow:
        projectedFreeCashFlow === null
          ? null
          : money(roundMoney(projectedFreeCashFlow)),
      totalAnnualDebtService: capitalStack.totalAnnualDebtService,
      debtServiceCoverageRatio:
        debtServiceCoverageRatio === null
          ? null
          : roundRatio(debtServiceCoverageRatio),
      annualCashFlowToBuyer:
        annualCashFlowToBuyer === null
          ? null
          : money(roundMoney(annualCashFlowToBuyer)),
      buyerCashOnCashReturnPercent:
        cashOnCash === null ? null : roundRatio(cashOnCash),
      paybackPeriodYears: payback === null ? null : roundRatio(payback),
      minimumAnnualCashBuffer: scenario.minimumAnnualCashBuffer,
      survivable,
    };
  });
}

export function underwriteAcquisition(
  input: AcquisitionUnderwritingInput,
): AcquisitionUnderwritingResult {
  validateInput(input);

  const calculationChecks: UnderwritingSignal[] = [];
  const decisionTriggers: UnderwritingSignal[] = [];
  const normalizedEarnings = normalizeEarnings(input);
  const standaloneEnterpriseValueRange = calculateEnterpriseValueRange(
    input,
    normalizedEarnings,
  );
  const bridge = (value: MoneyAmount | null) =>
    value ? bridgeEnterpriseValue(value, input) : null;
  const lowEquityBridge = bridge(standaloneEnterpriseValueRange.low);
  const highEquityBridge = bridge(standaloneEnterpriseValueRange.high);
  const offerEquityBridge = bridge(input.valuation.offerEnterpriseValue);
  const capitalStack = calculateCapitalStack(input, offerEquityBridge);
  const returns = calculateReturns(input, normalizedEarnings, capitalStack);
  const scenarios = calculateScenarios(
    input,
    normalizedEarnings,
    capitalStack,
  );
  const worstCase = scenarios.find(({ name }) => name === "worst_case");
  const worstCaseSurvivable = worstCase?.survivable ?? null;

  if (normalizedEarnings.pendingAdjustments.length > 0) {
    calculationChecks.push({
      code: "pending_adjustments_excluded",
      message: `${normalizedEarnings.pendingAdjustments.length} pending normalization adjustment(s) were excluded from underwritten earnings.`,
    });
  }

  const weakAcceptedAdjustments = normalizedEarnings.acceptedAdjustments.filter(
    ({ source }) => source === "seller_provided" || source === "unknown",
  );
  if (weakAcceptedAdjustments.length > 0) {
    calculationChecks.push({
      code: "accepted_adjustments_need_verification",
      message: `${weakAcceptedAdjustments.length} accepted adjustment(s) rely on seller-provided or unknown evidence.`,
    });
  }

  if (
    standaloneEnterpriseValueRange.low === null ||
    standaloneEnterpriseValueRange.high === null
  ) {
    calculationChecks.push({
      code: "valuation_range_incomplete",
      message:
        "The selected valuation basis does not have the earnings or range assumptions required to calculate value.",
    });
  }

  const requiredScenarioNames: UnderwritingScenarioName[] = [
    "worst_case",
    "most_likely",
    "best_case",
  ];
  const missingScenarioNames = requiredScenarioNames.filter(
    (name) => !scenarios.some((scenario) => scenario.name === name),
  );
  if (missingScenarioNames.length > 0) {
    calculationChecks.push({
      code: "scenario_set_incomplete",
      message: `Missing scenario(s): ${missingScenarioNames.join(", ")}.`,
    });
  }

  if (
    offerEquityBridge &&
    offerEquityBridge.equityValue.amount < 0
  ) {
    calculationChecks.push({
      code: "negative_offer_equity_value",
      message:
        "The enterprise-to-equity bridge produces negative equity value and requires review.",
    });
  }

  if (
    capitalStack.cashConsiderationAtClose &&
    capitalStack.cashConsiderationAtClose.amount < 0
  ) {
    calculationChecks.push({
      code: "negative_cash_consideration",
      message:
        "Earnout and rollover exceed equity purchase price; the capital stack is not executable as entered.",
    });
  }

  if (capitalStack.financingSurplus?.amount) {
    calculationChecks.push({
      code: "financing_sources_exceed_uses",
      message:
        "Debt and seller-financing sources exceed closing uses; reduce or reclassify the excess financing.",
    });
  }

  if (
    input.valuation.offerEnterpriseValue &&
    input.valuation.hardCeilingEnterpriseValue &&
    input.valuation.offerEnterpriseValue.amount >
      input.valuation.hardCeilingEnterpriseValue.amount
  ) {
    decisionTriggers.push({
      code: "offer_above_hard_ceiling",
      message:
        "The offer enterprise value exceeds the buyer's hard ceiling. Pass unless the offer is reduced.",
    });
  }

  if (
    input.valuation.offerEnterpriseValue &&
    standaloneEnterpriseValueRange.high &&
    input.valuation.offerEnterpriseValue.amount >
      standaloneEnterpriseValueRange.high.amount
  ) {
    decisionTriggers.push({
      code: "offer_above_standalone_range",
      message:
        "The offer exceeds the standalone value range; any decision to remain engaged must preserve buyer-specific synergy and the hard ceiling.",
    });
  }

  if (worstCase?.survivable === false) {
    decisionTriggers.push({
      code: "worst_case_not_survivable",
      message:
        "The worst case cannot cover debt service and the minimum annual cash buffer.",
    });
  }

  return {
    targetName: input.targetName,
    asOfDate: input.asOfDate,
    normalizedEarnings,
    valuationBasis: input.valuation.basis,
    primaryReturnMetric: getPrimaryReturnMetric(input.buyerType),
    standaloneEnterpriseValueRange,
    standaloneEquityValueRange: {
      low: lowEquityBridge?.equityValue ?? null,
      high: highEquityBridge?.equityValue ?? null,
    },
    offerEquityBridge,
    capitalStack,
    returns,
    scenarios,
    worstCaseSurvivable,
    dealScreenBridge: {
      offerEnterpriseValue: input.valuation.offerEnterpriseValue,
      standaloneValueLow: standaloneEnterpriseValueRange.low,
      standaloneValueHigh: standaloneEnterpriseValueRange.high,
      hardCeiling: input.valuation.hardCeilingEnterpriseValue,
      worstCaseSurvivable,
    },
    calculationChecks,
    decisionTriggers,
    excludedBuyerSpecificSynergies:
      input.valuation.excludedBuyerSpecificSynergies,
    buyerSpecificSynergyTreatment:
      "Buyer-specific synergies are excluded from standalone value, equity value, financing, and return calculations.",
  };
}
