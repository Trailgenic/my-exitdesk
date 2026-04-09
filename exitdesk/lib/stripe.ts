import Stripe from "stripe";

export const PRICE = 49900;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20"
});
