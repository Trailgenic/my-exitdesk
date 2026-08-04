import type { DealScreenInput } from "./deal-screen";
import { screenAcquisitionDeal } from "./deal-screen";
import type { AcquisitionIdempotencyStore } from "./idempotency";
import {
  fingerprintAcquisitionPayload,
  InMemoryAcquisitionIdempotencyStore,
} from "./idempotency";
import type {
  AcquisitionOrchestrationCommand,
  AcquisitionOrchestrationPayload,
  AcquisitionOrchestrationResult,
  AcquisitionOrchestrationStage,
} from "./orchestration-contract";
import { ACQUISITION_ORCHESTRATION_VERSION } from "./orchestration-contract";
import type { AcquisitionReasoningEngine } from "./reasoning-engine";
import { ACQUISITION_REASONING_VERSION } from "./reasoning-contract";
import { underwriteAcquisition } from "./underwriting";
import type { AcquisitionUnderwritingResult } from "./underwriting";
import {
  AcquisitionOrchestrationValidationError,
  parseAcquisitionOrchestrationPayload,
  validateAcquisitionCommandIdentity,
} from "./orchestration-validator";

export class AcquisitionOrchestrationStageError extends Error {
  constructor(
    readonly stage: AcquisitionOrchestrationStage,
    readonly cause: unknown,
  ) {
    super(`Acquisition orchestration failed during ${stage}.`);
    this.name = "AcquisitionOrchestrationStageError";
  }
}

export interface CoreOrchestrationResult {
  reportId: string;
  completedAt: string;
  report: AcquisitionOrchestrationResult["report"];
}

export interface AcquisitionOrchestratorOptions {
  reasoningEngine: AcquisitionReasoningEngine;
  idempotencyStore?: AcquisitionIdempotencyStore<CoreOrchestrationResult>;
  now?: () => Date;
}

export interface AcquisitionOrchestrator {
  run(
    command: AcquisitionOrchestrationCommand,
  ): Promise<AcquisitionOrchestrationResult>;
}

export function buildAuthoritativeDealScreenInput(
  payload: AcquisitionOrchestrationPayload,
  underwriting: AcquisitionUnderwritingResult,
): DealScreenInput {
  const { intake, dealScreenFacts, underwritingInput } = payload;
  return {
    targetName: intake.target.companyName,
    segment: intake.segment,
    buyerType: intake.buyer.buyerType,
    company: { ...dealScreenFacts.company },
    financials: {
      annualRevenue: underwritingInput.operating.annualRevenue,
      reportedEbitda: underwritingInput.operating.reportedEbitda,
      reportedSde: underwritingInput.operating.reportedSde,
      freeCashFlow:
        underwritingInput.operating.reportedUnleveredFreeCashFlow,
      cash: dealScreenFacts.financials.cash,
      debt: dealScreenFacts.financials.debt,
      askingPrice: intake.proposedTerms.askingPrice,
      standaloneValueLow: underwriting.standaloneEnterpriseValueRange.low,
      standaloneValueHigh: underwriting.standaloneEnterpriseValueRange.high,
      hardCeiling:
        underwritingInput.valuation.hardCeilingEnterpriseValue,
      revenueTrend: dealScreenFacts.financials.revenueTrend,
      marginTrend: dealScreenFacts.financials.marginTrend,
      balanceSheetAvailable:
        dealScreenFacts.financials.balanceSheetAvailable,
      cashFlowStatementAvailable:
        dealScreenFacts.financials.cashFlowStatementAvailable,
    },
    ownership: { ...dealScreenFacts.ownership },
    marketPosition: { ...dealScreenFacts.marketPosition },
    valueCreation: {
      ...dealScreenFacts.valueCreation,
      worstCaseSurvivable: underwriting.worstCaseSurvivable,
    },
    integrity: { ...dealScreenFacts.integrity },
    evidence: { ...dealScreenFacts.evidence },
  };
}

export function createAcquisitionOrchestrator({
  reasoningEngine,
  idempotencyStore = new InMemoryAcquisitionIdempotencyStore<CoreOrchestrationResult>(
    25,
  ),
  now = () => new Date(),
}: AcquisitionOrchestratorOptions): AcquisitionOrchestrator {
  return {
    async run(command) {
      validateAcquisitionCommandIdentity(
        command.requestId,
        command.idempotencyKey,
      );
      const payload = parseAcquisitionOrchestrationPayload(command.payload);
      const fingerprint = fingerprintAcquisitionPayload(payload);
      const execution = await idempotencyStore.execute(
        command.idempotencyKey,
        fingerprint,
        async () => {
          let underwriting: AcquisitionUnderwritingResult;
          try {
            underwriting = underwriteAcquisition(payload.underwritingInput);
          } catch (error) {
            throw new AcquisitionOrchestrationValidationError(
              error instanceof Error
                ? `Invalid underwriting input: ${error.message}`
                : "Invalid underwriting input.",
            );
          }

          const dealScreenInput = buildAuthoritativeDealScreenInput(
            payload,
            underwriting,
          );
          let dealScreen;
          try {
            dealScreen = screenAcquisitionDeal(dealScreenInput);
          } catch (error) {
            throw new AcquisitionOrchestrationStageError(
              "deal_screen",
              error,
            );
          }

          const generatedAt = now().toISOString();
          let report;
          try {
            report = await reasoningEngine.generate({
              reasoningVersion: ACQUISITION_REASONING_VERSION,
              reportId: payload.reportId,
              generatedAt,
              intake: payload.intake,
              dealScreen,
              underwriting,
              evidence: payload.evidence,
            });
          } catch (error) {
            throw new AcquisitionOrchestrationStageError("reasoning", error);
          }

          return {
            reportId: payload.reportId,
            completedAt: now().toISOString(),
            report,
          };
        },
      );

      return {
        orchestrationVersion: ACQUISITION_ORCHESTRATION_VERSION,
        requestId: command.requestId,
        reportId: execution.value.reportId,
        status: "completed",
        idempotency: execution.replayed ? "replayed" : "created",
        completedAt: execution.value.completedAt,
        report: execution.value.report,
      };
    },
  };
}
