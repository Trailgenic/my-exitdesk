import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { generateReport } from "@/lib/ella";
import { sendReport } from "@/lib/email";
import type { IntakePayload } from "@/lib/ella";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err}` },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata ?? {};
    const email = metadata.email;
    const numChunks = parseInt(metadata.intake_chunks ?? "0", 10);

    if (email && numChunks > 0) {
      let intakeJson = "";
      for (let i = 0; i < numChunks; i++) {
        intakeJson += metadata[`intake_${i}`] ?? "";
      }

      try {
        const intake = JSON.parse(intakeJson) as IntakePayload;
        const report = await generateReport(intake);
        await sendReport(email, report, intake.companyName);
      } catch (err) {
        console.error("Report generation or delivery failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
