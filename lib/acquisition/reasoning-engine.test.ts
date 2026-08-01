import assert from "node:assert/strict";
import test from "node:test";

import type { Anthropic } from "@anthropic-ai/sdk";
import { AnthropicAcquisitionReasoningModel } from "./anthropic-reasoning-client";
import {
  DEFAULT_ACQUISITION_REASONING_CONFIG,
  getAcquisitionReasoningConfig,
} from "./reasoning-config";
import {
  ACQUISITION_REASONING_VERSION,
  type AcquisitionReasoningDraft,
  type AcquisitionReasoningModel,
  type AcquisitionReasoningModelRequest,
  type AcquisitionReasoningRequest,
  type ReasonedAssessment,
} from "./reasoning-contract";
import {
  createAcquisitionReasoningEngine,
  resolveAcquisitionGoverningDecision,
} from "./reasoning-engine";
import { AcquisitionReasoningValidationError } from "./reasoning-validator";

const money = (amount: number) => ({ amount, currency: "USD" as const });

const assessment = (evidenceIds = ["underwriting"]): ReasonedAssessment => ({
  conclusion: "The conclusion is bounded by supplied evidence.",
  analysis: "The supplied evidence supports a preliminary interpretation.",
  implications: "Validate the open issue before the next commitment.",
  evidenceIds,
});

function makeDraft(): AcquisitionReasoningDraft {
  return {
    investmentCommitteeSnapshot: {
      headline: "Attractive economics with one evidence gate",
      transactionFrame: "A lower-middle-market cash-flow acquisition.",
      definingOpportunity: "Durable cash flow at a supportable price.",
      definingUncertainty: "Customer durability remains unverified.",
      reliancePosture: "screen_grade",
    },
    decisionInterpretation:
      "The deterministic screen supports advancement subject to verification.",
    thesisAssessment: assessment(["buyer-intake"]),
    buyerFitAssessment: assessment(["buyer-intake"]),
    economicsInterpretation: assessment(),
    revenueQuality: assessment(["financials"]),
    earningsQuality: assessment(["financials", "underwriting"]),
    cashConversion: assessment(["underwriting"]),
    ownerDependence: assessment(["buyer-intake"]),
    managementDepth: assessment(["buyer-intake"]),
    customerConcentration: assessment(["financials"]),
    workingCapital: assessment(["underwriting"]),
    capitalExpenditure: assessment(["underwriting"]),
    aiExposure: assessment(["buyer-intake"]),
    financing: assessment(["underwriting"]),
    integration: assessment(["buyer-intake"]),
    sellerMotivation: assessment(["buyer-intake"]),
    findings: [
      {
        id: "customer-verification",
        dimension: "customer_concentration",
        title: "Customer concentration requires verification",
        rating: "moderate",
        disposition: "investigate",
        evidenceIds: ["financials"],
        implication: "Unverified concentration could impair revenue durability.",
        requiredAction: "Obtain and reconcile the top-ten customer schedule.",
      },
    ],
    diligencePressureMap: [
      {
        rank: 1,
        area: "Revenue quality",
        whyItMatters: "It could change normalized earnings and price.",
        evidenceRequired: "Customer contracts and invoice-to-GL samples.",
        decisionAffected: "Whether to submit an LOI.",
        evidenceIds: ["financials"],
      },
    ],
    actionMap: {
      investigate: [
        {
          item: "Reconcile revenue to the general ledger.",
          rationale: "Revenue durability is not yet diligence-grade.",
          evidenceIds: ["financials"],
        },
      ],
      price: [],
      protect: [],
    },
    walkAwayConditions: [
      {
        item: "Pass if the downside case becomes non-survivable.",
        rationale: "Downside survivability is a deterministic hard stop.",
        evidenceIds: ["underwriting"],
      },
    ],
    uncertaintySurface: [
      {
        unknown: "Customer retention after close is unverified.",
        decisionConsequence: "Durable revenue cannot yet be concluded.",
        evidenceRequired: "Contracts, cohort data, and customer calls.",
        evidenceIds: ["financials"],
      },
    ],
    rankedSellerQuestions: [
      {
        rank: 1,
        question: "Which customers may terminate after a change of control?",
        reason: "This tests revenue transferability.",
        decisionAffected: "LOI price and protections.",
        evidenceIds: ["financials"],
      },
    ],
    nextDecision: {
      commitment: "Decide whether to issue an LOI.",
      evidenceGate: "Complete the minimum evidence package.",
      stopCondition: "A hard ceiling or downside survivability breach.",
    },
    limitations: ["This is a preliminary acquisition screen."],
  };
}

