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

  // Handle Stripe Checkout session (Module 4 flow)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email ?? 
                  session.metadata?.email ?? "";
    const metadata = session.metadata ?? {};

    if (email) {
      const intake: IntakePayload = {
        companyName: metadata.companyName || "Not provided",
        companyDescription: metadata.companyDescription || 
                           "Not provided",
        founderRole: metadata.founderRole || "Not provided",
        exitMotivation: metadata.exitMotivation || "Not provided",
        postTransactionIntent: metadata.postTransactionIntent || 
                              "Not provided",
        email,
        revenueModel: metadata.q2 || null,
        impliedRevenueRange: metadata.q1 || null,
        revenueTrend: null,
        marginProfile: null,
        marginTrajectory: metadata.q6 || null,
        customerConcentration: metadata.q4 || null,
        pricingPower: null,
        stepAwayBreaks: metadata.q3 || null,
        relationshipDependency: null,
        brandTiedToFounder: null,
        documentedSystems: null,
        managementDepth: metadata.q5 || null,
        hardToReplicate: metadata.q7 || null,
        leaseAndFacilities: null,
        legalExposure: null,
        aiImpact: null,
        internalAiCapability: null,
        techStackComplexity: null,
        targetTimeline: null,
        bankerEngaged: null,
        priorOffers: null,
      };

      try {
        const report = await generateReport(intake);
        await sendReport(email, report, 
                        intake.companyName || "Your Business");
      } catch (err) {
        console.error("Report generation failed:", err);
      }
    }
  }

  // Handle Payment Intent (legacy flow — keep for compatibility)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata ?? {};
    const email = metadata.email;
    const numChunks = parseInt(
      metadata.intake_chunks ?? "0", 10
    );

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
        console.error("Report generation failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
