import { ACQUISITION_DOCTRINE_AUTHORITY_NOTE } from "./doctrine";
import type { AcquisitionReasoningConfig } from "./reasoning-config";
import { getAcquisitionReasoningConfig } from "./reasoning-config";
import type {
  AcquisitionEvidenceRecord,
  AcquisitionReasoningModel,
  AcquisitionReasoningReport,
  AcquisitionReasoningRequest,
  GoverningDecision,
} from "./reasoning-contract";
import { ACQUISITION_REASONING_TOOL_NAME } from "./reasoning-contract";
import {
  buildAcquisitionReasoningSystemPrompt,
  buildAcquisitionReasoningUserPrompt,
} from "./reasoning-prompt";
import { ACQUISITION_REASONING_DRAFT_SCHEMA } from "./reasoning-schema";
import {
  getAllowedAcquisitionEvidenceIds,
  validateAcquisitionReasoningDraft,
  validateAcquisitionReasoningRequest,
} from "./reasoning-validator";

const HARD_UNDERWRITING_TRIGGER_CODES = new Set([
  "offer_above_hard_ceiling",
  "worst_case_not_survivable",
]);

function unique(values: string[]) {
  return [...new Set(values)];
}

export function resolveAcquisitionGoverningDecision(
  request: AcquisitionReasoningRequest,
): GoverningDecision {
  const triggerCodes = new Set(
    request.underwriting.decisionTriggers.map(({ code }) => code),
  );
  const directHardSignals: string[] = [];
  const offer =
    request.underwriting.dealScreenBridge.offerEnterpriseValue?.amount;
  const hardCeiling = request.underwriting.dealScreenBridge.hardCeiling?.amount;
  if (
    offer !== undefined &&
    hardCeiling !== undefined &&
    offer > hardCeiling &&
    !triggerCodes.has("offer_above_hard_ceiling")
  ) {
    directHardSignals.push(
      "The offer enterprise value exceeds the buyer's private hard ceiling.",
    );
  }
  if (
    request.underwriting.worstCaseSurvivable === false &&
    !triggerCodes.has("worst_case_not_survivable")
  ) {
    directHardSignals.push(
      "The transaction does not survive the deterministic worst-case scenario.",
    );
  }

  const hardUnderwritingTriggers = request.underwriting.decisionTriggers.filter(
    ({ code }) => HARD_UNDERWRITING_TRIGGER_CODES.has(code),
  );
  const softUnderwritingTriggers = request.underwriting.decisionTriggers.filter(
    ({ code }) => !HARD_UNDERWRITING_TRIGGER_CODES.has(code),
  );
  const hardVetoes = unique([
    ...request.dealScreen.hardStops.map(({ message }) => message),
    ...hardUnderwritingTriggers.map(({ message }) => message),
    ...directHardSignals,
  ]);

  return {
    posture: hardVetoes.length > 0 ? "pass" : request.dealScreen.posture,
    confidence: request.dealScreen.confidence,
    coreReason:
      hardVetoes.length > 0
        ? "A deterministic hard stop overrides the remaining positive attributes."
        : request.dealScreen.rationale,
    conditionsToAdvance: unique([
      ...request.dealScreen.conditionsToAdvance.map(({ message }) => message),
      ...request.underwriting.calculationChecks.map(({ message }) => message),
      ...softUnderwritingTriggers.map(({ message }) => message),
    ]),
    hardVetoes,
    compoundingRisks: unique(
      request.dealScreen.concerns.map(({ message }) => message),
    ),
  };
}

