import { NextResponse } from "next/server";
import { stripe, PRICE } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, ...intakeData } = body;

  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  const intakeJson = JSON.stringify(intakeData);
  const chunkSize = 490;
  const chunks: Record<string, string> = {};
  for (let i = 0; i * chunkSize < intakeJson.length; i++) {
    chunks[`intake_${i}`] = intakeJson.slice(
      i * chunkSize,
      (i + 1) * chunkSize
    );
  }
  chunks["intake_chunks"] = String(
    Math.ceil(intakeJson.length / chunkSize)
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: PRICE,
    currency: "usd",
    receipt_email: email,
    description: "Exit Desk Report",
    metadata: {
      email,
      ...chunks,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
