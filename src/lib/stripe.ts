import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Stripe credentials are not set in the environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2026-06-24.dahlia" as any, // Bypass strict type check if needed, but this satisfies TS
  appInfo: {
    name: "Gyrex",
    version: "1.0.0",
  },
});
