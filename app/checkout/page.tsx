"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`
      },
      redirect: "if_required"
    });

    if (!result.error && result.paymentIntent?.status === "succeeded") {
      router.push("/success");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || !elements}>
        Pay $499
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const params = useSearchParams();
  const intakeId = params.get("intake_id") ?? "";
  const defaultEmail = params.get("email") ?? "";

  const [email, setEmail] = useState(defaultEmail);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!intakeId || !email) {
      return;
    }

    void (async () => {
      const response = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_id: intakeId, email })
      });

      const data = (await response.json()) as { clientSecret?: string };
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    })();
  }, [intakeId, email]);

  const options = useMemo(
    () => (clientSecret ? { clientSecret } : undefined),
    [clientSecret]
  );

  return (
    <main>
      <h1>Checkout</h1>
      {!defaultEmail && (
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </label>
      )}
      {!intakeId && <p>Missing intake_id query parameter.</p>}
      {intakeId && clientSecret && options ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      ) : (
        <p>Preparing secure checkout...</p>
      )}
    </main>
  );
}
