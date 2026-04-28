import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activatePartnership } from "@/lib/partners";

/**
 * POST /api/partners/invite
 * Body: { inviterId: string }
 * Creates a partnership between the current user and the inviter.
 * Called after signup when an ?invite= param is present.
 */
export async function POST(request: Request) {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviterId } = await request.json();
  if (!inviterId) return NextResponse.json({ error: "Missing inviterId" }, { status: 400 });

  if (inviterId === user.id) {
    return NextResponse.json({ error: "Cannot partner with yourself" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await activatePartnership(admin, inviterId, user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, ...result });
}
