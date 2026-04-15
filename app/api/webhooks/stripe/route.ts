import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { generateReport } from "@/lib/ella";
import { sendReport } from "@/lib/email";
import type { IntakePayload } from "@/lib/ella";

export const runtime = "nodejs";

async function tagSubscriberPurchased(email: string): Promise<void> {
  const apiKey = process.env.CONVERTKIT_API_KEY;
  if (!apiKey || !email) return;

  await fetch("https://api.convertkit.com/v3/tags/18944004/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      email,
      confirmed: true,
    }),
  });
}

async function removeScoreTags(email: string): Promise<void> {
  const apiSecret = process.env.CONVERTKIT_API_SECRET;
  if (!apiSecret || !email) return;

  const lookupRes = await fetch(
    `https://api.convertkit.com/v3/subscribers?api_secret=${encodeURIComponent(
      apiSecret
    )}&email_address=${encodeURIComponent(email)}`
  );

  if (!lookupRes.ok) return;

  const lookupBody = (await lookupRes.json()) as {
    subscribers?: Array<{ id?: number }>;
  };
  const subscriberId = lookupBody.subscribers?.[0]?.id;
  if (!subscriberId) return;

  await Promise.all(
    [18944001, 18944002].map(async (tagId) => {
      await fetch(
        `https://api.convertkit.com/v3/subscribers/${subscriberId}/tags/${tagId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_secret: apiSecret }),
        }
      );
    })
  );
}

function resolveAnswer(
  questionKey: "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8",
  rawValue: string | null | undefined
): string | null {
  if (!rawValue) return null;

  const answerMap = {
    q1: {
      a: "Under $1M",
      b: "$1M–$3M",
      c: "$3M–$7M",
      d: "$7M–$15M",
      e: "Over $15M",
    },
    q2: {
      a: "Recurring contract revenue",
      b: "Repeat but informal revenue",
      c: "Project-based revenue",
      d: "Mixed recurring and project revenue",
    },
    q3: {
      a: "Business runs normally without me",
      b: "Some disruption but recovers",
      c: "Significant disruption",
      d: "Business stops without me",
    },
    q4: {
      a: "No customer over 10%",
      b: "10–20% in top customer",
      c: "20–40% in top customer",
      d: "Over 40% in top customer",
    },
    q5: {
      a: "Strong independent management team",
      b: "Capable team with some founder involvement",
      c: "Thin management, founder-dependent",
      d: "No real management layer",
    },
    q6: {
      a: "Improving",
      b: "Stable",
      c: "Declining",
      d: "Not tracking closely",
    },
    q7: {
      a: "Long-term customer relationships and brand",
      b: "Proprietary systems, licenses, or regulatory position",
      c: "Specialized team or operational know-how",
      d: "Nothing — commodity business",
    },
    q8: {
      a: "Selling from strength — business performing well",
      b: "Personal readiness — lifestyle or succession",
      c: "Forced or urgent — health, partner, or market pressure",
      d: "Exploring — not committed to selling yet",
    },
  } as const;

  return answerMap[questionKey][rawValue as keyof (typeof answerMap)[typeof questionKey]] ?? null;
}

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
    const email =
      session.customer_details?.email ?? session.metadata?.email ?? "";
    const metadata = session.metadata ?? {};

    if (email) {
      await tagSubscriberPurchased(email);
      try {
        await removeScoreTags(email);
      } catch (err) {
        console.error("Score tag removal failed:", err);
      }

      const intake: IntakePayload = {
        companyName: metadata.companyName || "Not provided",
        companyDescription: metadata.companyDescription || "Not provided",
        founderRole: metadata.founderRole || "Not provided",
        exitMotivation: resolveAnswer("q8", metadata.q8),
        postTransactionIntent:
          metadata.postTransactionIntent || "Not provided",
        email,
        revenueModel: resolveAnswer("q2", metadata.q2),
        impliedRevenueRange: resolveAnswer("q1", metadata.q1),
        revenueTrend: null,
        marginProfile: null,
        marginTrajectory: resolveAnswer("q6", metadata.q6),
        customerConcentration: resolveAnswer("q4", metadata.q4),
        pricingPower: null,
        stepAwayBreaks: resolveAnswer("q3", metadata.q3),
        relationshipDependency: null,
        brandTiedToFounder: null,
        documentedSystems: null,
        managementDepth: resolveAnswer("q5", metadata.q5),
        hardToReplicate: resolveAnswer("q7", metadata.q7),
        leaseAndFacilities: null,
        legalExposure: null,
        aiImpact: null,
        internalAiCapability: null,
        techStackComplexity: null,
        targetTimeline: null,
        bankerEngaged: null,
        priorOffers: null,
        additionalContext: null,
      };

      try {
        const report = await generateReport(intake);
        await sendReport(email, report, intake.companyName || "Your Business");
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
        console.error("Report generation failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
