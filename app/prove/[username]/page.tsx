import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateFocusScore } from "@/lib/scoring";
import { IconTarget, IconCheck, IconStreak, IconRevenue, AxisLogo } from "@/components/icons";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — AXIS Prove It`,
    description: `Check out ${username}'s accountability profile on AXIS.`,
  };
}

async function getProveItData(username: string) {
  const admin = createAdminClient();

  // Get user by prove_it_username
  const { data: profile } = await admin
    .from("users")
    .select("id, name, prove_it_bio, prove_it_username")
    .eq("prove_it_username", username.toLowerCase())
    .single();

  if (!profile) return null;

  const userId = profile.id;
  const today = new Date().toISOString().split("T")[0];

  // Date helpers
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };

  // Fetch all needed data in parallel
  const [
    todayMissionsRes,
    todayHabitLogsRes,
    last28DaysMissionsRes,
    last28DaysHabitLogsRes,
    achievementsRes,
    revenueTodayRes,
  ] = await Promise.all([
    admin.from("missions").select("status").eq("user_id", userId).eq("date", today),
    admin.from("habit_logs").select("date").eq("user_id", userId).eq("date", today).eq("completed", true),
    // Last 28 days for heatmap and streak
    admin.from("missions").select("date").eq("user_id", userId).eq("status", "done").gte("date", daysAgo(27)),
    admin.from("habit_logs").select("date").eq("user_id", userId).eq("completed", true).gte("date", daysAgo(27)),
    admin.from("achievements").select("type, earned_at").eq("user_id", userId),
    admin.from("revenue_entries").select("amount").eq("user_id", userId).eq("date", today),
  ]);

  const todayMissions = todayMissionsRes.data || [];
  const todayDone = todayMissions.filter((m) => m.status === "done").length;
  const todayTotal = todayMissions.length;
  const todayHabits = todayHabitLogsRes.data?.length ?? 0;

  // 28-day heatmap: true if user had activity (mission done OR habit logged) that day
  const missionDates28 = new Set(last28DaysMissionsRes.data?.map((m) => m.date) || []);
  const habitDates28 = new Set(last28DaysHabitLogsRes.data?.map((l) => l.date) || []);

  const heatmap: number[] = [];
  for (let i = 27; i >= 0; i--) {
    const dateStr = daysAgo(i);
    const hasMission = missionDates28.has(dateStr);
    const hasHabit = habitDates28.has(dateStr);
    if (hasMission && hasHabit) heatmap.push(1.0);
    else if (hasMission || hasHabit) heatmap.push(0.5);
    else heatmap.push(0);
  }

  // Streak: consecutive days from today backward with both mission + habit
  let streak = 0;
  for (let i = 0; i < 28; i++) {
    const dateStr = daysAgo(i);
    if (missionDates28.has(dateStr) && habitDates28.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  // 30-day completion rate
  const totalDaysWithActivity = heatmap.filter((v) => v > 0).length;
  const completionRate = Math.round((totalDaysWithActivity / 28) * 100);

  const revenueToday = (revenueTodayRes.data?.length ?? 0) > 0;

  // Daily score
  const score = calculateFocusScore({
    missionsCompleted: todayDone,
    missionsTotal: Math.max(todayTotal, 1),
    habitsCompleted: todayHabits,
    habitsTotal: Math.max(todayHabits, 1),
    streakDays: streak,
  });

  // Achievements
  const earnedTypes = new Set(achievementsRes.data?.map((a) => a.type) || []);

  return {
    profile,
    streak,
    grade: score.grade,
    focusScore: score.focusScore,
    completionRate,
    heatmap,
    todayDone,
    todayTotal,
    todayHabits,
    revenueToday,
    achievements: [
      { type: "100_missions", title: "100 Missions Done", earned: earnedTypes.has("100_missions") },
      { type: "perfect_week", title: "Perfect Week", earned: earnedTypes.has("perfect_week") },
      { type: "30_day_streak", title: "30-Day Streak", earned: earnedTypes.has("30_day_streak") || streak >= 30 },
      { type: "first_10k", title: "First $10K Month", earned: earnedTypes.has("first_10k") },
    ],
  };
}

export default async function ProveItPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getProveItData(username);

  if (!data) notFound();

  const { profile, streak, grade, focusScore, completionRate, heatmap, todayDone, todayTotal, todayHabits, achievements } = data;

  const badgeIcons: Record<string, React.ReactNode> = {
    "100_missions": <IconTarget size={20} className="text-axis-accent" />,
    "perfect_week": <IconCheck size={20} className="text-emerald-500" />,
    "30_day_streak": <IconStreak size={20} className="text-orange-500" />,
    "first_10k": <IconRevenue size={20} className="text-emerald-500" />,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AxisLogo size={24} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
            <span className="text-xs font-mono ml-1" style={{ color: "var(--text-tertiary)" }}>/ prove</span>
          </div>
          <a
            href="/"
            className="text-xs font-medium bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all"
          >
            Get AXIS Free
          </a>
        </div>
      </div>

      {/* Profile */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* User info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span className="text-2xl font-bold font-mono text-axis-accent">
              {(profile.name || profile.prove_it_username || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {profile.name || profile.prove_it_username}
          </h1>
          {profile.prove_it_bio && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{profile.prove_it_bio}</p>
          )}
          <p className="text-xs font-mono mt-2" style={{ color: "var(--text-tertiary)" }}>
            useaxis.com/prove/{username}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <IconStreak size={20} className="text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">{streak}</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>
          <div className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-axis-accent">{grade}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY&apos;S GRADE</p>
          </div>
          <div className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{focusScore}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>FOCUS SCORE</p>
          </div>
          <div className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-emerald-500">{completionRate}%</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>28-DAY RATE</p>
          </div>
        </div>

        {/* 28-day heatmap */}
        <div className="rounded-2xl p-6 border"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>28-Day Activity</h3>
          <div className="grid grid-cols-7 gap-2">
            {heatmap.map((intensity, i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{
                  backgroundColor:
                    intensity >= 1.0
                      ? "rgba(205,255,79,0.6)"
                      : intensity >= 0.5
                      ? "rgba(205,255,79,0.25)"
                      : "var(--bg-hover)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(205,255,79,0.6)" }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Full day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(205,255,79,0.25)" }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--bg-hover)" }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Inactive</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-2xl p-6 border"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((badge) => (
              <div
                key={badge.type}
                className={`flex items-center gap-3 p-3 rounded-xl border ${badge.earned ? "" : "opacity-40"}`}
                style={{
                  backgroundColor: badge.earned ? "var(--bg-accent-soft)" : "var(--bg-tertiary)",
                  borderColor: badge.earned ? "rgba(205,255,79,0.2)" : "var(--border-primary)",
                }}
              >
                <div className="flex-shrink-0">{badgeIcons[badge.type]}</div>
                <div>
                  <p className="text-xs font-semibold"
                    style={{ color: badge.earned ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {badge.title}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {badge.earned ? "Earned" : "Locked"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shareable card */}
        <div className="rounded-2xl p-8 text-center border"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>DAILY SCORECARD</p>
          <div className="max-w-[280px] mx-auto rounded-xl p-6 border"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2 justify-center mb-4">
              <AxisLogo size={20} />
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              {profile.name || profile.prove_it_username}
            </p>
            <p className="text-4xl font-bold text-axis-accent mb-1">{grade}</p>
            <p className="text-[10px] font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Scorecard</p>
            <div className="flex items-center justify-center gap-5 text-center mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {todayDone}/{todayTotal || "—"}
                </p>
                <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>MISSIONS</p>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{todayHabits}</p>
                <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>HABITS</p>
              </div>
              <div>
                <p className="text-sm font-bold text-orange-500 flex items-center justify-center gap-0.5">
                  <IconStreak size={12} className="text-orange-500" />
                  {streak}
                </p>
                <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
              </div>
            </div>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              useaxis.com/prove/{username}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Build your own system like {profile.name || profile.prove_it_username}.
          </p>
          <a
            href="/"
            className="inline-flex items-center text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            Get AXIS Free
          </a>
        </div>
      </div>
    </div>
  );
}
