import type { MoneyAmount } from "./contracts";
import type {
  AcquisitionReasoningReport,
  ReasonedAssessment,
} from "./reasoning-contract";

const money = (amount: number): MoneyAmount => ({ amount, currency: "USD" });

const assessment = (
  conclusion: string,
  evidenceIds: string[] = ["E-001"],
): ReasonedAssessment => ({
  conclusion,
  analysis:
    "The supplied information supports a preliminary buyer-side interpretation, but the conclusion remains bounded by the current evidence package.",
  implications:
    "Verify the underlying records before changing price, structure, or transaction commitment.",
  evidenceIds,
});

export function makeAcquisitionReportFixture(): AcquisitionReasoningReport {
  return {
    reasoningVersion: "1.0.0",
    contractVersion: "1.0.0",
    reportId: "acq-harbor-services-001",
    generatedAt: "2026-08-06T17:00:00.000Z",
    targetName: "Harbor Business Services",
    segment: "lower_middle_market",
    stage: "cim",
    investmentCommitteeSnapshot: {
      headline:
        "Advance within a disciplined range while customer durability and normalized earnings are verified.",
      transactionFrame:
        "A lower-middle-market services platform with recurring revenue, positive cash flow, and a credible path to an evidence-gated LOI.",
      definingOpportunity:
        "A top-two regional position, durable customer tenure, and back-office integration potential without underwriting buyer-specific synergies.",
      definingUncertainty:
        "The top-customer schedule, add-backs, and change-of-control exposure have not been reconciled to source records.",
      reliancePosture: "screen_grade",
      recommendation: "investigate",
      confidence: "moderate",
    },
    decision: {
      posture: "investigate",
      confidence: "moderate",
      coreReason:
        "Standalone economics support continued diligence, but the buyer should not issue an LOI until revenue quality and normalized earnings are independently reconciled.",
      conditionsToAdvance: [
        "Reconcile revenue to the general ledger, bank activity, contracts, and sampled invoices.",
        "Validate each accepted add-back and normalize owner compensation to market.",
        "Confirm the downside case remains survivable after customer and margin stress.",
      ],
      hardVetoes: [
        "Pass if seller majority control cannot be confirmed.",
        "Pass if the asking price exceeds the hard ceiling without scarce, strategically imperative value.",
      ],
      compoundingRisks: [
        "Customer concentration and change-of-control rights may compound transition risk.",
        "Weak management depth could make the founder transition more fragile.",
      ],
    },
    decisionInterpretation:
      "Keep the process alive with a broad, supportable range. Do not pay the seller for buyer-owned synergies, and preserve a hard ceiling until the evidence package improves.",
    thesisAssessment: assessment(
      "The target fits a durable-services thesis, subject to evidence that revenue transfers after close.",
      ["E-001", "E-002"],
    ),
    buyerFitAssessment: assessment(
      "The buyer has relevant integration capabilities and can preserve revenue functions while consolidating back office operations.",
      ["E-003"],
    ),
    dealEconomics: {
      interpretation: assessment(
        "The offer sits inside the standalone value range and the modeled downside remains survivable.",
        ["CALC-UNDERWRITING"],
      ),
      deterministicUnderwriting: {
        targetName: "Harbor Business Services",
        asOfDate: "2026-06-30",
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
          {
            name: "most_likely",
            revenueChangePercent: 0,
            ebitdaMarginChangeBasisPoints: 0,
            projectedRevenue: money(10_000_000),
            projectedEbitdaMarginPercent: 21,
            projectedEbitda: money(2_100_000),
            projectedUnleveredFreeCashFlow: money(1_500_000),
            totalAnnualDebtService: money(550_000),
            debtServiceCoverageRatio: 2.7273,
            annualCashFlowToBuyer: money(950_000),
            buyerCashOnCashReturnPercent: 19.5876,
            paybackPeriodYears: 5.1053,
            minimumAnnualCashBuffer: money(150_000),
            survivable: true,
          },
          {
            name: "best_case",
            revenueChangePercent: 8,
            ebitdaMarginChangeBasisPoints: 100,
            projectedRevenue: money(10_800_000),
            projectedEbitdaMarginPercent: 22,
            projectedEbitda: money(2_376_000),
            projectedUnleveredFreeCashFlow: money(1_800_000),
            totalAnnualDebtService: money(550_000),
            debtServiceCoverageRatio: 3.2727,
            annualCashFlowToBuyer: money(1_250_000),
            buyerCashOnCashReturnPercent: 25.7732,
            paybackPeriodYears: 3.88,
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
        calculationChecks: [
          { code: "equity_bridge_balanced", message: "The enterprise-to-equity bridge balances." },
        ],
        decisionTriggers: [
          { code: "verify_addbacks", message: "Pending add-backs cannot receive valuation credit." },
        ],
        excludedBuyerSpecificSynergies: money(2_000_000),
        buyerSpecificSynergyTreatment:
          "Buyer-specific synergies are excluded from standalone value because the buyer bears the execution risk.",
      },
    },
    underwritingAssessment: {
      revenueQuality: assessment("Recurring revenue appears meaningful, but contract transferability is not yet proven.", ["E-001", "E-002"]),
      earningsQuality: assessment("Reported EBITDA requires an add-back and accounting-policy reconciliation.", ["E-001"]),
      cashConversion: assessment("Cash conversion is positive and must be tied to bank activity and the cash flow statement.", ["E-001"]),
      ownerDependence: assessment("The owner remains commercially important during transition.", ["E-003"]),
      managementDepth: assessment("Functional leadership exists, but second-layer accountability is not established.", ["E-003"]),
      customerConcentration: assessment("The largest-customer exposure may be manageable but is not diligence-grade.", ["E-002"]),
      workingCapital: assessment("The proposed peg requires a monthly historical analysis.", ["CALC-UNDERWRITING"]),
      capitalExpenditure: assessment("Near-term maintenance capital is modeled but not independently validated.", ["E-001"]),
      aiExposure: assessment("AI appears more likely to create workflow upside than near-term displacement risk.", ["E-003"]),
      financing: assessment("Debt service is covered in the modeled downside case.", ["CALC-UNDERWRITING"]),
      integration: assessment("Back-office integration can begin early while revenue functions remain protected.", ["E-003"]),
      sellerMotivation: assessment("Retirement is plausible but should not substitute for operating diligence.", ["E-003"]),
    },
    findings: [
      {
        id: "customer-transferability",
        dimension: "customer_concentration",
        title: "Customer transferability requires verification",
        rating: "high",
        disposition: "investigate",
        evidenceIds: ["E-002"],
        implication: "Change-of-control termination could reduce durable revenue after close.",
        requiredAction: "Review contracts and conduct confirmatory customer calls.",
      },
      {
        id: "addback-support",
        dimension: "earnings_quality",
        title: "Add-back support is incomplete",
        rating: "moderate",
        disposition: "price",
        evidenceIds: ["E-001"],
        implication: "Unsupported add-backs overstate normalized earnings and standalone value.",
        requiredAction: "Trace each adjustment to the general ledger and source invoices.",
      },
    ],
    diligencePressureMap: [
      {
        rank: 1,
        area: "Revenue durability and transferability",
        whyItMatters: "It may change normalized cash flow, price, and willingness to issue an LOI.",
        evidenceRequired: "Top-ten schedule, contracts, renewal history, invoices, and customer calls.",
        decisionAffected: "LOI price and whether to advance.",
        evidenceIds: ["E-002"],
      },
      {
        rank: 2,
        area: "Earnings normalization",
        whyItMatters: "The payback and value range depend on defensible recurring earnings.",
        evidenceRequired: "General ledger, bank statements, tax returns, and add-back support.",
        decisionAffected: "Valuation range and hard ceiling.",
        evidenceIds: ["E-001"],
      },
    ],
    actionMap: {
      investigate: [
        {
          item: "Reconcile revenue from the general ledger through bank activity.",
          rationale: "Revenue overstatement is a primary buyer-side diligence risk.",
          evidenceIds: ["E-001", "E-002"],
        },
      ],
      price: [
        {
          item: "Remove unsupported add-backs from normalized EBITDA.",
          rationale: "The seller should receive value only for earnings achieved and supportable today.",
          evidenceIds: ["E-001"],
        },
      ],
      protect: [
        {
          item: "Use an earnout if the seller remains and revenue transfer risk persists.",
          rationale: "A clearly defined revenue and EBITDA earnout preserves downside protection.",
          evidenceIds: ["E-002", "E-003"],
        },
      ],
    },
    walkAwayConditions: [
      {
        item: "Pass if the downside case becomes non-survivable.",
        rationale: "The transaction must withstand both revenue decline and margin compression.",
        evidenceIds: ["CALC-UNDERWRITING"],
      },
    ],
    uncertaintySurface: [
      {
        unknown: "Whether material customer contracts survive a change of control.",
        decisionConsequence: "Revenue transferability and post-close cash flow remain uncertain.",
        evidenceRequired: "Executed contracts and customer consent requirements.",
        evidenceIds: ["E-002"],
      },
      {
        unknown: "Whether owner compensation is normalized to market.",
        decisionConsequence: "True recurring operating cost may be understated.",
        evidenceRequired: "Payroll register, role description, and compensation benchmark.",
        evidenceIds: ["E-003"],
      },
    ],
    rankedSellerQuestions: [
      {
        rank: 1,
        question: "Which top-ten customers may terminate or renegotiate after a change of control?",
        reason: "This most directly tests revenue transferability.",
        decisionAffected: "LOI posture, price, and transaction protections.",
        evidenceIds: ["E-002"],
      },
      {
        rank: 2,
        question: "Which add-backs can be traced to a one-time, non-ordinary-course event?",
        reason: "Only supported adjustments should receive valuation credit.",
        decisionAffected: "Normalized EBITDA and hard ceiling.",
        evidenceIds: ["E-001"],
      },
    ],
    nextDecision: {
      commitment: "Decide whether to issue a non-binding LOI within the supported range.",
      evidenceGate: "Complete the revenue, earnings, ownership, and downside-survivability verification package.",
      stopCondition: "Pass if seller control fails, the hard ceiling is exceeded, or the downside becomes non-survivable.",
    },
    deterministicDealScreen: {
      targetName: "Harbor Business Services",
      posture: "investigate",
      confidence: "moderate",
      valuationBasis: "normalized_free_cash_flow_and_ebitda",
      primaryReturnMetric: "irr",
      rangeStrategy: "within_supported_range",
      loiReadiness: {
        minimumPackageComplete: true,
        readyToIssue: false,
        missingItems: [],
      },
      strengths: [
        { code: "positive_cash_flow", message: "The business generates positive cash flow." },
        { code: "category_position", message: "The target reports a top-two regional position." },
      ],
      concerns: [
        { code: "customer_concentration", message: "Customer concentration requires verification." },
      ],
      hardStops: [],
      missingInformation: [],
      conditionsToAdvance: [
        { code: "reconcile_revenue", message: "Reconcile revenue and customer mix." },
      ],
      buyerOwnedSynergyNote: "Buyer-specific synergy remains buyer-owned.",
      rationale: "Price is supportable at screen grade, subject to confirmatory diligence.",
    },
    evidenceRegister: [
      {
        id: "E-001",
        statement: "Audited financial statements and a management general ledger were supplied.",
        source: "seller_provided",
        confidence: "moderate",
        status: "provided",
        asOfDate: "2026-06-30",
        location: "Data room / Financials",
      },
      {
        id: "E-002",
        statement: "A top-ten customer schedule and selected customer contracts were supplied.",
        source: "seller_provided",
        confidence: "low",
        status: "provided",
        asOfDate: "2026-06-30",
        location: "Data room / Commercial",
      },
      {
        id: "E-003",
        statement: "Buyer and seller supplied management and transition context.",
        source: "buyer_provided",
        confidence: "moderate",
        status: "claimed",
        asOfDate: null,
        location: "Acquisition Lens intake",
      },
      {
        id: "CALC-UNDERWRITING",
        statement: "Deterministic underwriting calculations generated from the supplied inputs.",
        source: "calculated",
        confidence: "moderate",
        status: "verified",
        asOfDate: "2026-06-30",
        location: "Acquisition Lens underwriting engine",
      },
    ],
    authorityNote:
      "Deterministic underwriting and the Deal Screen govern price discipline, downside survivability, and decision posture. Mike Ye's acquisition judgment explains those outputs but cannot replace or override them.",
    limitations: [
      "This is a preliminary screen based only on supplied information and calculated outputs.",
      "No independent quality of earnings, legal diligence, tax diligence, customer calls, or technology audit has been completed.",
      "No buyer-specific synergy receives standalone valuation credit.",
    ],
  };
}