function makeRequest(): AcquisitionReasoningRequest {
  return {
    reasoningVersion: ACQUISITION_REASONING_VERSION,
    reportId: "acq-test-company-001",
    generatedAt: "2026-08-01T12:00:00.000Z",
    intake: {
      contractVersion: "1.0.0",
      segment: "lower_middle_market",
      stage: "cim",
      buyer: {
        buyerType: "private_equity",
        acquisitionThesis: "Acquire a durable category leader.",
        targetIndustries: ["Business services"],
        targetGeographies: ["United States"],
        operatingIntent: "hold_existing_management",
        relevantExperience: "Experienced operator and acquirer.",
        availableEquity: money(5_000_000),
        financingPlan: "Senior debt plus buyer equity.",
        returnObjective: "Five-year sponsor return.",
        holdPeriod: "Five years",
        nonNegotiableConstraints: ["Downside must be survivable."],
      },
      target: {
        companyName: "Test Company",
        companyDescription: "Provides recurring business services.",
        industry: "Business services",
        geography: "United States",
        yearsInBusiness: 12,
        annualRevenue: money(10_000_000),
        reportedEbitda: money(2_000_000),
        reportedSde: null,
        revenueGrowth: "Growing",
        marginTrajectory: "Stable",
        revenueModel: "Contracted and recurring",
        recurringRevenuePercent: 70,
        largestCustomerPercent: 15,
        customerTenure: "Five years",
        ownerRole: "Chief executive",
        ownerTransitionOffer: "Six months",
        managementDepth: "Functional leaders in place",
        employeeCount: 50,
        keyEmployeeRisk: "Unknown",
        systemsDocumentation: "Partial",
        financialCleanliness: "Audited statements supplied",
        addBackSummary: "One-time costs under review",
        workingCapitalProfile: "Seasonal",
        capitalExpenditureProfile: "Low",
        facilityAndLeaseProfile: "One leased office",
        legalAndRegulatoryExposure: "No known material issues",
        claimedDefensibility: ["Customer tenure"],
        industryDynamics: "Stable",
        aiExposure: "Under review",
        sellerMotivation: "Retirement",
        knownDiligenceIssues: ["Customer concentration"],
      },
      proposedTerms: {
        askingPrice: money(9_000_000),
        transactionStructure: "asset_purchase",
        buyerEquity: money(4_500_000),
        seniorDebt: money(3_000_000),
        sellerFinancing: money(500_000),
        earnout: money(500_000),
        rolloverEquityPercent: 0,
        assumedDebt: money(0),
        workingCapitalIncluded: money(500_000),
        expectedFees: money(100_000),
        otherMaterialTerms: [],
      },
      sourceMaterialSummary: "CIM and financial statements supplied.",
      buyerQuestions: ["Is revenue transferable?"],
      additionalContext: null,
    },
    dealScreen: {
      targetName: "Test Company",
      posture: "proceed",
      confidence: "moderate",
      valuationBasis: "normalized_free_cash_flow_and_ebitda",
      primaryReturnMetric: "irr",
      rangeStrategy: "within_supported_range",
      loiReadiness: {
        minimumPackageComplete: true,
        readyToIssue: true,
        missingItems: [],
      },
      strengths: [{ code: "cash_flow", message: "Cash flow is positive." }],
      concerns: [],
      hardStops: [],
      missingInformation: [],
      conditionsToAdvance: [],
      buyerOwnedSynergyNote: "Buyer-specific synergy remains buyer-owned.",
      rationale: "Price is supported and the downside is survivable.",
    },
    underwriting: {
      targetName: "Test Company",
      asOfDate: "2026-07-31",
      normalizedEarnings: {
        reportedEbitda: money(2_000_000),
        reportedSde: null,
        reportedUnleveredFreeCashFlow: money(1_400_000),
        normalizedEbitda: money(2_100_000),
        normalizedSde: null,
        normalizedUnleveredFreeCashFlow: money(1_500_000),
        acceptedAdjustments: [],
        pendingAdjustments: [],
        rejectedAdjustments: [],
      },
      valuationBasis: "normalized_ebitda",
      primaryReturnMetric: "irr",
      standaloneEnterpriseValueRange: {
        low: money(8_400_000),
        high: money(10_500_000),
      },
      standaloneEquityValueRange: {
        low: money(8_000_000),
        high: money(10_100_000),
      },
      offerEquityBridge: {
        enterpriseValue: money(9_000_000),
        cashDelivered: money(100_000),
        debtAssumedOrRefinanced: money(250_000),
        debtLikeItems: money(50_000),
        workingCapitalShortfall: money(0),
        deferredMaintenance: money(0),
        equityValue: money(8_800_000),
      },
      capitalStack: {
        equityPurchasePrice: money(8_800_000),
        cashConsiderationAtClose: money(7_800_000),
        debtRefinancedAtClose: money(250_000),
        transactionFees: money(100_000),
        incrementalWorkingCapitalFunding: money(100_000),
        nearTermCapitalExpenditure: money(100_000),
        totalUsesAtClose: money(8_350_000),
        seniorDebt: money(3_000_000),
        sellerFinancing: money(500_000),
        buyerCashRequired: money(4_850_000),
        financingSurplus: money(0),
        deferredEarnout: money(500_000),
        rolloverEquity: money(0),
        totalAnnualDebtService: money(550_000),
      },
      returns: {
        annualCashFlowToBuyer: money(950_000),
        cashOnCashReturnPercent: 19.5876,
        paybackPeriodYears: 5.1053,
        irrPercent: 18.2,
      },
      scenarios: [
        {
          name: "worst_case",
          revenueChangePercent: -10,
          ebitdaMarginChangeBasisPoints: -200,
          projectedRevenue: money(9_000_000),
          projectedEbitdaMarginPercent: 18,
          projectedEbitda: money(1_620_000),
          projectedUnleveredFreeCashFlow: money(1_000_000),
          totalAnnualDebtService: money(550_000),
          debtServiceCoverageRatio: 1.8182,
          annualCashFlowToBuyer: money(450_000),
          buyerCashOnCashReturnPercent: 9.2784,
          paybackPeriodYears: 10.7778,
          minimumAnnualCashBuffer: money(150_000),
          survivable: true,
        },
      ],
      worstCaseSurvivable: true,
      dealScreenBridge: {
        offerEnterpriseValue: money(9_000_000),
        standaloneValueLow: money(8_400_000),
        standaloneValueHigh: money(10_500_000),
        hardCeiling: money(10_000_000),
        worstCaseSurvivable: true,
      },
      calculationChecks: [],
      decisionTriggers: [],
      excludedBuyerSpecificSynergies: money(2_000_000),
      buyerSpecificSynergyTreatment:
        "Buyer-specific synergy is excluded from standalone value.",
    },
    evidence: [
      {
        id: "financials",
        statement: "Audited financial statements were supplied.",
        source: "seller_provided",
        confidence: "moderate",
        status: "provided",
        asOfDate: "2026-07-31",
        location: "Data room / Financials",
      },
    ],
  };
}

