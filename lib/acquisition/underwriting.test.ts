import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateIrr,
  underwriteAcquisition,
  type AcquisitionUnderwritingInput,
  type NormalizationAdjustment,
  type UnderwritingScenarioInput,
} from "./underwriting";

type UnderwritingOverrides = {
  targetName?: string;
  asOfDate?: string;
  buyerType?: AcquisitionUnderwritingInput["buyerType"];
  operating?: Partial<AcquisitionUnderwritingInput["operating"]>;
  valuation?: Partial<AcquisitionUnderwritingInput["valuation"]>;
  equityBridge?: Partial<AcquisitionUnderwritingInput["equityBridge"]>;
  financing?: Partial<AcquisitionUnderwritingInput["financing"]>;
  returns?: Partial<AcquisitionUnderwritingInput["returns"]>;
  scenarios?: UnderwritingScenarioInput[];
};

const money = (amount: number) => ({ amount, currency: "USD" as const });

const adjustment = (
  overrides: Partial<NormalizationAdjustment>,
): NormalizationAdjustment => ({
  id: "adjustment",
  label: "Adjustment",
  category: "one_time_event",
  amount: money(100_000),
  treatment: "add_back",
  status: "accepted",
  affectsEbitda: true,
  affectsSde: true,
  affectsFreeCashFlow: true,
  source: "externally_verified",
  rationale: "Supported test adjustment.",
  ...overrides,
});

