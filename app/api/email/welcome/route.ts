import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/resend";
import { recordServerEvent } from "@/lib/server-analytics";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Idempotency: only the row where welcome_email_sent_at IS NULL will be touched.
    // If another tab / a reload already triggered the send, we get an empty result back
    // and short-circuit without re-sending.
    const claimedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await admin
      .from("users")
      .update({ welcome_email_sent_at: claimedAt })
      .eq("id", user.id)
      .is("welcome_email_sent_at", null)
      .select("id");

    if (claimError) {
      console.error("Welcome email claim error:", claimError);
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ success: true, already_sent: true });
    }

    const { name } = await request.json().catch(() => ({} as { name?: string }));
    const recipientName =
      name || user.user_metadata?.full_name || user.email.split("@")[0];

    try {
      await sendWelcomeEmail(user.email, recipientName);
    } catch (sendError: any) {
      // Roll back the claim so a follow-up retry (UI button or cron) can resend.
      await admin
        .from("users")
        .update({ welcome_email_sent_at: null })
        .eq("id", user.id)
        .eq("welcome_email_sent_at", claimedAt);

      await recordServerEvent({
        event: "welcome_email_failed",
        userId: user.id,
        path: "/api/email/welcome",
        props: { message: sendError?.message ?? "unknown" },
      });

      console.error("Welcome email send error:", sendError);
      return NextResponse.json(
        { error: sendError?.message ?? "Welcome email delivery failed" },
        { status: 502 },
      );
    }

    await recordServerEvent({
      event: "welcome_email_sent",
      userId: user.id,
      path: "/api/email/welcome",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
