import type { AcquisitionCommerceStore } from "./commerce";
import { AcquisitionPaymentRequiredError } from "./commerce";
import type {
  AcquisitionOrchestrationCommand,
  AcquisitionOrchestrationResult,
} from "./orchestration-contract";
import type { AcquisitionOrchestrator } from "./orchestration";
import { AcquisitionOrchestrationValidationError } from "./orchestration-validator";

export interface AcquisitionProductionOrchestratorOptions {
  orchestrator: AcquisitionOrchestrator;
  commerceStore: AcquisitionCommerceStore;
  now?: () => Date;
}

/**
 * Payment and lifecycle guard around the authoritative Step 5 pipeline. It
 * cannot alter deterministic underwriting or Ella's evidence packet.
 */
export function createProductionAcquisitionOrchestrator({
  orchestrator,
  commerceStore,
  now = () => new Date(),
}: AcquisitionProductionOrchestratorOptions): AcquisitionOrchestrator {
  return {
    async run(command: AcquisitionOrchestrationCommand) {
      const orderId = command.orderId?.trim();
      if (!orderId) throw new AcquisitionPaymentRequiredError();
      const reportId = command.payload.reportId;
      await commerceStore.claimEntitlement({
        orderId,
        reportId,
        idempotencyKey: command.idempotencyKey,
        now: now().toISOString(),
      });

      let result: AcquisitionOrchestrationResult;
      try {
        result = await orchestrator.run(command);
      } catch (error) {
        if (error instanceof AcquisitionOrchestrationValidationError) {
          await commerceStore.releaseEntitlementClaim({
            orderId,
            idempotencyKey: command.idempotencyKey,
            now: now().toISOString(),
          });
        } else {
          await commerceStore.markGenerationFailed({
            orderId,
            reportId,
            now: now().toISOString(),
          });
        }
        throw error;
      }

      await commerceStore.saveCompletedReport({
        orderId,
        reportId,
        report: result.report,
        now: result.completedAt,
      });
      return result;
    },
  };
}
