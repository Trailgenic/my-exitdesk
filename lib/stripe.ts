import Stripe from "stripe";

export const PRICE = 49900;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia"
});
