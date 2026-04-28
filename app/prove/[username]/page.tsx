import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconTarget, IconCheck, IconStreak, IconRevenue, AxisLogo } from "@/components/icons";
import { ScorecardDownloadButton } from "@/components/prove/scorecard-download-button";
import { buildProveStats, daysAgo } from "@/lib/prove-stats";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getProveItData(username);
  
  if (!data) {
    return {
      title: `${username} | lomoura Prove It`,
      description: `Check out ${username}'s accountability profile on lomoura.`,
    };
  }

  const { streak, grade } = data;
  const ogUrl = new URL(`https://lomoura.com/api/og`);
  ogUrl.searchParams.set("username", username);
  if (streak > 0) ogUrl.searchParams.set("streak", streak.toString());
  if (grade) ogUrl.searchParams.set("score", grade);

  return {
    title: `${username} | lomoura Prove It`,
    description: `Check out ${username}'s accountability profile on lomoura. Streak: ${streak}. Grade: ${grade}.`,
    openGraph: {
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl.toString()],
    },
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

  // Fetch all needed data in parallel
  const [
    todayMissionsRes,
    activeHabitsRes,
    todayHabitLogsRes,
    last30DaysMissionsRes,
    last30DaysHabitLogsRes,
    achievementsRes,
    totalMissionsDoneRes,
    revenueRes,
  ] = await Promise.all([
    admin.from("missions").select("status").eq("user_id", userId).eq("date", today),
    admin.from("habits").select("id").eq("user_id", userId).eq("archived", false),
    admin.from("habit_logs").select("date").eq("user_id", userId).eq("date", today).eq("completed", true),
    // Last 30 days for streaks and achievements. The heatmap displays the last 28.
    admin.from("missions").select("date").eq("user_id", userId).eq("status", "done").gte("date", daysAgo(29)).lte("date", today),
    admin.from("habit_logs").select("date").eq("user_id", userId).eq("completed", true).gte("date", daysAgo(29)).lte("date", today),
    admin.from("achievements").select("type, earned_at").eq("user_id", userId),
    admin.from("missions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "done"),
    admin.from("revenue_entries").select("amount, date").eq("user_id", userId),
  ]);

  const todayMissions = todayMissionsRes.data || [];
  const todayDone = todayMissions.filter((m) => m.status === "done").length;
  const todayTotal = todayMissions.length;
  const todayHabits = todayHabitLogsRes.data?.length ?? 0;
  const habitsTotal = activeHabitsRes.data?.length ?? 0;
  const computed = buildProveStats({
    todayDone,
    todayTotal,
    todayHabits,
    habitsTotal,
    missionDates: last30DaysMissionsRes.data?.map((mission) => mission.date) || [],
    habitDates: last30DaysHabitLogsRes.data?.map((log) => log.date) || [],
    earnedTypes: achievementsRes.data?.map((achievement) => achievement.type) || [],
    totalMissionsDone: totalMissionsDoneRes.count || 0,
    revenueEntries: revenueRes.data || [],
  });

  return {
    profile,
    ...computed,
    todayDone,
    todayTotal,
    todayHabits,
    habitsTotal,
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

  const { profile, streak, grade, focusScore, completionRate, heatmap, todayDone, todayTotal, todayHabits, habitsTotal, achievements } = data;
  const displayName = profile.name || profile.prove_it_username || "lomoura user";

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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center gap-2">
            <AxisLogo size={24} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>lomoura</span>
            <span className="text-xs font-mono ml-1" style={{ color: "var(--text-tertiary)" }}>/ prove</span>
          </div>
          <a
            href="/"
            className="shrink-0 text-xs font-medium bg-axis-accent text-axis-dark px-3 py-2 rounded-lg hover:bg-axis-accent/90 transition-all sm:px-4"
          >
            Get lomoura Free
          </a>
        </div>
      </div>

      {/* Profile */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* User info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span className="text-2xl font-bold font-mono text-axis-accent">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {displayName}
          </h1>
          {profile.prove_it_bio && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{profile.prove_it_bio}</p>
          )}
          <p className="break-all text-xs font-mono mt-2" style={{ color: "var(--text-tertiary)" }}>
            lomoura.com/prove/{username}
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
          <div className="flex flex-wrap items-center gap-3 mt-3">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="min-w-0">
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
        <div className="rounded-2xl p-5 text-center border sm:p-8"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>DAILY SCORECARD</p>
          <div className="mx-auto w-full max-w-[280px] rounded-xl p-5 border sm:p-6"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2 justify-center mb-4">
              <AxisLogo size={20} />
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>lomoura</span>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              {displayName}
            </p>
            <p className="text-4xl font-bold text-axis-accent mb-1">{grade}</p>
            <p className="text-[10px] font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Scorecard</p>
            <div className="flex items-center justify-center gap-5 text-center mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {todayDone}/{todayTotal || "0"}
                </p>
                <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>MISSIONS</p>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{todayHabits}/{habitsTotal}</p>
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
            <p className="break-all text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              lomoura.com/prove/{username}
            </p>
          </div>
          <div className="mt-4">
            <ScorecardDownloadButton
              data={{
                displayName,
                username,
                grade,
                focusScore,
                todayDone,
                todayTotal,
                todayHabits,
                habitsTotal,
                streak,
                completionRate,
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Build your own system like {displayName}.
          </p>
          <a
            href="/"
            className="inline-flex items-center text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            Get lomoura Free
          </a>
        </div>
      </div>
    </div>
  );
}
