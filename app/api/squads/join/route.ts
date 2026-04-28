import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await request.json();
  const code = typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";

  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: squad, error: squadError } = await admin
    .from("groups")
    .select("id, name, invite_code, created_by, created_at")
    .eq("invite_code", code)
    .maybeSingle();

  if (squadError) {
    return NextResponse.json({ error: squadError.message }, { status: 500 });
  }

  if (!squad) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const { error } = await admin
    .from("group_members")
    .insert({ group_id: squad.id, user_id: user.id });

  if (error?.code === "23505") {
    return NextResponse.json({ squad, already: true });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ squad });
}
