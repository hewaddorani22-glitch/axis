"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import {
  IconStreak,
  IconCheck,
  IconTarget,
  IconRevenue,
  AxisLogo,
  IconCopy,
  IconFocus,
} from "@/components/icons";
import { ScorecardDownloadButton } from "@/components/prove/scorecard-download-button";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { buildProveStats, daysAgo, type ProveAchievement } from "@/lib/prove-stats";

interface ProveStats {
  streak: number;
  grade: string;
  focusScore: number;
  completionRate: number;
  heatmap: number[];
  todayDone: number;
  todayTotal: number;
  todayHabits: number;
  habitsTotal: number;
  achievements: ProveAchievement[];
}

export default function ProvePage() {
  const { theme } = useTheme();
  const { user, loading: userLoading } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<ProveStats | null>(null);
  const [loading, setLoading] = useState(true);

  const username = user?.prove_it_username?.trim().toLowerCase() || "";
  const displayName = user?.name || user?.email?.split("@")[0] || "You";
  const publicUrl = username ? `https://lomoura.com/prove/${username}` : "";

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [
      todayMissionsRes,
      activeHabitsRes,
      todayHabitLogsRes,
      recentMissionsRes,
      recentHabitLogsRes,
      achievementsRes,
      totalMissionsDoneRes,
      revenueRes,
    ] = await Promise.all([
      supabase.from("missions").select("status").eq("user_id", user.id).eq("date", today),
      supabase.from("habits").select("id").eq("user_id", user.id).eq("archived", false),
      supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("completed", true),
      supabase
        .from("missions")
        .select("date")
        .eq("user_id", user.id)
        .eq("status", "done")
        .gte("date", daysAgo(29))
        .lte("date", today),
      supabase
        .from("habit_logs")
        .select("date")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("date", daysAgo(29))
        .lte("date", today),
      supabase.from("achievements").select("type").eq("user_id", user.id),
      supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "done"),
      supabase.from("revenue_entries").select("amount, date").eq("user_id", user.id),
    ]);

    const failedRequest = [
      todayMissionsRes,
      activeHabitsRes,
      todayHabitLogsRes,
      recentMissionsRes,
      recentHabitLogsRes,
      achievementsRes,
      totalMissionsDoneRes,
      revenueRes,
    ].find((res) => res.error);

    if (failedRequest?.error) {
      toast.error(failedRequest.error.message || "Could not load public profile stats");
      setLoading(false);
      return;
    }

    const todayMissions = todayMissionsRes.data || [];
    const todayDone = todayMissions.filter((mission) => mission.status === "done").length;
    const todayTotal = todayMissions.length;
    const todayHabits = todayHabitLogsRes.data?.length || 0;
    const habitsTotal = activeHabitsRes.data?.length || 0;
    const computed = buildProveStats({
      todayDone,
      todayTotal,
      todayHabits,
      habitsTotal,
      missionDates: (recentMissionsRes.data || []).map((mission) => mission.date),
      habitDates: (recentHabitLogsRes.data || []).map((log) => log.date),
      earnedTypes: (achievementsRes.data || []).map((achievement) => achievement.type),
      totalMissionsDone: totalMissionsDoneRes.count || 0,
      revenueEntries: revenueRes.data || [],
    });

    setStats({
      ...computed,
      todayDone,
      todayTotal,
      todayHabits,
      habitsTotal,
    });
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadStats();
  }, [loadStats, user, userLoading]);

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Public profile link copied");
  };

  const badgeIcons: Record<string, ReactNode> = {
    "100_missions": <IconTarget size={20} className="text-axis-accent" />,
    "perfect_week": <IconCheck size={20} className="text-emerald-500" />,
    "30_day_streak": <IconStreak size={20} className="text-orange-500" />,
    "first_10k": <IconRevenue size={20} className="text-emerald-500" />,
  };

  if (userLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="axis-skeleton h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!stats || !user) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="axis-card text-center">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Public profile unavailable
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in again and lomoura will refresh your profile data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="axis-card">
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Your Public Profile</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Your profile is now based on your real activity, not demo data.
            </p>
          </div>
          {username && (
            <Link
              href={`/prove/${username}`}
              target="_blank"
              className="text-xs font-semibold text-axis-accent hover:underline"
            >
              Open
            </Link>
          )}
        </div>

        <div className="flex items-start gap-4 mb-6 sm:items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span className="text-xl font-bold font-mono text-axis-accent">
              {(displayName || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="break-words text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{displayName}</h4>
            <p className="break-words text-sm" style={{ color: "var(--text-secondary)" }}>
              {user.prove_it_bio || `${user.user_type || "Accountability"} profile`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl px-4 py-3 sm:flex-row sm:items-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
          <span className="min-w-0 break-all text-xs font-mono sm:flex-1" style={{ color: "var(--text-secondary)" }}>
            {publicUrl || "Set a username in Settings to publish your profile"}
          </span>
          {publicUrl ? (
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-axis-accent hover:underline transition-colors"
            >
              <IconCopy size={13} />
              Copy Link
            </button>
          ) : (
            <Link href="/settings" className="text-xs font-semibold text-axis-accent hover:underline">
              Settings
            </Link>
          )}
        </div>
      </div>

      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Public Stats</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <IconStreak size={20} className="text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">{stats.streak}</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-axis-accent">{stats.grade}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY&apos;S GRADE</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <IconFocus size={18} style={{ color: "var(--text-primary)" }} />
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.focusScore}</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>FOCUS SCORE</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-emerald-500">{stats.completionRate}%</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>28-DAY RATE</p>
          </div>
        </div>
      </div>

      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>28-Day Activity</h3>
        <div className="grid grid-cols-7 gap-2">
          {stats.heatmap.map((intensity, index) => (
            <div
              key={index}
              className="aspect-square rounded-md transition-colors"
              style={{
                backgroundColor:
                  intensity >= 1
                    ? "rgba(205,255,79,0.6)"
                    : intensity >= 0.5
                      ? "rgba(205,255,79,0.25)"
                      : theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Achievements</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.achievements.map((badge) => (
            <div
              key={badge.type}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${badge.earned ? "" : "opacity-40"}`}
              style={{
                backgroundColor: badge.earned ? "var(--bg-accent-soft)" : "var(--bg-tertiary)",
                borderColor: badge.earned ? "rgba(205,255,79,0.2)" : "var(--border-primary)",
              }}
            >
              <div className="flex-shrink-0 text-xl">{badgeIcons[badge.type]}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: badge.earned ? "var(--text-primary)" : "var(--text-tertiary)" }}>
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

      <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "var(--bg-secondary)", border: "2px solid rgba(205,255,79,0.2)" }}>
        <p className="text-xs font-mono text-axis-accent mb-3">SHAREABLE CARD</p>
        <div className="mx-auto w-full max-w-xs rounded-xl p-5 border sm:p-6" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-2 justify-center mb-4">
            <AxisLogo size={20} />
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>lomoura</span>
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{displayName}</p>
          <p className="text-3xl font-bold text-axis-accent mb-1">{stats.grade}</p>
          <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Grade</p>
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{stats.todayDone}/{stats.todayTotal}</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>MISSIONS</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{stats.todayHabits}/{stats.habitsTotal}</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>HABITS</p>
            </div>
            <div>
              <p className="text-sm font-bold text-orange-500 flex items-center justify-center gap-0.5">
                <IconStreak size={10} className="text-orange-500" />
                {stats.streak}
              </p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
            </div>
          </div>
          <p className="break-all text-[10px] font-mono mt-4" style={{ color: "var(--text-tertiary)" }}>
            {username ? `lomoura.com/prove/${username}` : "lomoura.com"}
          </p>
        </div>
        <div className="mt-4">
          <ScorecardDownloadButton
            data={{
              displayName,
              username,
              grade: stats.grade,
              focusScore: stats.focusScore,
              todayDone: stats.todayDone,
              todayTotal: stats.todayTotal,
              todayHabits: stats.todayHabits,
              habitsTotal: stats.habitsTotal,
              streak: stats.streak,
              completionRate: stats.completionRate,
            }}
          />
        </div>
      </div>
    </div>
  );
}
