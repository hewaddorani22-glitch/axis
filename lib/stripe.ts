import Stripe from "stripe";
import { getStripePriceId, getStripeSecretKey } from "@/lib/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}

export const PLANS = {
  pro: {
    name: "lomoura Pro",
    price: 900, // $9.00 in cents
    priceId: getStripePriceId(),
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
