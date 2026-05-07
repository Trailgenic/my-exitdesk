import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const ALLOWED_ORIGINS = [
  "https://www.mikeye.com",
  "https://mikeye.com",
  "https://mikeye.webflow.io",
];

function corsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "")
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowed ?? ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json(
      {
        tier: session.metadata?.tier ?? null,
        price_paid: session.metadata?.price_paid
          ? Number(session.metadata.price_paid)
          : null,
        email: session.customer_details?.email ?? null,
        transaction_id: session.id,
      },
      { headers: corsHeaders(origin) }
    );
  } catch {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }
}