function createSyntheticEvidence(
  request: AcquisitionReasoningRequest,
): AcquisitionEvidenceRecord[] {
  return [
    {
      id: "buyer-intake",
      statement:
        "Buyer profile, target profile, proposed terms, questions, and context supplied in the Acquisition Lens intake.",
      source: "buyer_provided",
      confidence: "unknown",
      status: "provided",
      asOfDate: request.generatedAt,
      location: "Acquisition Lens intake",
    },
    {
      id: "deal-screen",
      statement:
        "Deterministic Deal Screen result, including posture, confidence, hard stops, conditions, and missing information.",
      source: "calculated",
      confidence: request.dealScreen.confidence,
      status: "verified",
      asOfDate: request.generatedAt,
      location: "Acquisition Lens deterministic Deal Screen",
    },
    {
      id: "underwriting",
      statement:
        "Deterministic underwriting result, including normalized earnings, value ranges, capital stack, returns, and downside scenarios.",
      source: "calculated",
      confidence: request.dealScreen.confidence,
      status: "verified",
      asOfDate: request.underwriting.asOfDate,
      location: "Acquisition Lens deterministic underwriting",
    },
  ];
}

export interface AcquisitionReasoningEngineOptions {
  model: AcquisitionReasoningModel;
  config?: AcquisitionReasoningConfig;
}

export interface AcquisitionReasoningEngine {
  generate(
    request: AcquisitionReasoningRequest,
  ): Promise<AcquisitionReasoningReport>;
}

export function createAcquisitionReasoningEngine({
  model,
  config = getAcquisitionReasoningConfig(),
}: AcquisitionReasoningEngineOptions): AcquisitionReasoningEngine {
  return {
    async generate(request) {
      validateAcquisitionReasoningRequest(request);
      const governingDecision = resolveAcquisitionGoverningDecision(request);
      const rawDraft = await model.generateStructured({
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        systemPrompt: buildAcquisitionReasoningSystemPrompt(
          request.intake.segment,
        ),
        userPrompt: buildAcquisitionReasoningUserPrompt(
          request,
          governingDecision,
        ),
        toolName: ACQUISITION_REASONING_TOOL_NAME,
        toolSchema: ACQUISITION_REASONING_DRAFT_SCHEMA,
      });
      const draft = validateAcquisitionReasoningDraft(
        rawDraft,
        getAllowedAcquisitionEvidenceIds(request),
      );

      return {
        reasoningVersion: request.reasoningVersion,
        contractVersion: request.intake.contractVersion,
        reportId: request.reportId,
        generatedAt: request.generatedAt,
        targetName: request.intake.target.companyName,
        segment: request.intake.segment,
        stage: request.intake.stage,
        investmentCommitteeSnapshot: {
          ...draft.investmentCommitteeSnapshot,
          recommendation: governingDecision.posture,
          confidence: governingDecision.confidence,
        },
        decision: governingDecision,
        decisionInterpretation: draft.decisionInterpretation,
        thesisAssessment: draft.thesisAssessment,
        buyerFitAssessment: draft.buyerFitAssessment,
        dealEconomics: {
          interpretation: draft.economicsInterpretation,
          deterministicUnderwriting: request.underwriting,
        },
        underwritingAssessment: {
          revenueQuality: draft.revenueQuality,
          earningsQuality: draft.earningsQuality,
          cashConversion: draft.cashConversion,
          ownerDependence: draft.ownerDependence,
          managementDepth: draft.managementDepth,
          customerConcentration: draft.customerConcentration,
          workingCapital: draft.workingCapital,
          capitalExpenditure: draft.capitalExpenditure,
          aiExposure: draft.aiExposure,
          financing: draft.financing,
          integration: draft.integration,
          sellerMotivation: draft.sellerMotivation,
        },
        findings: draft.findings,
        diligencePressureMap: draft.diligencePressureMap,
        actionMap: draft.actionMap,
        walkAwayConditions: draft.walkAwayConditions,
        uncertaintySurface: draft.uncertaintySurface,
        rankedSellerQuestions: draft.rankedSellerQuestions,
        nextDecision: draft.nextDecision,
        deterministicDealScreen: request.dealScreen,
        evidenceRegister: [
          ...createSyntheticEvidence(request),
          ...request.evidence,
        ],
        authorityNote: ACQUISITION_DOCTRINE_AUTHORITY_NOTE,
        limitations: draft.limitations,
      };
    },
  };
}
