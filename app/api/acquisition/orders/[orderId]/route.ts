import { handleAcquisitionOrderRequest } from "@/lib/acquisition/commerce-http";
import { isAuthorizedAcquisitionRequest } from "@/lib/acquisition/http";
import { getAcquisitionProductionRuntime } from "@/lib/acquisition/production-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OrderRouteContext {
  params: { orderId: string };
}

export async function GET(request: Request, context: OrderRouteContext) {
  return handle(request, context);
}

export async function DELETE(request: Request, context: OrderRouteContext) {
  return handle(request, context);
}

async function handle(request: Request, context: OrderRouteContext) {
  let production;
  try {
    production = getAcquisitionProductionRuntime();
  } catch {
    const apiSecret = process.env.ACQUISITION_API_SECRET;
    if (
      apiSecret &&
      apiSecret.length >= 32 &&
      !isAuthorizedAcquisitionRequest(
        request.headers.get("authorization"),
        apiSecret,
      )
    ) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: "unauthorized", message: "Authentication is required." },
        }),
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "service_unavailable",
          message: "Acquisition Lens is not configured.",
        },
      }),
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  return handleAcquisitionOrderRequest(request, context.params.orderId, {
    apiSecret: process.env.ACQUISITION_API_SECRET,
    commerceStore: production.commerceStore,
  });
}
