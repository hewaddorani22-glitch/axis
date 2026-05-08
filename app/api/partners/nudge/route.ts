import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNudgeEmail } from "@/lib/resend";

/**
 * POST /api/partners/nudge
 * Body: { toUserId: string }
 * Inserts a nudge record and sends a nudge email.
 */
export async function POST(request: Request) {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toUserId } = await request.json();
  if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
  if (toUserId === user.id) {
    return NextResponse.json({ error: "Cannot nudge yourself" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: partnerships } = await admin
    .from("partnerships")
    .select("user_a, user_b")
    .eq("status", "active")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const partnerIds = new Set(
    (partnerships || []).map((partnership) =>
      partnership.user_a === user.id ? partnership.user_b : partnership.user_a
    )
  );

  if (!partnerIds.has(toUserId)) {
    return NextResponse.json({ error: "Partner not found" }, { status: 403 });
  }

  // Record the nudge
  await admin.from("nudges").insert({ from_user: user.id, to_user: toUserId });

  // Get the sender's name and the recipient's email
  const [senderRes, recipientRes] = await Promise.all([
    admin.from("users").select("name, email").eq("id", user.id).maybeSingle(),
    admin.from("users").select("name, email").eq("id", toUserId).maybeSingle(),
  ]);

  if (!senderRes.data || !recipientRes.data) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const senderName = senderRes.data?.name || senderRes.data?.email?.split("@")[0] || "Your partner";
  const recipientEmail = recipientRes.data?.email;
  const recipientName = recipientRes.data?.name || "there";

  if (recipientEmail) {
    try {
      await sendNudgeEmail(recipientEmail, senderName);
    } catch (error) {
      console.warn("Nudge email failed:", error);
    }
  }

  return NextResponse.json({ success: true, to: recipientName });
}
