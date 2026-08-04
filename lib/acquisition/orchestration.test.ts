import assert from "node:assert/strict";
import test from "node:test";

import { handleAcquisitionApiRequest } from "./http";
import {
  AcquisitionIdempotencyConflictError,
  fingerprintAcquisitionPayload,
  InMemoryAcquisitionIdempotencyStore,
} from "./idempotency";
import type {
  AcquisitionOrchestrationPayload,
  AcquisitionOrchestrationResult,
} from "./orchestration-contract";
import { ACQUISITION_ORCHESTRATION_VERSION } from "./orchestration-contract";
import type { AcquisitionOrchestrator } from "./orchestration";
import {
  AcquisitionOrchestrationStageError,
  createAcquisitionOrchestrator,
} from "./orchestration";
import type { AcquisitionReasoningEngine } from "./reasoning-engine";
import type {
  AcquisitionReasoningReport,
  AcquisitionReasoningRequest,
} from "./reasoning-contract";
import { AcquisitionOrchestrationValidationError } from "./orchestration-validator";

const money = (amount: number) => ({ amount, currency: "USD" as const });
const TEST_API_SECRET = "test-secret-with-at-least-32-characters";

function makePayload(): AcquisitionOrchestrationPayload {
  return {
    orchestrationVersion: ACQUISITION_ORCHESTRATION_VERSION,
    reportId: "acq-test-company-001",
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
        availableEquity: money(10_000_000),
        financingPlan: "Buyer equity at close.",
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
        addBackSummary: "No adjustments entered",
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
        buyerEquity: money(9_000_000),
        seniorDebt: money(0),
        sellerFinancing: money(0),
        earnout: money(0),
        rolloverEquityPercent: 0,
        assumedDebt: money(0),
        workingCapitalIncluded: money(0),
        expectedFees: money(0),
        otherMaterialTerms: [],
      },
      sourceMaterialSummary: "CIM and audited financial statements supplied.",
      buyerQuestions: ["Is revenue transferable?"],
      additionalContext: null,
    },
    dealScreenFacts: {
      company: {
        descriptionProvided: true,
        industryProvided: true,
        competitorsIdentified: true,
        ownerOperated: false,
      },
      financials: {
        cash: money(0),
        debt: money(0),
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
    },
    underwritingInput: {
      targetName: "Test Company",
      asOfDate: "2026-08-04",
      buyerType: "private_equity",
      operating: {
        annualRevenue: money(10_000_000),
        reportedEbitda: money(2_000_000),
        reportedSde: null,
        reportedUnleveredFreeCashFlow: money(1_500_000),
        ownerOperated: false,
        adjustments: [],
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
        cashDelivered: money(0),
        debtAssumedOrRefinanced: money(0),
        debtLikeItems: money(0),
        normalizedWorkingCapitalPeg: money(0),
        workingCapitalDelivered: money(0),
        deferredMaintenance: money(0),
      },
      financing: {
        debtRefinancedAtClose: money(0),
        transactionFees: money(0),
        incrementalWorkingCapitalFunding: money(0),
        nearTermCapitalExpenditure: money(0),
        seniorDebt: money(0),
        sellerFinancing: money(0),
        earnout: money(0),
        rolloverEquity: money(0),
        annualSeniorDebtService: money(0),
        annualSellerDebtService: money(0),
      },
      returns: {
        annualCashFlowsToBuyer: [
          money(1_500_000),
          money(1_500_000),
          money(1_500_000),
          money(1_500_000),
          money(1_500_000),
        ],
        exitEquityValue: money(9_000_000),
      },
      scenarios: [
        {
          name: "worst_case",
          revenueChangePercent: -10,
          ebitdaMarginChangeBasisPoints: -200,
          freeCashFlowConversionPercent: 70,
          minimumAnnualCashBuffer: money(150_000),
        },
        {
          name: "most_likely",
          revenueChangePercent: 0,
          ebitdaMarginChangeBasisPoints: 0,
          freeCashFlowConversionPercent: 75,
          minimumAnnualCashBuffer: money(150_000),
        },
        {
          name: "best_case",
          revenueChangePercent: 10,
          ebitdaMarginChangeBasisPoints: 100,
          freeCashFlowConversionPercent: 75,
          minimumAnnualCashBuffer: money(150_000),
        },
      ],
    },
    evidence: [
      {
        id: "audited-financials",
        statement: "Audited financial statements were supplied.",
        source: "seller_provided",
        confidence: "moderate",
        status: "provided",
        asOfDate: "2026-08-04",
        location: "Data room / Financials",
      },
    ],
  };
}

