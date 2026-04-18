import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;

      if (userId) {
        await supabaseAdmin
          .from("users")
          .update({
            plan: "pro",
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);

        console.log(`User ${userId} upgraded to Pro`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId);

      if (users && users.length > 0) {
        await supabaseAdmin
          .from("users")
          .update({ plan: "free" })
          .eq("id", users[0].id);

        console.log(`User ${users[0].id} downgraded to Free`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId);

      if (users && users.length > 0) {
        const plan = status === "active" || status === "trialing" ? "pro" : "free";
        await supabaseAdmin
          .from("users")
          .update({ plan })
          .eq("id", users[0].id);
      }
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
