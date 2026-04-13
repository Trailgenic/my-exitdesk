import { NextResponse } from "next/server";
import { stripe, PRICE } from "@/lib/stripe";
import { intakeStore } from "@/lib/store";

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

  const intake = intakeStore.get(intake_id);
  if (!intake) {
    return NextResponse.json(
      { error: "Intake not found. Please resubmit the form." },
      { status: 404 }
    );
  }

  const intakeJson = JSON.stringify(intake);
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
      intake_id,
      email,
      ...chunks,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
