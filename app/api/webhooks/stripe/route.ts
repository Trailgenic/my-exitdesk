import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendReport } from "../../../../lib/email";
import { generateReport } from "../../../../lib/ella";
import { stripe } from "../../../../lib/stripe";
import { intakeStore } from "../../intake/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const intakeId = paymentIntent.metadata?.intake_id;

    if (intakeId) {
      const intake = intakeStore.get(intakeId);
      if (intake) {
        const report = await generateReport(intake);
        await sendReport(intake.email, report, intake.companyName);
      }
    }
  }

  return NextResponse.json({ received: true });
}
