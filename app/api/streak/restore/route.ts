import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MIN_PEAK = 7;
const MAX_PEAK = 365;

function dateInTimezone(tz: string, offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() - offsetDays);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().split("T")[0];
  }
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, streak_restored_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    eligible: profile?.plan === "pro" && profile?.streak_restored_at == null,
    plan: profile?.plan ?? "free",
    already_restored: profile?.streak_restored_at != null,
  });
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const peakRaw = Number(body?.peak);
  if (!Number.isFinite(peakRaw)) {
    return NextResponse.json({ error: "peak must be a number" }, { status: 400 });
  }
  const peak = Math.max(MIN_PEAK, Math.min(MAX_PEAK, Math.floor(peakRaw)));
  if (peakRaw < MIN_PEAK) {
    return NextResponse.json({ error: `peak must be at least ${MIN_PEAK}` }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, timezone, streak_restored_at")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }
  if (profile?.streak_restored_at) {
    return NextResponse.json({ error: "Streak already restored" }, { status: 409 });
  }

  const tz = profile?.timezone || "UTC";
  const bridgeTo = dateInTimezone(tz, 1); // yesterday in user tz
  const bridgeFrom = dateInTimezone(tz, peak); // peak days back

  const { error: insertError } = await supabase
    .from("streak_restores")
    .insert({
      user_id: user.id,
      bridge_from_date: bridgeFrom,
      bridge_to_date: bridgeTo,
      peak_streak: peak,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Streak already restored" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({ streak_restored_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    bridge_from: bridgeFrom,
    bridge_to: bridgeTo,
    peak,
  });
}
