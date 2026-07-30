import assert from "node:assert/strict";
import test from "node:test";

import {
  screenAcquisitionDeal,
  type DealScreenInput,
} from "./deal-screen";

type DealScreenOverrides = {
  [Key in keyof DealScreenInput]?: DealScreenInput[Key] extends object
    ? Partial<DealScreenInput[Key]>
    : DealScreenInput[Key];
};

const money = (amount: number) => ({ amount, currency: "USD" as const });

function makeInput(overrides: DealScreenOverrides = {}): DealScreenInput {
  const base: DealScreenInput = {
    targetName: "Test Company",
    segment: "lower_middle_market",
    buyerType: "private_equity",
    company: {
      descriptionProvided: true,
      industryProvided: true,
      competitorsIdentified: true,
      ownerOperated: false,
    },
    financials: {
      annualRevenue: money(10_000_000),
      reportedEbitda: money(2_000_000),
      reportedSde: null,
      freeCashFlow: money(1_500_000),
      cash: money(500_000),
      debt: money(250_000),
      askingPrice: money(10_000_000),
      standaloneValueLow: money(9_000_000),
      standaloneValueHigh: money(11_000_000),
      hardCeiling: money(12_000_000),
      revenueTrend: "growing",
      marginTrend: "stable",
      balanceSheetAvailable: true,
      cashFlowStatementAvailable: true,
    },
    ownership: {
      entityTypeKnown: true,
      capTableAvailable: true,
      sellersOwnMajority: true,
      ownerOperatorsHaveMeaningfulStake: true,
    },
    marketPosition: {
      categoryRank: 2,
      scarcity: "evidenced",
      strategicallyImperative: false,
    },
    valueCreation: {
      turnaroundPotential: "unknown",
      buyerSpecificSynergies: "evidenced",
      worstCaseSurvivable: true,
    },
    integrity: {
      sellerResponseQuality: "forthright",
      misrepresentationSeverity: "none",
    },
    evidence: {
      cim: "provided",
      financialStatements: "provided",
      financialStatementQuality: "audited",
      topTenCustomers: "provided",
      employeeListing: "provided",
      revenueAndCustomerMix: "provided",
      generalLedger: "provided",
    },
  };

  return {
    ...base,
    ...overrides,
    company: { ...base.company, ...overrides.company },
    financials: { ...base.financials, ...overrides.financials },
    ownership: { ...base.ownership, ...overrides.ownership },
    marketPosition: {
      ...base.marketPosition,
      ...overrides.marketPosition,
    },
    valueCreation: { ...base.valueCreation, ...overrides.valueCreation },
    integrity: { ...base.integrity, ...overrides.integrity },
    evidence: { ...base.evidence, ...overrides.evidence },
  };
}

test("proceeds when the package is complete, price is supported, and downside survives", () => {
  const result = screenAcquisitionDeal(makeInput());

  assert.equal(result.posture, "proceed");
  assert.equal(result.loiReadiness.minimumPackageComplete, true);
  assert.equal(result.loiReadiness.readyToIssue, true);
  assert.equal(result.primaryReturnMetric, "irr");
  assert.equal(
    result.valuationBasis,
    "normalized_free_cash_flow_and_ebitda",
  );
});

test("preserves optionality for a scarce asset with a high ask and fragmented control", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      financials: {
        askingPrice: money(11_750_000),
        standaloneValueHigh: money(11_000_000),
      },
      ownership: {
        sellersOwnMajority: false,
      },
    }),
  );

  assert.equal(result.posture, "investigate");
  assert.equal(result.rangeStrategy, "advance_with_broad_range");
  assert.equal(
    result.hardStops.some(({ code }) => code === "seller_lacks_control"),
    false,
  );
  assert.equal(
    result.conditionsToAdvance.some(
      ({ code }) => code === "credible_consent_path_required",
    ),
    true,
  );
});

test("passes on an average asset whose price lacks a value-creation bridge", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      financials: {
        askingPrice: money(11_500_000),
        standaloneValueHigh: money(10_000_000),
      },
      marketPosition: {
        categoryRank: "other",
        scarcity: "none",
      },
      valueCreation: {
        turnaroundPotential: "none",
        buyerSpecificSynergies: "none",
      },
    }),
  );

  assert.equal(result.posture, "pass");
  assert.equal(
    result.hardStops.some(
      ({ code }) => code === "average_asset_unsupported_price",
    ),
    true,
  );
});

test("the hard ceiling overrides scarcity", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      financials: {
        askingPrice: money(12_000_001),
        hardCeiling: money(12_000_000),
      },
    }),
  );

  assert.equal(result.posture, "pass");
  assert.equal(result.rangeStrategy, "above_hard_ceiling");
});

test("a non-survivable downside is a hard stop", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      valueCreation: {
        worstCaseSurvivable: false,
      },
    }),
  );

  assert.equal(result.posture, "pass");
  assert.equal(
    result.hardStops.some(
      ({ code }) => code === "worst_case_not_survivable",
    ),
    true,
  );
});

test("uses SDE for an owner-operated business", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      segment: "main_street",
      buyerType: "individual_operator",
      company: {
        ownerOperated: true,
      },
      financials: {
        reportedSde: money(900_000),
      },
    }),
  );

  assert.equal(result.valuationBasis, "normalized_sde");
  assert.equal(result.primaryReturnMetric, "cash_flow_resilience");
});

test("uses payback period as the primary return metric for a strategic buyer", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      segment: "strategic",
      buyerType: "strategic_acquirer",
    }),
  );

  assert.equal(result.primaryReturnMetric, "payback_period");
});

test("uses replacement cost when EBITDA and free cash flow are non-positive", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      financials: {
        reportedEbitda: money(-100_000),
        freeCashFlow: money(-250_000),
      },
    }),
  );

  assert.equal(result.valuationBasis, "replacement_cost");
});

test("requires the complete minimum information package before an LOI", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      evidence: {
        topTenCustomers: "partial",
        employeeListing: "unavailable",
      },
    }),
  );

  assert.equal(result.loiReadiness.minimumPackageComplete, false);
  assert.equal(result.loiReadiness.readyToIssue, false);
  assert.deepEqual(result.loiReadiness.missingItems, [
    "Top 10 customer list",
    "Employee listing with titles, functions, and compensation",
  ]);
});

test("material misrepresentation increases diligence without becoming an automatic walk", () => {
  const result = screenAcquisitionDeal(
    makeInput({
      integrity: {
        misrepresentationSeverity: "material",
      },
    }),
  );

  assert.equal(result.posture, "investigate");
  assert.equal(
    result.concerns.some(
      ({ code }) => code === "potential_misrepresentation",
    ),
    true,
  );
  assert.equal(
    result.conditionsToAdvance.some(
      ({ code }) => code === "reconcile_financials_to_gl",
    ),
    true,
  );
});
