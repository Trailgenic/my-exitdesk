import type {
  AcquisitionEvidenceRecord,
  AcquisitionReasoningDraft,
  AcquisitionReasoningRequest,
  AcquisitionRiskDimension,
  BuyerActionDraft,
  DiligencePriorityDraft,
  InvestmentCommitteeSnapshotDraft,
  NextDecisionDraft,
  ReasonedAssessment,
  ReasoningFindingDraft,
  SellerQuestionDraft,
  UncertaintyItemDraft,
} from "./reasoning-contract";
import { ACQUISITION_REASONING_VERSION } from "./reasoning-contract";

export class AcquisitionReasoningValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionReasoningValidationError";
  }
}

const RESERVED_EVIDENCE_IDS = [
  "buyer-intake",
  "deal-screen",
  "underwriting",
] as const;

const dimensions: AcquisitionRiskDimension[] = [
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

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AcquisitionReasoningValidationError(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
) {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new AcquisitionReasoningValidationError(
      `${path} contains unsupported fields: ${extras.join(", ")}.`,
    );
  }
  const missing = allowed.filter((key) => !(key in value));
  if (missing.length > 0) {
    throw new AcquisitionReasoningValidationError(
      `${path} is missing required fields: ${missing.join(", ")}.`,
    );
  }
}

function string(value: unknown, path: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AcquisitionReasoningValidationError(
      `${path} must be a non-empty string.`,
    );
  }
  return value;
}

function stringArray(value: unknown, path: string, minimum = 0) {
  if (!Array.isArray(value) || value.length < minimum) {
    throw new AcquisitionReasoningValidationError(
      `${path} must contain at least ${minimum} item(s).`,
    );
  }
  return value.map((item, index) => string(item, `${path}[${index}]`));
}

function positiveInteger(value: unknown, path: string) {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new AcquisitionReasoningValidationError(
      `${path} must be a positive integer.`,
    );
  }
  return value as number;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new AcquisitionReasoningValidationError(
      `${path} must be one of: ${allowed.join(", ")}.`,
    );
  }
  return value as T;
}

function evidenceReferences(
  value: unknown,
  path: string,
  allowedEvidenceIds: ReadonlySet<string>,
) {
  const ids = stringArray(value, path, 1);
  if (new Set(ids).size !== ids.length) {
    throw new AcquisitionReasoningValidationError(
      `${path} contains duplicate evidence IDs.`,
    );
  }
  const unknown = ids.filter((id) => !allowedEvidenceIds.has(id));
  if (unknown.length > 0) {
    throw new AcquisitionReasoningValidationError(
      `${path} cites unknown evidence IDs: ${unknown.join(", ")}.`,
    );
  }
  return ids;
}

function assessment(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): ReasonedAssessment {
  const item = record(value, path);
  exactKeys(item, ["conclusion", "analysis", "implications", "evidenceIds"], path);
  return {
    conclusion: string(item.conclusion, `${path}.conclusion`),
    analysis: string(item.analysis, `${path}.analysis`),
    implications: string(item.implications, `${path}.implications`),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
  };
}

function snapshot(value: unknown): InvestmentCommitteeSnapshotDraft {
  const item = record(value, "investmentCommitteeSnapshot");
  exactKeys(
    item,
    [
      "headline",
      "transactionFrame",
      "definingOpportunity",
      "definingUncertainty",
      "reliancePosture",
    ],
    "investmentCommitteeSnapshot",
  );
  return {
    headline: string(item.headline, "investmentCommitteeSnapshot.headline"),
    transactionFrame: string(
      item.transactionFrame,
      "investmentCommitteeSnapshot.transactionFrame",
    ),
    definingOpportunity: string(
      item.definingOpportunity,
      "investmentCommitteeSnapshot.definingOpportunity",
    ),
    definingUncertainty: string(
      item.definingUncertainty,
      "investmentCommitteeSnapshot.definingUncertainty",
    ),
    reliancePosture: oneOf(
      item.reliancePosture,
      ["screen_grade", "diligence_grade", "senior_review_ready"],
      "investmentCommitteeSnapshot.reliancePosture",
    ),
  };
}

function finding(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): ReasoningFindingDraft {
  const item = record(value, path);
  exactKeys(
    item,
    [
      "id",
      "dimension",
      "title",
      "rating",
      "disposition",
      "evidenceIds",
      "implication",
      "requiredAction",
    ],
    path,
  );
  return {
    id: string(item.id, `${path}.id`),
    dimension: oneOf(item.dimension, dimensions, `${path}.dimension`),
    title: string(item.title, `${path}.title`),
    rating: oneOf(
      item.rating,
      ["high", "moderate", "low", "unknown"],
      `${path}.rating`,
    ),
    disposition: oneOf(
      item.disposition,
      ["investigate", "price", "protect", "walk"],
      `${path}.disposition`,
    ),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
    implication: string(item.implication, `${path}.implication`),
    requiredAction: string(item.requiredAction, `${path}.requiredAction`),
  };
}

