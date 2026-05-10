import { NextResponse } from "next/server";
import { sendStreakWarning } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { sendPushToUser } from "@/lib/push";
import { getUserLocalContext, isInLocalHourWindow } from "@/lib/cron-tz";

const TARGET_LOCAL_HOUR_START = 18;
const TARGET_LOCAL_HOUR_END = 20;
const STREAK_LOOKBACK_DAYS = 90;

/**
 * GET /api/cron/streak-warning
 *
 * Runs hourly. Targets users whose local time is between 18 and 20 (the
 * sweet spot for "you can still save your streak today" nudges) and who:
 *   - have an active streak of at least 3 days
 *   - have done nothing today (no missions done, no habit logs)
 *   - haven't been warned yet on their local date
 *
 * Sends both an email and a push (if push subscription present).
 */
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
    const admin = createAdminClient();
    const now = new Date();

    const { data: allUsers } = await admin
      .from("users")
      .select("id, email, name, timezone, last_streak_warning_on")
      .eq("onboarding_done", true);

    if (!allUsers?.length) return NextResponse.json({ sent: 0, eligible: 0 });

    const eligible = allUsers
      .map((u) => ({ user: u, ctx: getUserLocalContext(u.timezone, now) }))
      .filter(({ user, ctx }) =>
        isInLocalHourWindow(ctx, TARGET_LOCAL_HOUR_START, TARGET_LOCAL_HOUR_END) &&
        user.last_streak_warning_on !== ctx.dateIso,
      );

    if (eligible.length === 0) return NextResponse.json({ sent: 0, eligible: 0 });

    let sent = 0;
    let pushed = 0;

    for (const { user, ctx } of eligible) {
      const today = ctx.dateIso;

      const [todayMissionsRes, todayHabitsRes] = await Promise.all([
        admin
          .from("missions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "done")
          .eq("date", today)
          .limit(1),
        admin
          .from("habit_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", today)
          .eq("completed", true)
          .limit(1),
      ]);

      const hasActivityToday =
        (todayMissionsRes.data?.length || 0) > 0 ||
        (todayHabitsRes.data?.length || 0) > 0;

      if (hasActivityToday) {
        // User already secured the day. Stamp so we don't reconsider.
        await admin.from("users").update({ last_streak_warning_on: today }).eq("id", user.id);
        continue;
      }

      // Compute current streak by walking backward day-by-day in user-local time.
      const lookbackStart = new Date(now);
      lookbackStart.setUTCDate(lookbackStart.getUTCDate() - STREAK_LOOKBACK_DAYS);
      const lookbackStartIso = lookbackStart.toISOString().split("T")[0];

      const [missionDatesRes, habitDatesRes] = await Promise.all([
        admin
          .from("missions")
          .select("date")
          .eq("user_id", user.id)
          .eq("status", "done")
          .gte("date", lookbackStartIso),
        admin
          .from("habit_logs")
          .select("date")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("date", lookbackStartIso),
      ]);

      const mDates = new Set((missionDatesRes.data || []).map((row) => row.date));
      const hDates = new Set((habitDatesRes.data || []).map((row) => row.date));

      // Walk yesterday → backwards in calendar days. We use UTC dates to
      // generate the candidate ISO strings; a 1-day skew between UTC and
      // user-local at the boundary is acceptable for streak counting.
      const dayMs = 86_400_000;
      const yesterdayMs = new Date(`${today}T00:00:00Z`).getTime() - dayMs;
      let streak = 0;
      for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
        const iso = new Date(yesterdayMs - i * dayMs).toISOString().split("T")[0];
        if (mDates.has(iso) && hDates.has(iso)) streak++;
        else break;
      }

      // Only warn users with meaningful streaks — sub-3-day streaks are noise.
      if (streak < 3) {
        await admin.from("users").update({ last_streak_warning_on: today }).eq("id", user.id);
        continue;
      }

      try {
        await sendStreakWarning(user.email, user.name || "there", streak);
        sent++;
      } catch {
        // Non-fatal per user.
      }

      try {
        const delivered = await sendPushToUser(user.id, {
          title: `🔥 Streak Tag ${streak} — heute reicht 1 Habit`,
          body: `Du hast heute noch nichts erledigt. Hak ein Habit ab, bevor der Tag endet.`,
          url: "/dashboard",
          tag: "streak-warning",
        });
        if (delivered > 0) pushed++;
      } catch {
        // Non-fatal — email is the primary channel.
      }

      await admin.from("users").update({ last_streak_warning_on: today }).eq("id", user.id);
    }

    return NextResponse.json({ sent, pushed, eligible: eligible.length });
  } catch (error: any) {
    console.error("Streak warning cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
