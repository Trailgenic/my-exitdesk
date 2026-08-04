import { createAnthropicAcquisitionReasoningModel } from "@/lib/acquisition/anthropic-reasoning-client";
import { handleAcquisitionApiRequest } from "@/lib/acquisition/http";
import type { AcquisitionOrchestrator } from "@/lib/acquisition/orchestration";
import { createAcquisitionOrchestrator } from "@/lib/acquisition/orchestration";
import { createAcquisitionReasoningEngine } from "@/lib/acquisition/reasoning-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

let liveOrchestrator: AcquisitionOrchestrator | undefined;

function getLiveOrchestrator() {
  if (!liveOrchestrator) {
    liveOrchestrator = createAcquisitionOrchestrator({
      reasoningEngine: createAcquisitionReasoningEngine({
        model: createAnthropicAcquisitionReasoningModel(),
      }),
    });
  }
  return liveOrchestrator;
}

export async function POST(request: Request) {
  return handleAcquisitionApiRequest(request, {
    apiSecret: process.env.ACQUISITION_API_SECRET,
    getOrchestrator: getLiveOrchestrator,
  });
}