function makeInput(
  overrides: UnderwritingOverrides = {},
): AcquisitionUnderwritingInput {
  const base: AcquisitionUnderwritingInput = {
    targetName: "Test Company",
    asOfDate: "2026-07-31",
    buyerType: "private_equity",
    operating: {
      annualRevenue: money(10_000_000),
      reportedEbitda: money(2_000_000),
      reportedSde: null,
      reportedUnleveredFreeCashFlow: money(1_400_000),
      ownerOperated: false,
      adjustments: [
        adjustment({
          id: "one-time",
          amount: money(200_000),
        }),
        adjustment({
          id: "owner-comp",
          category: "owner_compensation",
          amount: money(100_000),
          treatment: "deduct",
        }),
        adjustment({
          id: "pending",
          amount: money(300_000),
          status: "pending",
          source: "seller_provided",
        }),
      ],
    },
    valuation: {
      basis: "normalized_ebitda",
      lowMultiple: 4,
      highMultiple: 5,
      replacementCostLow: null,
      replacementCostHigh: null,
      offerEnterpriseValue: money(9_000_000),
      hardCeilingEnterpriseValue: money(10_000_000),
      excludedBuyerSpecificSynergies: money(2_000_000),
    },
    equityBridge: {
      cashDelivered: money(100_000),
      debtAssumedOrRefinanced: money(500_000),
      debtLikeItems: money(100_000),
      normalizedWorkingCapitalPeg: money(500_000),
      workingCapitalDelivered: money(400_000),
      deferredMaintenance: money(200_000),
    },
    financing: {
      debtRefinancedAtClose: money(500_000),
      transactionFees: money(100_000),
      incrementalWorkingCapitalFunding: money(150_000),
      nearTermCapitalExpenditure: money(200_000),
      seniorDebt: money(3_000_000),
      sellerFinancing: money(500_000),
      earnout: money(500_000),
      rolloverEquity: money(300_000),
      annualSeniorDebtService: money(500_000),
      annualSellerDebtService: money(50_000),
    },
    returns: {
      annualCashFlowsToBuyer: [
        money(900_000),
        money(900_000),
        money(900_000),
        money(900_000),
        money(900_000),
      ],
      exitEquityValue: money(6_000_000),
    },
    scenarios: [
      {
        name: "worst_case",
        revenueChangePercent: -20,
        ebitdaMarginChangeBasisPoints: -500,
        freeCashFlowConversionPercent: 50,
        minimumAnnualCashBuffer: money(150_000),
      },
      {
        name: "most_likely",
        revenueChangePercent: 0,
        ebitdaMarginChangeBasisPoints: 0,
        freeCashFlowConversionPercent: 70,
        minimumAnnualCashBuffer: money(150_000),
      },
      {
        name: "best_case",
        revenueChangePercent: 10,
        ebitdaMarginChangeBasisPoints: 200,
        freeCashFlowConversionPercent: 75,
        minimumAnnualCashBuffer: money(150_000),
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    operating: { ...base.operating, ...overrides.operating },
    valuation: { ...base.valuation, ...overrides.valuation },
    equityBridge: { ...base.equityBridge, ...overrides.equityBridge },
    financing: { ...base.financing, ...overrides.financing },
    returns: { ...base.returns, ...overrides.returns },
  };
}

test("normalizes earnings using accepted adjustments only", () => {
  const result = underwriteAcquisition(makeInput());

  assert.equal(result.normalizedEarnings.normalizedEbitda?.amount, 2_100_000);
  assert.equal(
    result.normalizedEarnings.normalizedUnleveredFreeCashFlow?.amount,
    1_500_000,
  );
  assert.equal(result.normalizedEarnings.acceptedAdjustments.length, 2);
  assert.equal(result.normalizedEarnings.pendingAdjustments.length, 1);
  assert.equal(
    result.calculationChecks.some(
      ({ code }) => code === "pending_adjustments_excluded",
    ),
    true,
  );
});

test("calculates standalone enterprise and equity value without buyer synergy", () => {
  const result = underwriteAcquisition(makeInput());

  assert.equal(result.standaloneEnterpriseValueRange.low?.amount, 8_400_000);
  assert.equal(result.standaloneEnterpriseValueRange.high?.amount, 10_500_000);
  assert.equal(result.standaloneEquityValueRange.low?.amount, 7_600_000);
  assert.equal(result.standaloneEquityValueRange.high?.amount, 9_700_000);
  assert.equal(result.excludedBuyerSpecificSynergies?.amount, 2_000_000);
  assert.match(result.buyerSpecificSynergyTreatment, /excluded/);
});

test("bridges offer enterprise value to equity value explicitly", () => {
  const result = underwriteAcquisition(makeInput());

  assert.equal(result.offerEquityBridge?.workingCapitalShortfall.amount, 100_000);
  assert.equal(result.offerEquityBridge?.equityValue.amount, 8_200_000);
});

test("calculates closing uses, buyer cash, and annual debt service", () => {
  const result = underwriteAcquisition(makeInput());

  assert.equal(result.capitalStack.cashConsiderationAtClose?.amount, 7_400_000);
  assert.equal(result.capitalStack.totalUsesAtClose?.amount, 8_350_000);
  assert.equal(result.capitalStack.buyerCashRequired?.amount, 4_850_000);
  assert.equal(result.capitalStack.totalAnnualDebtService.amount, 550_000);
  assert.equal(result.capitalStack.financingSurplus?.amount, 0);
});

test("calculates cash-on-cash return, payback, and sponsor IRR", () => {
  const result = underwriteAcquisition(makeInput());

  assert.equal(result.returns.annualCashFlowToBuyer?.amount, 950_000);
  assert.equal(result.returns.cashOnCashReturnPercent, 19.5876);
  assert.equal(result.returns.paybackPeriodYears, 5.1053);
  assert.ok(result.returns.irrPercent !== null);
  assert.ok(result.returns.irrPercent > 15);
});

test("models simultaneous revenue decline and margin compression", () => {
  const result = underwriteAcquisition(makeInput());
  const worstCase = result.scenarios.find(
    ({ name }) => name === "worst_case",
  );

  assert.equal(worstCase?.projectedRevenue.amount, 8_000_000);
  assert.equal(worstCase?.projectedEbitdaMarginPercent, 16);
  assert.equal(worstCase?.projectedEbitda?.amount, 1_280_000);
  assert.equal(worstCase?.projectedUnleveredFreeCashFlow?.amount, 640_000);
  assert.equal(worstCase?.survivable, false);
  assert.equal(result.worstCaseSurvivable, false);
  assert.equal(
    result.decisionTriggers.some(
      ({ code }) => code === "worst_case_not_survivable",
    ),
    true,
  );
});

test("uses normalized SDE for an owner-operated valuation", () => {
  const result = underwriteAcquisition(
    makeInput({
      operating: {
        ownerOperated: true,
        reportedSde: money(1_000_000),
        adjustments: [],
      },
      valuation: {
        basis: "normalized_sde",
        lowMultiple: 3,
        highMultiple: 4,
      },
    }),
  );

  assert.equal(result.standaloneEnterpriseValueRange.low?.amount, 3_000_000);
  assert.equal(result.standaloneEnterpriseValueRange.high?.amount, 4_000_000);
});

test("supports replacement-cost valuation when cash flow is negative", () => {
  const result = underwriteAcquisition(
    makeInput({
      operating: {
        reportedEbitda: money(-500_000),
        reportedUnleveredFreeCashFlow: money(-750_000),
        adjustments: [],
      },
      valuation: {
        basis: "replacement_cost",
        lowMultiple: null,
        highMultiple: null,
        replacementCostLow: money(2_000_000),
        replacementCostHigh: money(3_000_000),
      },
    }),
  );

  assert.equal(result.standaloneEnterpriseValueRange.low?.amount, 2_000_000);
  assert.equal(result.standaloneEnterpriseValueRange.high?.amount, 3_000_000);
});

test("flags an offer above the private hard ceiling", () => {
  const result = underwriteAcquisition(
    makeInput({
      valuation: {
        offerEnterpriseValue: money(10_000_001),
        hardCeilingEnterpriseValue: money(10_000_000),
      },
    }),
  );

  assert.equal(
    result.decisionTriggers.some(
      ({ code }) => code === "offer_above_hard_ceiling",
    ),
    true,
  );
});

test("identifies payback as the governing strategic-buyer return metric", () => {
  const result = underwriteAcquisition(
    makeInput({ buyerType: "strategic_acquirer" }),
  );

  assert.equal(result.primaryReturnMetric, "payback_period");
  assert.equal(
    result.dealScreenBridge.worstCaseSurvivable,
    result.worstCaseSurvivable,
  );
});

test("keeps deferred maintenance out of earnings normalization", () => {
  assert.throws(
    () =>
      underwriteAcquisition(
        makeInput({
          operating: {
            adjustments: [
              adjustment({
                category: "deferred_maintenance",
                treatment: "add_back",
              }),
            ],
          },
        }),
      ),
    /Deferred maintenance belongs in the equity-value bridge/,
  );
});

test("calculates IRR deterministically", () => {
  const irr = calculateIrr([-100, 60, 60]);

  assert.ok(irr !== null);
  assert.ok(Math.abs(irr - 0.130662) < 0.00001);
});

test("rejects invalid valuation ranges", () => {
  assert.throws(
    () =>
      underwriteAcquisition(
        makeInput({
          valuation: {
            lowMultiple: 6,
            highMultiple: 5,
          },
        }),
      ),
    /Low multiple cannot exceed high multiple/,
  );
});

test("rejects SDE valuation for a business that is not owner-operated", () => {
  assert.throws(
    () =>
      underwriteAcquisition(
        makeInput({
          operating: {
            ownerOperated: false,
            reportedSde: money(1_000_000),
          },
          valuation: {
            basis: "normalized_sde",
            lowMultiple: 3,
            highMultiple: 4,
          },
        }),
      ),
    /Normalized SDE may be used only for an owner-operated business/,
  );
});
