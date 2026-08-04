import { handleAcquisitionApiRequest } from "@/lib/acquisition/http";
import { getAcquisitionProductionRuntime } from "@/lib/acquisition/production-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  let runtime;
  try {
    runtime = getAcquisitionProductionRuntime();
  } catch {
    return handleAcquisitionApiRequest(request, {
      apiSecret: process.env.ACQUISITION_API_SECRET,
      getOrchestrator: () => {
        throw new Error("Acquisition Lens is not configured.");
      },
    });
  }
  return handleAcquisitionApiRequest(request, {
    apiSecret: process.env.ACQUISITION_API_SECRET,
    getOrchestrator: () => runtime.orchestrator,
    rateLimiter: runtime.rateLimiter,
  });
}