function diligence(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): DiligencePriorityDraft {
  const item = record(value, path);
  exactKeys(
    item,
    [
      "rank",
      "area",
      "whyItMatters",
      "evidenceRequired",
      "decisionAffected",
      "evidenceIds",
    ],
    path,
  );
  return {
    rank: positiveInteger(item.rank, `${path}.rank`),
    area: string(item.area, `${path}.area`),
    whyItMatters: string(item.whyItMatters, `${path}.whyItMatters`),
    evidenceRequired: string(
      item.evidenceRequired,
      `${path}.evidenceRequired`,
    ),
    decisionAffected: string(
      item.decisionAffected,
      `${path}.decisionAffected`,
    ),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
  };
}

function action(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): BuyerActionDraft {
  const item = record(value, path);
  exactKeys(item, ["item", "rationale", "evidenceIds"], path);
  return {
    item: string(item.item, `${path}.item`),
    rationale: string(item.rationale, `${path}.rationale`),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
  };
}

function uncertainty(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): UncertaintyItemDraft {
  const item = record(value, path);
  exactKeys(
    item,
    ["unknown", "decisionConsequence", "evidenceRequired", "evidenceIds"],
    path,
  );
  return {
    unknown: string(item.unknown, `${path}.unknown`),
    decisionConsequence: string(
      item.decisionConsequence,
      `${path}.decisionConsequence`,
    ),
    evidenceRequired: string(
      item.evidenceRequired,
      `${path}.evidenceRequired`,
    ),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
  };
}

function sellerQuestion(
  value: unknown,
  path: string,
  ids: ReadonlySet<string>,
): SellerQuestionDraft {
  const item = record(value, path);
  exactKeys(
    item,
    ["rank", "question", "reason", "decisionAffected", "evidenceIds"],
    path,
  );
  return {
    rank: positiveInteger(item.rank, `${path}.rank`),
    question: string(item.question, `${path}.question`),
    reason: string(item.reason, `${path}.reason`),
    decisionAffected: string(
      item.decisionAffected,
      `${path}.decisionAffected`,
    ),
    evidenceIds: evidenceReferences(item.evidenceIds, `${path}.evidenceIds`, ids),
  };
}

function nextDecision(value: unknown): NextDecisionDraft {
  const item = record(value, "nextDecision");
  exactKeys(item, ["commitment", "evidenceGate", "stopCondition"], "nextDecision");
  return {
    commitment: string(item.commitment, "nextDecision.commitment"),
    evidenceGate: string(item.evidenceGate, "nextDecision.evidenceGate"),
    stopCondition: string(item.stopCondition, "nextDecision.stopCondition"),
  };
}

function validateRankSequence(
  items: Array<{ rank: number }>,
  path: string,
) {
  items.forEach((item, index) => {
    if (item.rank !== index + 1) {
      throw new AcquisitionReasoningValidationError(
        `${path} must be ordered with contiguous ranks starting at 1.`,
      );
    }
  });
}

function validateEvidenceRecord(item: AcquisitionEvidenceRecord, index: number) {
  const path = `evidence[${index}]`;
  string(item.id, `${path}.id`);
  string(item.statement, `${path}.statement`);
  if (item.asOfDate !== null) string(item.asOfDate, `${path}.asOfDate`);
  if (item.location !== null) string(item.location, `${path}.location`);
}

export function validateAcquisitionReasoningRequest(
  request: AcquisitionReasoningRequest,
) {
  if (request.reasoningVersion !== ACQUISITION_REASONING_VERSION) {
    throw new AcquisitionReasoningValidationError(
      `Unsupported reasoning version: ${request.reasoningVersion}.`,
    );
  }
  string(request.reportId, "reportId");
  string(request.generatedAt, "generatedAt");

  const targetNames = [
    request.intake.target.companyName,
    request.dealScreen.targetName,
    request.underwriting.targetName,
  ];
  if (new Set(targetNames).size !== 1) {
    throw new AcquisitionReasoningValidationError(
      "Intake, Deal Screen, and underwriting target names must match exactly.",
    );
  }

  if (
    request.underwriting.dealScreenBridge.worstCaseSurvivable !==
    request.underwriting.worstCaseSurvivable
  ) {
    throw new AcquisitionReasoningValidationError(
      "Underwriting worst-case survivability must match its Deal Screen bridge.",
    );
  }

  const seen = new Set<string>();
  request.evidence.forEach((item, index) => {
    validateEvidenceRecord(item, index);
    if ((RESERVED_EVIDENCE_IDS as readonly string[]).includes(item.id)) {
      throw new AcquisitionReasoningValidationError(
        `Evidence ID ${item.id} is reserved.`,
      );
    }
    if (seen.has(item.id)) {
      throw new AcquisitionReasoningValidationError(
        `Evidence ID ${item.id} is duplicated.`,
      );
    }
    seen.add(item.id);
  });
}