function minimalReport(
  request: AcquisitionReasoningRequest,
): AcquisitionReasoningReport {
  return {
    reasoningVersion: request.reasoningVersion,
    contractVersion: request.intake.contractVersion,
    reportId: request.reportId,
    generatedAt: request.generatedAt,
    targetName: request.intake.target.companyName,
    segment: request.intake.segment,
    stage: request.intake.stage,
    deterministicDealScreen: request.dealScreen,
    dealEconomics: {
      deterministicUnderwriting: request.underwriting,
    },
  } as AcquisitionReasoningReport;
}

class CapturingReasoningEngine implements AcquisitionReasoningEngine {
  calls = 0;
  requests: AcquisitionReasoningRequest[] = [];
  delay: Promise<void> | null = null;
  failure: Error | null = null;

  async generate(request: AcquisitionReasoningRequest) {
    this.calls += 1;
    this.requests.push(request);
    if (this.delay) await this.delay;
    if (this.failure) throw this.failure;
    return minimalReport(request);
  }
}

function makeOrchestrator(reasoningEngine = new CapturingReasoningEngine()) {
  const timestamps = [
    new Date("2026-08-04T12:00:00.000Z"),
    new Date("2026-08-04T12:00:01.000Z"),
  ];
  let index = 0;
  return {
    reasoningEngine,
    orchestrator: createAcquisitionOrchestrator({
      reasoningEngine,
      now: () => timestamps[Math.min(index++, timestamps.length - 1)],
    }),
  };
}

test("runs underwriting, Deal Screen, and reasoning in authoritative order", async () => {
  const { orchestrator, reasoningEngine } = makeOrchestrator();
  const result = await orchestrator.run({
    requestId: "request-0001",
    idempotencyKey: "idem-key-0001",
    payload: makePayload(),
  });

  assert.equal(reasoningEngine.calls, 1);
  const request = reasoningEngine.requests[0];
  assert.equal(
    request.underwriting.standaloneEnterpriseValueRange.low?.amount,
    8_000_000,
  );
  assert.equal(
    request.dealScreen.rangeStrategy,
    "within_supported_range",
  );
  assert.equal(request.dealScreen.posture, "proceed");
  assert.equal(request.underwriting.worstCaseSurvivable, true);
  assert.equal(result.status, "completed");
  assert.equal(result.idempotency, "created");
  assert.equal(result.report.generatedAt, "2026-08-04T12:00:00.000Z");
  assert.equal(result.completedAt, "2026-08-04T12:00:01.000Z");
});

test("derives price discipline and downside from authoritative inputs", async () => {
  const payload = makePayload();
  payload.intake.proposedTerms.askingPrice = money(10_500_000);
  const { orchestrator, reasoningEngine } = makeOrchestrator();

  await orchestrator.run({
    requestId: "request-0002",
    idempotencyKey: "idem-key-0002",
    payload,
  });

  const request = reasoningEngine.requests[0];
  assert.equal(request.dealScreen.rangeStrategy, "above_hard_ceiling");
  assert.equal(request.dealScreen.posture, "pass");
  assert.equal(
    request.dealScreen.hardStops.some(
      ({ code }) => code === "asking_price_above_hard_ceiling",
    ),
    true,
  );
});

