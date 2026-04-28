import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNudgeEmail } from "@/lib/resend";
import { isRateLimited, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/partners/nudge
 * Body: { toUserId: string }
 * Inserts a nudge record and sends a nudge email.
 * Rate limited to 5 nudges per user per hour.
 */
export async function POST(request: Request) {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`nudge:${user.id}`, 5, 60 * 60 * 1000)) {
    return rateLimitedResponse();
  }

  const { toUserId } = await request.json();
  if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

  const admin = createAdminClient();

  // Record the nudge
  await admin.from("nudges").insert({ from_user: user.id, to_user: toUserId });

  // Get the sender's name and the recipient's email
  const [senderRes, recipientRes] = await Promise.all([
    admin.from("users").select("name, email").eq("id", user.id).single(),
    admin.from("users").select("name, email").eq("id", toUserId).single(),
  ]);

  const senderName = senderRes.data?.name || senderRes.data?.email?.split("@")[0] || "Your partner";
  const recipientEmail = recipientRes.data?.email;
  const recipientName = recipientRes.data?.name || "there";

  if (recipientEmail) {
    await sendNudgeEmail(recipientEmail, senderName);
  }

  return NextResponse.json({ success: true, to: recipientName });
}