class MockModel implements AcquisitionReasoningModel {
  request: AcquisitionReasoningModelRequest | null = null;

  constructor(private readonly output: unknown) {}

  async generateStructured(request: AcquisitionReasoningModelRequest) {
    this.request = request;
    return this.output;
  }
}

test("uses model configuration and preserves deterministic outputs", async () => {
  const request = makeRequest();
  const model = new MockModel(makeDraft());
  const engine = createAcquisitionReasoningEngine({
    model,
    config: {
      provider: "anthropic",
      model: "configured-reasoning-model",
      maxTokens: 6_000,
      temperature: 0.1,
    },
  });

  const report = await engine.generate(request);

  assert.equal(model.request?.model, "configured-reasoning-model");
  assert.equal(model.request?.maxTokens, 6_000);
  assert.equal(model.request?.temperature, 0.1);
  assert.equal(model.request?.toolName, "submit_acquisition_reasoning");
  assert.deepEqual(report.dealEconomics.deterministicUnderwriting, request.underwriting);
  assert.deepEqual(report.deterministicDealScreen, request.dealScreen);
  assert.equal(report.investmentCommitteeSnapshot.recommendation, "proceed");
  assert.equal(report.investmentCommitteeSnapshot.confidence, "moderate");
  assert.equal(
    report.decision.coreReason,
    "Price is supported and the downside is survivable.",
  );
  assert.equal(
    report.decisionInterpretation,
    makeDraft().decisionInterpretation,
  );
  assert.deepEqual(
    report.evidenceRegister.map(({ id }) => id),
    ["buyer-intake", "deal-screen", "underwriting", "financials"],
  );
});

