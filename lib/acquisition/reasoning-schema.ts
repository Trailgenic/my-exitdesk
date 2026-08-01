import type { AcquisitionRiskDimension } from "./reasoning-contract";

const riskDimensions: AcquisitionRiskDimension[] = [
  "thesis_fit",
  "revenue_quality",
  "earnings_quality",
  "customer_concentration",
  "owner_dependence",
  "management_depth",
  "key_employee",
  "financial_cleanliness",
  "working_capital",
  "capital_expenditure",
  "legal_regulatory",
  "defensibility",
  "ai_exposure",
  "financing",
  "integration",
  "seller_motivation",
  "other",
];

const nonEmptyString = { type: "string", minLength: 1 };
const evidenceIds = {
  type: "array",
  minItems: 1,
  uniqueItems: true,
  items: nonEmptyString,
};

const assessment = {
  type: "object",
  additionalProperties: false,
  required: ["conclusion", "analysis", "implications", "evidenceIds"],
  properties: {
    conclusion: nonEmptyString,
    analysis: nonEmptyString,
    implications: nonEmptyString,
    evidenceIds,
  },
};

const finding = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "dimension",
    "title",
    "rating",
    "disposition",
    "evidenceIds",
    "implication",
    "requiredAction",
  ],
  properties: {
    id: nonEmptyString,
    dimension: { type: "string", enum: riskDimensions },
    title: nonEmptyString,
    rating: {
      type: "string",
      enum: ["high", "moderate", "low", "unknown"],
    },
    disposition: {
      type: "string",
      enum: ["investigate", "price", "protect", "walk"],
    },
    evidenceIds,
    implication: nonEmptyString,
    requiredAction: nonEmptyString,
  },
};

const diligencePriority = {
  type: "object",
  additionalProperties: false,
  required: [
    "rank",
    "area",
    "whyItMatters",
    "evidenceRequired",
    "decisionAffected",
    "evidenceIds",
  ],
  properties: {
    rank: { type: "integer", minimum: 1 },
    area: nonEmptyString,
    whyItMatters: nonEmptyString,
    evidenceRequired: nonEmptyString,
    decisionAffected: nonEmptyString,
    evidenceIds,
  },
};

const buyerAction = {
  type: "object",
  additionalProperties: false,
  required: ["item", "rationale", "evidenceIds"],
  properties: {
    item: nonEmptyString,
    rationale: nonEmptyString,
    evidenceIds,
  },
};

const uncertainty = {
  type: "object",
  additionalProperties: false,
  required: [
    "unknown",
    "decisionConsequence",
    "evidenceRequired",
    "evidenceIds",
  ],
  properties: {
    unknown: nonEmptyString,
    decisionConsequence: nonEmptyString,
    evidenceRequired: nonEmptyString,
    evidenceIds,
  },
};

const sellerQuestion = {
  type: "object",
  additionalProperties: false,
  required: [
    "rank",
    "question",
    "reason",
    "decisionAffected",
    "evidenceIds",
  ],
  properties: {
    rank: { type: "integer", minimum: 1 },
    question: nonEmptyString,
    reason: nonEmptyString,
    decisionAffected: nonEmptyString,
    evidenceIds,
  },
};

const assessmentNames = [
  "thesisAssessment",
  "buyerFitAssessment",
  "economicsInterpretation",
  "revenueQuality",
  "earningsQuality",
  "cashConversion",
  "ownerDependence",
  "managementDepth",
  "customerConcentration",
  "workingCapital",
  "capitalExpenditure",
  "aiExposure",
  "financing",
  "integration",
  "sellerMotivation",
] as const;

export const ACQUISITION_REASONING_DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "investmentCommitteeSnapshot",
    "decisionInterpretation",
    ...assessmentNames,
    "findings",
    "diligencePressureMap",
    "actionMap",
    "walkAwayConditions",
    "uncertaintySurface",
    "rankedSellerQuestions",
    "nextDecision",
    "limitations",
  ],
  properties: {
    investmentCommitteeSnapshot: {
      type: "object",
      additionalProperties: false,
      required: [
        "headline",
        "transactionFrame",
        "definingOpportunity",
        "definingUncertainty",
        "reliancePosture",
      ],
      properties: {
        headline: nonEmptyString,
        transactionFrame: nonEmptyString,
        definingOpportunity: nonEmptyString,
        definingUncertainty: nonEmptyString,
        reliancePosture: {
          type: "string",
          enum: ["screen_grade", "diligence_grade", "senior_review_ready"],
        },
      },
    },
    decisionInterpretation: nonEmptyString,
    ...Object.fromEntries(assessmentNames.map((name) => [name, assessment])),
    findings: { type: "array", items: finding },
    diligencePressureMap: {
      type: "array",
      minItems: 1,
      items: diligencePriority,
    },
    actionMap: {
      type: "object",
      additionalProperties: false,
      required: ["investigate", "price", "protect"],
      properties: {
        investigate: { type: "array", items: buyerAction },
        price: { type: "array", items: buyerAction },
        protect: { type: "array", items: buyerAction },
      },
    },
    walkAwayConditions: { type: "array", items: buyerAction },
    uncertaintySurface: { type: "array", items: uncertainty },
    rankedSellerQuestions: {
      type: "array",
      minItems: 1,
      items: sellerQuestion,
    },
    nextDecision: {
      type: "object",
      additionalProperties: false,
      required: ["commitment", "evidenceGate", "stopCondition"],
      properties: {
        commitment: nonEmptyString,
        evidenceGate: nonEmptyString,
        stopCondition: nonEmptyString,
      },
    },
    limitations: { type: "array", items: nonEmptyString },
  },
};
