import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLANS = {
  pro: {
    name: "AXIS Pro",
    price: 900, // $9.00 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Unlimited missions",
      "Unlimited habits",
      "Unlimited revenue streams",
      "Unlimited goals",
      "Weekly Review system",
      "Streak Freeze (1x/month)",
      "Unlimited partners",
      "CSV data export",
      "Priority support",
    ],
  },
};
