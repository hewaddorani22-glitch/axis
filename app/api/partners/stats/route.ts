import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateFocusScore } from "@/lib/scoring";

/**
 * GET /api/partners/stats?ids=uuid1,uuid2
 * Returns today's mission/habit/streak stats for the given partner user IDs.
 * Uses service role to bypass RLS (only callable by authenticated users).
 */
export async function GET(request: Request) {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) return NextResponse.json({ stats: {} });

  const partnerIds = idsParam.split(",").filter(Boolean).slice(0, 10); // max 10 partners
  const today = new Date().toISOString().split("T")[0];

  const admin = createAdminClient();

  // Fetch today's missions, habit logs, and streak data for all partner IDs in parallel
  const [missionsRes, habitLogsRes, allMissionsRes, allHabitLogsRes] = await Promise.all([
    admin.from("missions").select("user_id, status").in("user_id", partnerIds).eq("date", today),
    admin.from("habit_logs").select("user_id, date, completed").in("user_id", partnerIds).eq("date", today).eq("completed", true),
    // For streak: last 90 days of missions (done)
    admin.from("missions").select("user_id, date").in("user_id", partnerIds).eq("status", "done").gte("date", getDateDaysAgo(90)),
    // For streak: last 90 days of habit logs
    admin.from("habit_logs").select("user_id, date").in("user_id", partnerIds).eq("completed", true).gte("date", getDateDaysAgo(90)),
  ]);

  const missions = missionsRes.data || [];
  const habitLogs = habitLogsRes.data || [];
  const allMissions = allMissionsRes.data || [];
  const allHabitLogs = allHabitLogsRes.data || [];

  const stats: Record<string, {
    missionsCompleted: number;
    missionsTotal: number;
    habitsCompleted: number;
    streak: number;
    focusScore: number;
    grade: string;
    lastActive: string | null;
  }> = {};

  for (const partnerId of partnerIds) {
    const todayMissions = missions.filter((m) => m.user_id === partnerId);
    const todayDone = todayMissions.filter((m) => m.status === "done").length;
    const todayTotal = todayMissions.length;

    const todayHabits = habitLogs.filter((l) => l.user_id === partnerId).length;

    // Calculate streak: consecutive days with ≥1 mission done AND ≥1 habit log
    const missionDates = new Set(allMissions.filter((m) => m.user_id === partnerId).map((m) => m.date));
    const habitDates = new Set(allHabitLogs.filter((l) => l.user_id === partnerId).map((l) => l.date));

    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (missionDates.has(dateStr) && habitDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    // Last active: most recent date with any activity
    const allDates = [
      ...Array.from(missionDates),
      ...Array.from(habitDates),
    ].sort().reverse();
    const lastActive = allDates[0] || null;

    // Focus score (use today's data)
    const score = calculateFocusScore({
      missionsCompleted: todayDone,
      missionsTotal: Math.max(todayTotal, 1),
      habitsCompleted: todayHabits,
      habitsTotal: Math.max(todayHabits, 1),
      streakDays: streak,
    });

    stats[partnerId] = {
      missionsCompleted: todayDone,
      missionsTotal: todayTotal,
      habitsCompleted: todayHabits,
      streak,
      focusScore: score.focusScore,
      grade: score.grade,
      lastActive,
    };
  }

  return NextResponse.json({ stats });
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
