import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeWebhookSecret } from "@/lib/env";

async function updateUserById(userId: string, updates: { plan?: "free" | "pro"; stripeCustomerId?: string | null }) {
  const update: Record<string, string | null> = {};
  if (updates.plan) update.plan = updates.plan;
  if (Object.prototype.hasOwnProperty.call(updates, "stripeCustomerId")) {
    update.stripe_customer_id = updates.stripeCustomerId ?? null;
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await createAdminClient()
    .from("users")
    .update(update)
    .eq("id", userId);

  if (error) throw error;
}

async function updateUserPlanByCustomerId(customerId: string, plan: "free" | "pro") {
  const { data, error } = await createAdminClient()
    .from("users")
    .update({ plan })
    .eq("stripe_customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id || session.client_reference_id;

      if (userId) {
        await updateUserById(userId, {
          plan: "pro",
          stripeCustomerId: session.customer as string,
        });

        console.log(`User ${userId} upgraded to Pro`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const userId = await updateUserPlanByCustomerId(customerId, "free");

      if (userId) {
        console.log(`User ${userId} downgraded to Free`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const plan = status === "active" || status === "trialing" ? "pro" : "free";
      await updateUserPlanByCustomerId(customerId, plan);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.warn(`Payment failed for customer ${invoice.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
