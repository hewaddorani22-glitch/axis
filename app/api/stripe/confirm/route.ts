import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const SUCCESSFUL_PAYMENT_STATUSES = new Set(["paid", "no_payment_required"]);

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionUserId = session.metadata?.supabase_user_id || session.client_reference_id;

    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: "Checkout session does not belong to this user" }, { status: 403 });
    }

    const subscription =
      session.subscription && typeof session.subscription !== "string"
        ? session.subscription
        : null;

    const subscriptionStatus = subscription?.status ?? null;
    const isActiveSubscription = subscriptionStatus
      ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
      : false;
    const isSuccessfulPayment = SUCCESSFUL_PAYMENT_STATUSES.has(session.payment_status ?? "");

    if (!isActiveSubscription && !isSuccessfulPayment) {
      return NextResponse.json(
        { error: "Payment is still processing. Refresh in a few seconds." },
        { status: 409 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("users")
      .update({
        plan: "pro",
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ plan: "pro" });
  } catch (error: any) {
    console.error("Stripe confirm error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
