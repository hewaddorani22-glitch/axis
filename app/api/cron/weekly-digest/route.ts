import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/resend";
import { calculateFocusScore } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { getUserLocalContext, isInLocalHourWindow } from "@/lib/cron-tz";

const TARGET_LOCAL_HOUR_START = 10;
const TARGET_LOCAL_HOUR_END = 12;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, email, name, timezone, last_weekly_digest_on")
      .eq("onboarding_done", true);
    if (!allUsers?.length) return NextResponse.json({ sent: 0, eligible: 0 });

    // Sundays only, 10-12 local, and not yet sent on the user's local date.
    const eligible = allUsers
      .map((u) => ({ user: u, ctx: getUserLocalContext(u.timezone, now) }))
      .filter(({ user, ctx }) =>
        ctx.dow === 0 &&
        isInLocalHourWindow(ctx, TARGET_LOCAL_HOUR_START, TARGET_LOCAL_HOUR_END) &&
        user.last_weekly_digest_on !== ctx.dateIso,
      );

    if (eligible.length === 0) return NextResponse.json({ sent: 0, eligible: 0 });

    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    let sentCount = 0;
    let failedCount = 0;

    for (const { user, ctx } of eligible) {
      try {
      // Get week stats
      const [missionsRes, habitsRes, revenueRes] = await Promise.all([
        supabase
          .from("missions")
          .select("status")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
        supabase
          .from("habit_logs")
          .select("completed")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
        supabase
          .from("revenue_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
      ]);

      const missionsTotal = missionsRes.data?.length || 0;
      const missionsCompleted = missionsRes.data?.filter((m) => m.status === "done").length || 0;
      const habitsTotal = habitsRes.data?.length || 0;
      const habitsCompleted = habitsRes.data?.filter((h) => h.completed).length || 0;
      const revenueEarned = revenueRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const score = calculateFocusScore({
        missionsCompleted,
        missionsTotal: Math.max(missionsTotal, 1),
        habitsCompleted,
        habitsTotal: Math.max(habitsTotal, 1),
        streakDays: 0, // Simplified for weekly digest
      });

      await sendWeeklyDigest(user.email, user.name || "there", {
        missionsCompleted,
        missionsTotal,
        revenueEarned,
        habitsCompleted,
        streakDays: 0,
        focusScore: score.focusScore,
        grade: score.grade,
      });
      sentCount++;
      await supabase.from("users").update({ last_weekly_digest_on: ctx.dateIso }).eq("id", user.id);
      } catch (err) {
        failedCount++;
        console.error("[weekly-digest] failed for user", {
          userId: user.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ sent: sentCount, failed: failedCount, eligible: eligible.length });
  } catch (error: any) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
