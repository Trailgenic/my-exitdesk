import { handleAcquisitionWebhookRequest } from "@/lib/acquisition/commerce-http";
import { getAcquisitionProductionRuntime } from "@/lib/acquisition/production-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return handleAcquisitionWebhookRequest(request, {
      paymentService: getAcquisitionProductionRuntime().paymentService,
    });
  } catch {
    return new Response(JSON.stringify({ received: false }), {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
