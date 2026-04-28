import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited, rateLimitedResponse } from "@/lib/rate-limit";

/**
 * POST /api/partners/invite
 * Body: { inviterId: string }
 * Creates a partnership between the current user and the inviter.
 * Called after signup when an ?invite= param is present.
 * Rate limited to 20 invites per user per hour.
 */
export async function POST(request: Request) {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`invite:${user.id}`, 20, 60 * 60 * 1000)) {
    return rateLimitedResponse();
  }

  const { inviterId } = await request.json();
  if (!inviterId) return NextResponse.json({ error: "Missing inviterId" }, { status: 400 });

  if (inviterId === user.id) {
    return NextResponse.json({ error: "Cannot partner with yourself" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check if partnership already exists (either direction)
  const { data: existing } = await admin
    .from("partnerships")
    .select("id")
    .or(`and(user_a.eq.${inviterId},user_b.eq.${user.id}),and(user_a.eq.${user.id},user_b.eq.${inviterId})`)
    .neq("status", "removed")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, already: true });
  }

  // Create the partnership
  const { error } = await admin.from("partnerships").insert({
    user_a: inviterId,
    user_b: user.id,
    status: "active",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
