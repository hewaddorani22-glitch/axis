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

  const { data: partnerships, error } = await admin
    .from("partnerships")
    .select("id, user_a, user_b, status")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .neq("status", "removed")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const partnerIds = Array.from(
    new Set((partnerships || []).map((p) => (p.user_a === user.id ? p.user_b : p.user_a)).filter(Boolean))
  );

  if (partnerIds.length === 0) {
    return NextResponse.json({ partners: [] });
  }

  const { data: profiles, error: profileError } = await admin
    .from("users")
    .select("id, name, email")
    .in("id", partnerIds);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const partners = (partnerships || []).map((partnership) => {
    const partnerId = partnership.user_a === user.id ? partnership.user_b : partnership.user_a;
    const profile = profilesById.get(partnerId);

    return {
      id: partnership.id,
      partnerId,
      name: profile?.name || profile?.email?.split("@")[0] || "Partner",
      email: profile?.email || "",
      status: partnership.status,
    };
  });

  return NextResponse.json({ partners });
}