export function validateAcquisitionReasoningDraft(
  value: unknown,
  allowedEvidenceIds: ReadonlySet<string>,
): AcquisitionReasoningDraft {
  const draft = record(value, "reasoningDraft");
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
  const rootKeys = [
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
  ] as const;
  exactKeys(draft, rootKeys, "reasoningDraft");

  const findings = Array.isArray(draft.findings)
    ? draft.findings.map((item, index) =>
        finding(item, `findings[${index}]`, allowedEvidenceIds),
      )
    : (() => {
        throw new AcquisitionReasoningValidationError("findings must be an array.");
      })();
  if (new Set(findings.map(({ id }) => id)).size !== findings.length) {
    throw new AcquisitionReasoningValidationError("Finding IDs must be unique.");
  }

  if (!Array.isArray(draft.diligencePressureMap) || draft.diligencePressureMap.length === 0) {
    throw new AcquisitionReasoningValidationError(
      "diligencePressureMap must contain at least one item.",
    );
  }
  const diligencePressureMap = draft.diligencePressureMap.map((item, index) =>
    diligence(item, `diligencePressureMap[${index}]`, allowedEvidenceIds),
  );
  validateRankSequence(diligencePressureMap, "diligencePressureMap");

  const actionMapRecord = record(draft.actionMap, "actionMap");
  exactKeys(actionMapRecord, ["investigate", "price", "protect"], "actionMap");
  const actions = (name: "investigate" | "price" | "protect") => {
    const values = actionMapRecord[name];
    if (!Array.isArray(values)) {
      throw new AcquisitionReasoningValidationError(
        `actionMap.${name} must be an array.`,
      );
    }
    return values.map((item, index) =>
      action(item, `actionMap.${name}[${index}]`, allowedEvidenceIds),
    );
  };

  const validateArray = <T>(
    value: unknown,
    path: string,
    validator: (item: unknown, path: string, ids: ReadonlySet<string>) => T,
  ) => {
    if (!Array.isArray(value)) {
      throw new AcquisitionReasoningValidationError(`${path} must be an array.`);
    }
    return value.map((item, index) =>
      validator(item, `${path}[${index}]`, allowedEvidenceIds),
    );
  };

  const rankedSellerQuestions = validateArray(
    draft.rankedSellerQuestions,
    "rankedSellerQuestions",
    sellerQuestion,
  );
  if (rankedSellerQuestions.length === 0) {
    throw new AcquisitionReasoningValidationError(
      "rankedSellerQuestions must contain at least one item.",
    );
  }
  validateRankSequence(rankedSellerQuestions, "rankedSellerQuestions");

  const assessments = Object.fromEntries(
    assessmentNames.map((name) => [
      name,
      assessment(draft[name], name, allowedEvidenceIds),
    ]),
  ) as Record<(typeof assessmentNames)[number], ReasonedAssessment>;

  return {
    investmentCommitteeSnapshot: snapshot(
      draft.investmentCommitteeSnapshot,
    ),
    decisionInterpretation: string(
      draft.decisionInterpretation,
      "decisionInterpretation",
    ),
    ...assessments,
    findings,
    diligencePressureMap,
    actionMap: {
      investigate: actions("investigate"),
      price: actions("price"),
      protect: actions("protect"),
    },
    walkAwayConditions: validateArray(
      draft.walkAwayConditions,
      "walkAwayConditions",
      action,
    ),
    uncertaintySurface: validateArray(
      draft.uncertaintySurface,
      "uncertaintySurface",
      uncertainty,
    ),
    rankedSellerQuestions,
    nextDecision: nextDecision(draft.nextDecision),
    limitations: stringArray(draft.limitations, "limitations"),
  };
}

export function getAllowedAcquisitionEvidenceIds(
  request: AcquisitionReasoningRequest,
) {
  return new Set<string>([
    ...RESERVED_EVIDENCE_IDS,
    ...request.evidence.map(({ id }) => id),
  ]);
}