test("coalesces concurrent retries and reports replay status", async () => {
  let release!: () => void;
  const reasoningEngine = new CapturingReasoningEngine();
  reasoningEngine.delay = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { orchestrator } = makeOrchestrator(reasoningEngine);
  const payload = makePayload();

  const first = orchestrator.run({
    requestId: "request-0003",
    idempotencyKey: "idem-key-0003",
    payload,
  });
  const second = orchestrator.run({
    requestId: "request-0004",
    idempotencyKey: "idem-key-0003",
    payload,
  });
  release();
  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.equal(reasoningEngine.calls, 1);
  assert.equal(firstResult.idempotency, "created");
  assert.equal(secondResult.idempotency, "replayed");
  assert.equal(secondResult.requestId, "request-0004");
  assert.equal(firstResult.completedAt, secondResult.completedAt);
});

test("rejects reuse of an idempotency key for a different payload", async () => {
  const { orchestrator } = makeOrchestrator();
  await orchestrator.run({
    requestId: "request-0005",
    idempotencyKey: "idem-key-0005",
    payload: makePayload(),
  });
  const changed = makePayload();
  changed.reportId = "acq-different-report-002";

  await assert.rejects(
    () =>
      orchestrator.run({
        requestId: "request-0006",
        idempotencyKey: "idem-key-0005",
        payload: changed,
      }),
    AcquisitionIdempotencyConflictError,
  );
});

test("releases failed idempotency claims so a retry can succeed", async () => {
  const store = new InMemoryAcquisitionIdempotencyStore<string>();
  let attempts = 0;
  await assert.rejects(() =>
    store.execute("retry-key", "fingerprint", async () => {
      attempts += 1;
      throw new Error("temporary failure");
    }),
  );
  const retry = await store.execute(
    "retry-key",
    "fingerprint",
    async () => {
      attempts += 1;
      return "completed";
    },
  );

  assert.equal(attempts, 2);
  assert.deepEqual(retry, { value: "completed", replayed: false });
});

test("rejects cross-source identity and financial mismatches before reasoning", async () => {
  const payload = makePayload();
  payload.underwritingInput.targetName = "Different Company";
  const { orchestrator, reasoningEngine } = makeOrchestrator();

  await assert.rejects(
    () =>
      orchestrator.run({
        requestId: "request-0007",
        idempotencyKey: "idem-key-0007",
        payload,
      }),
    /target names must match/,
  );
  assert.equal(reasoningEngine.calls, 0);

  const revenueMismatch = makePayload();
  revenueMismatch.intake.target.annualRevenue = money(9_000_000);
  await assert.rejects(
    () =>
      orchestrator.run({
        requestId: "request-0008",
        idempotencyKey: "idem-key-0008",
        payload: revenueMismatch,
      }),
    /annual revenue must match/,
  );
});

test("fingerprints are stable across object key order", () => {
  assert.equal(
    fingerprintAcquisitionPayload({ b: 2, a: { d: 4, c: 3 } }),
    fingerprintAcquisitionPayload({ a: { c: 3, d: 4 }, b: 2 }),
  );
});

