import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: memberships, error: membershipError } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const groupIds = (memberships || []).map((membership) => membership.group_id);
  if (groupIds.length === 0) {
    return NextResponse.json({ squads: [] });
  }

  const { data: squads, error } = await admin
    .from("groups")
    .select("id, name, invite_code, created_by, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ squads: squads || [] });
}

export async function POST(request: Request) {
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  const squadName = typeof name === "string" ? name.trim() : "";

  if (squadName.length < 2) {
    return NextResponse.json({ error: "Squad name is too short" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: squad, error } = await admin
    .from("groups")
    .insert({ name: squadName.slice(0, 80), created_by: user.id })
    .select("id, name, invite_code, created_by, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: memberError } = await admin
    .from("group_members")
    .insert({ group_id: squad.id, user_id: user.id });

  if (memberError) {
    await admin.from("groups").delete().eq("id", squad.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ squad });
}
