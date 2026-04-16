import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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

    if (email) {
      await tagSubscriberPurchased(email);
      try {
        await removeScoreTags(email);
      } catch (err) {
        console.error("Score tag removal failed:", err);
      }
    }
  }

  // Handle Payment Intent (legacy flow — keep for compatibility)
  if (event.type === "payment_intent.succeeded") {
    // Intentionally no-op.
  }

  return NextResponse.json({ received: true });
}