function requestFor(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request("https://example.test/api/acquisition/generate", {
    method: "POST",
    headers: {
      authorization: `Bearer ${TEST_API_SECRET}`,
      "content-type": "application/json",
      "idempotency-key": "api-idem-0001",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function successfulApiOrchestrator(): AcquisitionOrchestrator {
  return {
    async run(command) {
      return {
        orchestrationVersion: ACQUISITION_ORCHESTRATION_VERSION,
        requestId: command.requestId,
        reportId: command.payload.reportId,
        status: "completed",
        idempotency: "created",
        completedAt: "2026-08-04T12:00:01.000Z",
        report: minimalReport({
          reasoningVersion: "1.0.0",
          reportId: command.payload.reportId,
          generatedAt: "2026-08-04T12:00:00.000Z",
          intake: command.payload.intake,
          dealScreen: {} as AcquisitionReasoningRequest["dealScreen"],
          underwriting:
            {} as AcquisitionReasoningRequest["underwriting"],
          evidence: command.payload.evidence,
        }),
      };
    },
  };
}

test("API rejects unauthorized requests before constructing the service", async () => {
  let constructed = false;
  const response = await handleAcquisitionApiRequest(
    requestFor(makePayload(), { authorization: "Bearer wrong-secret" }),
    {
      apiSecret: TEST_API_SECRET,
      getOrchestrator: () => {
        constructed = true;
        return successfulApiOrchestrator();
      },
      requestIdFactory: () => "api-request-0001",
    },
  );

  assert.equal(response.status, 401);
  assert.equal(constructed, false);
  assert.equal((await response.json()).error.code, "unauthorized");
});

test("API stays unavailable when the configured secret is weak", async () => {
  let constructed = false;
  const response = await handleAcquisitionApiRequest(requestFor(makePayload()), {
    apiSecret: "too-short",
    getOrchestrator: () => {
      constructed = true;
      return successfulApiOrchestrator();
    },
    requestIdFactory: () => "api-request-weak-secret",
  });

  assert.equal(response.status, 503);
  assert.equal(constructed, false);
  assert.equal((await response.json()).error.code, "service_unavailable");
});

test("API validates and returns the orchestration result", async () => {
  const response = await handleAcquisitionApiRequest(requestFor(makePayload()), {
    apiSecret: TEST_API_SECRET,
    getOrchestrator: successfulApiOrchestrator,
    requestIdFactory: () => "api-request-0002",
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-request-id"), "api-request-0002");
  assert.equal(body.ok, true);
  assert.equal(body.result.reportId, "acq-test-company-001");
});

test("API returns safe retryable reasoning failures", async () => {
  const failing: AcquisitionOrchestrator = {
    async run() {
      throw new AcquisitionOrchestrationStageError(
        "reasoning",
        new Error("provider leaked detail"),
      );
    },
  };
  const response = await handleAcquisitionApiRequest(requestFor(makePayload()), {
    apiSecret: TEST_API_SECRET,
    getOrchestrator: () => failing,
    requestIdFactory: () => "api-request-0003",
    logError: () => undefined,
  });
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error.code, "reasoning_unavailable");
  assert.doesNotMatch(JSON.stringify(body), /provider leaked detail/);
});

test("API rejects malformed payloads and missing idempotency keys", async () => {
  const malformed = await handleAcquisitionApiRequest(requestFor("{"), {
    apiSecret: TEST_API_SECRET,
    getOrchestrator: successfulApiOrchestrator,
    requestIdFactory: () => "api-request-0004",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "invalid_json");

  const { orchestrator } = makeOrchestrator();
  const missingKey = await handleAcquisitionApiRequest(
    requestFor(makePayload(), { "idempotency-key": "" }),
    {
      apiSecret: TEST_API_SECRET,
      getOrchestrator: () => orchestrator,
      requestIdFactory: () => "api-request-0005",
    },
  );
  assert.equal(missingKey.status, 400);
  assert.equal((await missingKey.json()).error.code, "invalid_request");
});

test("strict payload parser rejects unsupported and reserved fields", async () => {
  const extra = makePayload() as AcquisitionOrchestrationPayload & {
    overrideRecommendation?: string;
  };
  extra.overrideRecommendation = "proceed";
  const { orchestrator } = makeOrchestrator();
  await assert.rejects(
    () =>
      orchestrator.run({
        requestId: "request-0009",
        idempotencyKey: "idem-key-0009",
        payload: extra,
      }),
    /unsupported fields/,
  );

  const reserved = makePayload();
  reserved.evidence[0].id = "underwriting";
  await assert.rejects(
    () =>
      orchestrator.run({
        requestId: "request-0010",
        idempotencyKey: "idem-key-0010",
        payload: reserved,
      }),
    AcquisitionOrchestrationValidationError,
  );
});
