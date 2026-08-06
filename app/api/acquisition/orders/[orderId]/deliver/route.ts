import { handleAcquisitionDeliveryRequest } from "@/lib/acquisition/delivery-http";
import { isAuthorizedAcquisitionRequest } from "@/lib/acquisition/http";
import { getAcquisitionProductionRuntime } from "@/lib/acquisition/production-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface DeliveryRouteContext {
  params: { orderId: string };
}

export async function POST(request: Request, context: DeliveryRouteContext) {
  let production;
  try {
    production = getAcquisitionProductionRuntime();
  } catch {
    const apiSecret = process.env.ACQUISITION_API_SECRET;
    const authorized = Boolean(
      apiSecret &&
        apiSecret.length >= 32 &&
        isAuthorizedAcquisitionRequest(
          request.headers.get("authorization"),
          apiSecret,
        ),
    );
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: authorized ? "service_unavailable" : "unauthorized",
          message: authorized
            ? "Acquisition Lens delivery is not configured."
            : "Authentication is required.",
        },
      }),
      {
        status: authorized ? 503 : 401,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  return handleAcquisitionDeliveryRequest(request, context.params.orderId, {
    apiSecret: process.env.ACQUISITION_API_SECRET,
    deliveryService: production.deliveryService,
    rateLimiter: production.rateLimiter,
  });
}
