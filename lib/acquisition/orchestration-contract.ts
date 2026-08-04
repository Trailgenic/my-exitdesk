import type { AcquisitionIntake } from "./contracts";
import type { DealScreenInput } from "./deal-screen";
import type {
  AcquisitionEvidenceRecord,
  AcquisitionReasoningReport,
} from "./reasoning-contract";
import type { AcquisitionUnderwritingInput } from "./underwriting";

export const ACQUISITION_ORCHESTRATION_VERSION = "1.0.0" as const;

/**
 * Facts used by the Deal Screen that are not owned by deterministic
 * underwriting. Calculated economics and identity fields are deliberately
 * excluded so the orchestration layer can supply one authoritative value.
 */
export interface AcquisitionDealScreenFacts {
  company: DealScreenInput["company"];
  financials: Pick<
    DealScreenInput["financials"],
    | "cash"
    | "debt"
    | "revenueTrend"
    | "marginTrend"
    | "balanceSheetAvailable"
    | "cashFlowStatementAvailable"
  >;
  ownership: DealScreenInput["ownership"];
  marketPosition: DealScreenInput["marketPosition"];
  valueCreation: Pick<
    DealScreenInput["valueCreation"],
    "turnaroundPotential" | "buyerSpecificSynergies"
  >;
  integrity: DealScreenInput["integrity"];
  evidence: DealScreenInput["evidence"];
}

export interface AcquisitionOrchestrationPayload {
  orchestrationVersion: typeof ACQUISITION_ORCHESTRATION_VERSION;
  reportId: string;
  intake: AcquisitionIntake;
  dealScreenFacts: AcquisitionDealScreenFacts;
  underwritingInput: AcquisitionUnderwritingInput;
  evidence: AcquisitionEvidenceRecord[];
}

export interface AcquisitionOrchestrationCommand {
  requestId: string;
  idempotencyKey: string;
  payload: AcquisitionOrchestrationPayload;
}

export type AcquisitionOrchestrationStage =
  | "validation"
  | "underwriting"
  | "deal_screen"
  | "reasoning";

export interface AcquisitionOrchestrationResult {
  orchestrationVersion: typeof ACQUISITION_ORCHESTRATION_VERSION;
  requestId: string;
  reportId: string;
  status: "completed";
  idempotency: "created" | "replayed";
  completedAt: string;
  report: AcquisitionReasoningReport;
}

export type AcquisitionApiErrorCode =
  | "unauthorized"
  | "service_unavailable"
  | "invalid_content_type"
  | "payload_too_large"
  | "invalid_json"
  | "invalid_request"
  | "idempotency_conflict"
  | "reasoning_unavailable"
  | "internal_error";

export interface AcquisitionApiErrorResponse {
  ok: false;
  requestId: string;
  error: {
    code: AcquisitionApiErrorCode;
    message: string;
  };
}

export interface AcquisitionApiSuccessResponse {
  ok: true;
  result: AcquisitionOrchestrationResult;
}
