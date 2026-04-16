import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use service role for webhook (no user session available)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

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

        console.log(`✅ User ${userId} upgraded to Pro`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID and downgrade
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId);

      if (users && users.length > 0) {
        await supabaseAdmin
          .from("users")
          .update({ plan: "free" })
          .eq("id", users[0].id);

        console.log(`⬇️ User ${users[0].id} downgraded to Free`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.warn(`⚠️ Payment failed for customer ${invoice.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
