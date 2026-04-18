import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("streak_freezes")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already used this month" }, { status: 409 });
  }

  const { error } = await supabase
    .from("streak_freezes")
    .insert({ user_id: user.id, used_on: today, month });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, used_on: today, month });
}
