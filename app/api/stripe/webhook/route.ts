import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeWebhookSecret } from "@/lib/env";
import { recordServerEvent } from "@/lib/server-analytics";

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
        await recordServerEvent({
          event: "pro_subscription_started",
          userId,
          path: "/api/stripe/webhook",
          props: {
            source: "checkout.session.completed",
            customerId: session.customer as string,
          },
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
        await recordServerEvent({
          event: "pro_subscription_cancelled",
          userId,
          path: "/api/stripe/webhook",
          props: {
            customerId,
            cancelAt: subscription.cancel_at,
            cancelReason: (subscription as { cancellation_details?: { reason?: string | null } }).cancellation_details?.reason ?? null,
            endedAt: subscription.ended_at,
          },
        });
        console.log(`User ${userId} downgraded to Free`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const plan = status === "active" || status === "trialing" ? "pro" : "free";
      const userId = await updateUserPlanByCustomerId(customerId, plan);
      if (userId) {
        await recordServerEvent({
          event: "pro_subscription_status_changed",
          userId,
          path: "/api/stripe/webhook",
          props: {
            status,
            plan,
            cancelAtPeriodEnd: (subscription as { cancel_at_period_end?: boolean }).cancel_at_period_end ?? false,
            customerId,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      // payment_failed can fire on a single attempt without canceling the subscription —
      // never flip plan here. Stripe sends a separate subscription.updated when the
      // dunning cycle eventually downgrades the user. We only fetch the userId for
      // analytics purposes.
      const { data: userRow } = await createAdminClient()
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (userRow?.id) {
        await recordServerEvent({
          event: "pro_payment_failed",
          userId: userRow.id,
          path: "/api/stripe/webhook",
          props: {
            customerId,
            amountDue: (invoice as { amount_due?: number }).amount_due ?? null,
            attemptCount: (invoice as { attempt_count?: number }).attempt_count ?? null,
          },
        });
      }
      console.warn(`Payment failed for customer ${customerId}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
