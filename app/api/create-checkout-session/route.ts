import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: 49900,
          product_data: {
            name: "Exit Readiness Report",
            description: "Buyer-lens exit readiness analysis — delivered to your inbox.",
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

  return NextResponse.json({ url: session.url });
}