test("underwriting hard ceiling forces a pass", () => {
  const request = makeRequest();
  request.underwriting.decisionTriggers.push({
    code: "offer_above_hard_ceiling",
    message: "The offer exceeds the buyer's hard ceiling.",
  });

  const decision = resolveAcquisitionGoverningDecision(request);

  assert.equal(decision.posture, "pass");
  assert.deepEqual(decision.hardVetoes, [
    "The offer exceeds the buyer's hard ceiling.",
  ]);
});

test("non-survivable underwriting forces a pass", () => {
  const request = makeRequest();
  request.underwriting.worstCaseSurvivable = false;
  request.underwriting.dealScreenBridge.worstCaseSurvivable = false;

  const decision = resolveAcquisitionGoverningDecision(request);
  assert.equal(decision.posture, "pass");
  assert.match(decision.hardVetoes[0], /worst-case scenario/);
});

test("rejects unknown model evidence citations", async () => {
  const draft = makeDraft();
  draft.revenueQuality.evidenceIds = ["invented-source"];
  const engine = createAcquisitionReasoningEngine({
    model: new MockModel(draft),
  });

  await assert.rejects(
    () => engine.generate(makeRequest()),
    (error: unknown) =>
      error instanceof AcquisitionReasoningValidationError &&
      /unknown evidence IDs/.test(error.message),
  );
});

test("rejects model attempts to add a decision posture", async () => {
  const draft = {
    ...makeDraft(),
    recommendedPosture: "proceed",
  };
  const engine = createAcquisitionReasoningEngine({
    model: new MockModel(draft),
  });

  await assert.rejects(
    () => engine.generate(makeRequest()),
    (error: unknown) =>
      error instanceof AcquisitionReasoningValidationError &&
      /unsupported fields/.test(error.message),
  );
});

test("rejects target mismatch before calling the model", async () => {
  const request = makeRequest();
  request.underwriting.targetName = "Different Company";
  const model = new MockModel(makeDraft());
  const engine = createAcquisitionReasoningEngine({ model });

  await assert.rejects(() => engine.generate(request), /must match exactly/);
  assert.equal(model.request, null);
});

test("rejects duplicate and reserved source evidence IDs", async () => {
  const request = makeRequest();
  request.evidence.push({ ...request.evidence[0] });
  const engine = createAcquisitionReasoningEngine({
    model: new MockModel(makeDraft()),
  });
  await assert.rejects(() => engine.generate(request), /duplicated/);

  const reserved = makeRequest();
  reserved.evidence[0].id = "underwriting";
  await assert.rejects(() => engine.generate(reserved), /reserved/);
});

test("loads and validates reasoning configuration", () => {
  assert.deepEqual(getAcquisitionReasoningConfig({}), DEFAULT_ACQUISITION_REASONING_CONFIG);
  assert.deepEqual(
    getAcquisitionReasoningConfig({
      ACQUISITION_REASONING_MODEL: "another-model",
      ACQUISITION_REASONING_MAX_TOKENS: "5000",
      ACQUISITION_REASONING_TEMPERATURE: "0.25",
    }),
    {
      provider: "anthropic",
      model: "another-model",
      maxTokens: 5_000,
      temperature: 0.25,
    },
  );
  assert.throws(
    () =>
      getAcquisitionReasoningConfig({
        ACQUISITION_REASONING_MAX_TOKENS: "0",
      }),
    /positive integer/,
  );
  assert.throws(
    () =>
      getAcquisitionReasoningConfig({
        ACQUISITION_REASONING_TEMPERATURE: "1.5",
      }),
    /between 0 and 1/,
  );
});

test("Anthropic adapter requires and returns the configured tool input", async () => {
  const sent: Record<string, unknown>[] = [];
  const fakeClient = {
    messages: {
      create: async (parameters: Record<string, unknown>) => {
        sent.push(parameters);
        return {
          content: [
            {
              type: "tool_use",
              id: "tool-1",
              name: "submit_acquisition_reasoning",
              input: makeDraft(),
            },
          ],
        };
      },
    },
  } as unknown as Pick<Anthropic, "messages">;
  const adapter = new AnthropicAcquisitionReasoningModel(fakeClient);
  const output = await adapter.generateStructured({
    model: "configured-model",
    maxTokens: 5_000,
    temperature: 0,
    systemPrompt: "system",
    userPrompt: "user",
    toolName: "submit_acquisition_reasoning",
    toolSchema: { type: "object" },
  });

  assert.deepEqual(output, makeDraft());
  assert.equal(sent[0].model, "configured-model");
  assert.deepEqual(sent[0].tool_choice, {
    type: "tool",
    name: "submit_acquisition_reasoning",
  });
});
