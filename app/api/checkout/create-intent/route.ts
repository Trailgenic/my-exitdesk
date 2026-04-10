import { NextResponse } from "next/server";
import { stripe, PRICE } from "../../../lib/stripe";

export async function POST(request: Request) {
  const { intake_id, email } =
    (await request.json()) as {
      intake_id: string;
      email: string;
    };

  if (!intake_id || !email) {
    return NextResponse.json(
      { error: "intake_id and email are required" },
      { status: 400 }
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: PRICE,
    currency: "usd",
    receipt_email: email,
    metadata: { intake_id, email },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
