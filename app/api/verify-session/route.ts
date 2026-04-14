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
      { error: "session_id required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      sessionId
    );

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not confirmed" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const email = session.customer_details?.email ?? "";
    const metadata = session.metadata ?? {};

    return NextResponse.json(
      {
        verified: true,
        email,
        metadata: {
          score: metadata.score ?? null,
          weakest: metadata.weakest ?? null,
          q1: metadata.q1 ?? null,
          q2: metadata.q2 ?? null,
          q3: metadata.q3 ?? null,
          q4: metadata.q4 ?? null,
          q5: metadata.q5 ?? null,
          q6: metadata.q6 ?? null,
          q7: metadata.q7 ?? null,
          q8: metadata.q8 ?? null,
        },
      },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err}` },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
