import { handleAcquisitionReadinessRequest } from "@/lib/acquisition/deployment-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleAcquisitionReadinessRequest(request);
}
