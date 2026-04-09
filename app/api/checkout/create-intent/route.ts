import { NextResponse } from "next/server";
import { PRICE, stripe } from "../../../../lib/stripe";

export async function POST(request: Request) {
  const body = (await request.json()) as { intake_id?: string; email?: string };

  if (!body.intake_id || !body.email) {
    return NextResponse.json(
      { error: "intake_id and email are required" },
      { status: 400 }
    );
  }

  const intent = await stripe.paymentIntents.create({
    amount: PRICE,
    currency: "usd",
    receipt_email: body.email,
    metadata: {
      intake_id: body.intake_id,
      email: body.email
    }
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
