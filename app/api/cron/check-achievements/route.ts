import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/check-achievements
 * Daily cron — checks all users for newly earned achievements and awards them.
 *
 * Achievement types:
 *   30_day_streak   — 30 consecutive days with mission + habit
 *   perfect_week    — all 7 days of any week with mission + habit
 *   100_missions    — 100 total missions completed (all time)
 *   first_10k       — any single calendar month with >= $10,000 revenue
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };

  // Get all users
  const { data: users } = await admin.from("users").select("id");
  if (!users?.length) return NextResponse.json({ awarded: 0 });

  // Get all already-earned achievements to avoid duplicates
  const { data: existing } = await admin
    .from("achievements")
    .select("user_id, type");
  const earnedSet = new Set(
    (existing || []).map((a) => `${a.user_id}:${a.type}`)
  );

  // Fetch data for all users at once
  const userIds = users.map((u) => u.id);

  const [
    missionCountsRes,
    streakMissionsRes,
    streakHabitsRes,
    revenueRes,
  ] = await Promise.all([
    // Total missions completed per user (all time)
    admin
      .from("missions")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "done"),
    // Last 30 days of completed missions
    admin
      .from("missions")
      .select("user_id, date")
      .in("user_id", userIds)
      .eq("status", "done")
      .gte("date", daysAgo(29))
      .lte("date", today),
    // Last 30 days of completed habit logs
    admin
      .from("habit_logs")
      .select("user_id, date")
      .in("user_id", userIds)
      .eq("completed", true)
      .gte("date", daysAgo(29))
      .lte("date", today),
    // Revenue entries for streak month detection
    admin
      .from("revenue_entries")
      .select("user_id, amount, date")
      .in("user_id", userIds),
  ]);

  const allMissionsDone = missionCountsRes.data || [];
  const recentMissions = streakMissionsRes.data || [];
  const recentHabits = streakHabitsRes.data || [];
  const allRevenue = revenueRes.data || [];

  const toAward: { user_id: string; type: string }[] = [];

  for (const { id: userId } of users) {
    const userMissions = recentMissions.filter((m) => m.user_id === userId);
    const userHabits = recentHabits.filter((h) => h.user_id === userId);
    const missionDates = new Set(userMissions.map((m) => m.date));
    const habitDates = new Set(userHabits.map((h) => h.date));

    // ── 30-day streak ──────────────────────────────────────────────────────
    if (!earnedSet.has(`${userId}:30_day_streak`)) {
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = daysAgo(i);
        if (missionDates.has(d) && habitDates.has(d)) streak++;
        else break;
      }
      if (streak >= 30) {
        toAward.push({ user_id: userId, type: "30_day_streak" });
      }
    }

    // ── Perfect week (any 7-consecutive-day block in last 30 days) ─────────
    if (!earnedSet.has(`${userId}:perfect_week`)) {
      for (let start = 0; start <= 23; start++) {
        let allDone = true;
        for (let d = start; d < start + 7; d++) {
          const dateStr = daysAgo(d);
          if (!missionDates.has(dateStr) || !habitDates.has(dateStr)) {
            allDone = false;
            break;
          }
        }
        if (allDone) {
          toAward.push({ user_id: userId, type: "perfect_week" });
          break;
        }
      }
    }

    // ── 100 missions done (all time) ───────────────────────────────────────
    if (!earnedSet.has(`${userId}:100_missions`)) {
      const totalDone = allMissionsDone.filter((m) => m.user_id === userId).length;
      if (totalDone >= 100) {
        toAward.push({ user_id: userId, type: "100_missions" });
      }
    }

    // ── First $10K month ───────────────────────────────────────────────────
    if (!earnedSet.has(`${userId}:first_10k`)) {
      const userRevenue = allRevenue.filter((r) => r.user_id === userId);
      const byMonth: Record<string, number> = {};
      for (const entry of userRevenue) {
        const month = entry.date.slice(0, 7); // "YYYY-MM"
        byMonth[month] = (byMonth[month] || 0) + parseFloat(entry.amount as any);
      }
      const hit10k = Object.values(byMonth).some((total) => total >= 10000);
      if (hit10k) {
        toAward.push({ user_id: userId, type: "first_10k" });
      }
    }
  }

  if (toAward.length > 0) {
    await admin.from("achievements").insert(toAward);
    // Mark them as earned so future runs skip them
    toAward.forEach(({ user_id, type }) => earnedSet.add(`${user_id}:${type}`));
  }

  return NextResponse.json({ awarded: toAward.length, achievements: toAward });
}
