import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { intakeStore } from "../../../lib/store";
import { generateReport } from "../../../lib/ella";
import { sendReport } from "../../../lib/email";

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
    const intake_id = paymentIntent.metadata?.intake_id;
    const email = paymentIntent.metadata?.email;

    if (intake_id && email) {
      const intake = intakeStore.get(intake_id);
      if (intake) {
        const report = await generateReport(intake);
        await sendReport(email, report, intake.companyName);
      }
    }
  }

  return NextResponse.json({ received: true });
}
