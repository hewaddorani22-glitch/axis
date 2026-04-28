import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";
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
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    const headersList = await headers();
    const origin = getAppUrl(headersList.get("origin"));

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
