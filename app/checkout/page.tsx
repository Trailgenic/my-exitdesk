"use client";

import { Suspense, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });
    if (error) {
      setError(error.message ?? "Payment failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}
          style={{ maxWidth: "480px", margin: "0 auto" }}>
      <PaymentElement />
      {error && (
        <p style={{ color: "red", marginTop: "16px" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          marginTop: "24px",
          width: "100%",
          padding: "14px",
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "none",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Pay $499"}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const intake_id = searchParams.get("intake_id");
  const email = searchParams.get("email");
  const [clientSecret, setClientSecret] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!intake_id || !email) {
      setError("Missing intake information. Please complete the form first.");
      return;
    }
    fetch("/api/checkout/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake_id, email }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) {
          setClientSecret(d.clientSecret);
        } else {
          setError("Failed to initialize payment. Please try again.");
        }
      })
      .catch(() => {
        setError("Failed to initialize payment. Please try again.");
      });
  }, [intake_id, email]);

  if (error) {
    return (
      <main style={{ fontFamily: "Georgia, serif",
                     padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "#666666" }}>{error}</p>
      </main>
    );
  }

  if (!clientSecret) {
    return (
      <main style={{ fontFamily: "Georgia, serif",
                     padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "#666666" }}>Preparing your checkout...</p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "Georgia, serif",
                   padding: "60px 24px" }}>
      <h1 style={{ textAlign: "center", fontSize: "22px",
                   fontWeight: "600", marginBottom: "8px" }}>
        Exit Desk Report
      </h1>
      <p style={{ textAlign: "center", fontSize: "14px",
                  color: "#666666", marginBottom: "40px" }}>
        One-time payment — $499
      </p>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main style={{ fontFamily: "Georgia, serif",
                     padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "#666666" }}>Loading...</p>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
