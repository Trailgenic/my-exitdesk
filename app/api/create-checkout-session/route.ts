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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function POST(request: Request) {
  const body = await request.json() as {
    score?: number;
    weakest?: string;
    q1?: string;
    q2?: string;
    q3?: string;
    q4?: string;
    q5?: string;
    q6?: string;
    q7?: string;
    q8?: string;
    companyName?: string;
    companyDescription?: string;
    ref?: string;
  };

  const metadata: Record<string, string> = {};
  if (body.score !== undefined) metadata.score = String(body.score);
  if (body.weakest) metadata.weakest = body.weakest;
  if (body.q1) metadata.q1 = body.q1;
  if (body.q2) metadata.q2 = body.q2;
  if (body.q3) metadata.q3 = body.q3;
  if (body.q4) metadata.q4 = body.q4;
  if (body.q5) metadata.q5 = body.q5;
  if (body.q6) metadata.q6 = body.q6;
  if (body.q7) metadata.q7 = body.q7;
  if (body.q8) metadata.q8 = body.q8;
  if (body.companyName) metadata.companyName = body.companyName;
  if (body.companyDescription) {
    metadata.companyDescription = body.companyDescription;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: 500,
          product_data: {
            name: "Exit Readiness Report",
            description: "Buyer-lens exit readiness report for $1M–$20M business owners. Built from 25 years and $7.4B in M&A transactions — positioning memo, diligence map, AI exposure assessment, and pre-market action plan. Delivered within 24 hours.",
          },
        },
        quantity: 1,
      },
    ],
    metadata,
    client_reference_id: body.ref || undefined,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/exit/desk?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/exit/checkout`,
  });

  const origin = request.headers.get("origin");
  return NextResponse.json(
    { url: session.url },
    { headers: corsHeaders(origin) }
  );
}
