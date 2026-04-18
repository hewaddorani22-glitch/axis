import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const { Pool } = require("pg");

let pool: any = null;

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL is not set");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function updateUserById(userId: string, updates: { plan?: "free" | "pro"; stripeCustomerId?: string | null }) {
  const assignments: string[] = [];
  const values: Array<string | null> = [];

  if (updates.plan) {
    assignments.push(`plan = $${values.length + 1}`);
    values.push(updates.plan);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "stripeCustomerId")) {
    assignments.push(`stripe_customer_id = $${values.length + 1}`);
    values.push(updates.stripeCustomerId ?? null);
  }

  if (assignments.length === 0) {
    return;
  }

  values.push(userId);
  await getPool().query(
    `UPDATE public.users SET ${assignments.join(", ")} WHERE id = $${values.length}`,
    values
  );
}

async function updateUserPlanByCustomerId(customerId: string, plan: "free" | "pro") {
  const result = await getPool().query(
    "UPDATE public.users SET plan = $1 WHERE stripe_customer_id = $2 RETURNING id",
    [plan, customerId]
  );

  return result.rows[0]?.id ?? null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
