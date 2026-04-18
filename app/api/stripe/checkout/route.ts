import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("plan, stripe_customer_id, email, name")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "You are already on Pro." }, { status: 409 });
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile?.email || user.email!,
        name: profile?.name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://useaxis.com";

    const lineItems = process.env.STRIPE_PRO_PRICE_ID
      ? [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }]
      : [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "AXIS Pro",
              description: "Unlimited everything. Your complete Business OS.",
            },
            recurring: { interval: "month" as const },
            unit_amount: 900,
          },
          quantity: 1,
        }];

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: "subscription",
      line_items: lineItems,
      success_url: `${origin}/settings?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?upgrade=cancelled`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
