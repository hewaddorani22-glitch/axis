"use client";

import { getGreeting, formatCurrency, formatDate } from "@/lib/utils";
import { calculateFocusScore } from "@/lib/scoring";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import {
  IconCommand, IconRevenue, IconTarget, IconStreak, IconFocus,
  IconBriefing, IconCheck, IconHabits,
} from "@/components/icons";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { missions, completedCount, total: missionsTotal, toggleMission, loading: missionsLoading } = useMissions();
  const { habits, toggleHabit, completedToday: habitsCompleted, total: habitsTotal, loading: habitsLoading } = useHabits();
  const { mtdTotal, loading: revenueLoading } = useRevenue();
  const { streak, loading: streakLoading } = useStreak();

  const greeting = getGreeting();
  const displayName = user?.name || "there";
  const isLoading = userLoading || missionsLoading || habitsLoading || revenueLoading || streakLoading;

  const score = calculateFocusScore({
    missionsCompleted: completedCount,
    missionsTotal: Math.max(missionsTotal, 1),
    habitsCompleted,
    habitsTotal: Math.max(habitsTotal, 1),
    streakDays: streak,
  });

  const stats = [
    { label: "MTD Revenue", value: formatCurrency(mtdTotal), change: mtdTotal > 0 ? "This month" : "No entries yet", changeColor: "text-emerald-500", icon: <IconRevenue size={18} className="text-emerald-500" /> },
    { label: "Missions Done", value: `${completedCount}/${missionsTotal}`, change: missionsTotal > 0 ? `${Math.round((completedCount / missionsTotal) * 100)}%` : "Add missions", changeColor: "text-emerald-500", icon: <IconTarget size={18} className="text-axis-accent" /> },
    { label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, change: streak >= 7 ? "On fire!" : streak > 0 ? "Keep going!" : "Start today", changeColor: "text-orange-500", icon: <IconStreak size={18} className="text-orange-500" /> },
    { label: "Focus Score", value: score.focusScore.toString(), change: `Grade: ${score.grade}`, changeColor: "text-violet-500", icon: <IconFocus size={18} className="text-violet-500" /> },
  ];

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
          <IconCommand size={22} className="text-axis-accent" />
        </div>
        <div>
          {isLoading ? (
            <><Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-32" /></>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{greeting}, {displayName}</h2>
              <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{formatDate(new Date())}</p>
            </>
          )}
        </div>
      </div>

      {/* Briefing */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-accent-soft)", border: "1px solid rgba(205,255,79,0.2)" }}>
        <div className="flex items-start gap-3">
          <IconBriefing size={18} className="text-axis-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-axis-accent mb-1">Morning Briefing</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {streak > 0 ? (
                <>You&apos;re on a <span className="text-axis-accent font-semibold">{streak}-day streak</span>{streak < 30 ? ` — ${30 - streak} more to 30!` : " — incredible!"} </>
              ) : (
                <>Start your streak today by completing a mission and a habit. </>
              )}
              {missionsTotal - completedCount > 0 && <>{missionsTotal - completedCount} mission{missionsTotal - completedCount !== 1 ? "s" : ""} remaining.</>}
              {missionsTotal === 0 && <>Set your first missions to get started!</>}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="axis-stat-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{stat.label}</span>
              {stat.icon}
            </div>
            {isLoading ? <Skeleton className="h-8 w-20 mb-2" /> : <p className="text-2xl font-bold mb-1">{stat.value}</p>}
            <p className={`text-xs font-mono ${stat.changeColor}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missions */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconTarget size={16} className="text-axis-accent" /> Today&apos;s Missions
            </h3>
            <Link href="/missions" className="text-xs font-mono text-axis-accent hover:underline">View all →</Link>
          </div>
          {missionsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : missions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No missions for today</p>
              <Link href="/missions" className="text-xs font-semibold text-axis-accent hover:underline mt-2 inline-block">Add missions →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl transition-colors" style={{ ["--tw-bg-opacity" as string]: 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <button onClick={() => toggleMission(m.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${m.status === "done" ? "bg-axis-accent border-axis-accent" : "border-gray-300 dark:border-white/20 hover:border-axis-accent/50"}`}>
                    {m.status === "done" && <IconCheck size={12} className="text-axis-dark" />}
                  </button>
                  <span className={`flex-1 text-sm ${m.status === "done" ? "line-through" : ""}`} style={{ color: m.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}>{m.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${m.priority === "high" ? "bg-red-500/10 text-red-500" : m.priority === "med" ? "bg-amber-500/10 text-amber-500" : "text-gray-400"}`}>{m.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconHabits size={16} className="text-axis-accent" /> Daily Systems
            </h3>
            <Link href="/systems" className="text-xs font-mono text-axis-accent hover:underline">View all →</Link>
          </div>
          {habitsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : habits.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No habits set up</p>
              <Link href="/systems" className="text-xs font-semibold text-axis-accent hover:underline mt-2 inline-block">Add habits →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((h) => (
                <div key={h.id} className="flex items-center gap-4 py-3 px-3 rounded-xl transition-colors" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: h.todayDone ? "var(--bg-accent-soft)" : "var(--bg-tertiary)" }}>
                    <IconHabits size={16} className={h.todayDone ? "text-axis-accent" : ""} style={{ color: h.todayDone ? undefined : "var(--text-tertiary)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: h.todayDone ? "var(--text-tertiary)" : "var(--text-primary)" }}>{h.name}</p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{h.streak} day streak</p>
                  </div>
                  <button onClick={() => toggleHabit(h.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${h.todayDone ? "bg-axis-accent text-axis-dark" : ""}`} style={!h.todayDone ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" } : undefined}>
                    {h.todayDone ? <IconCheck size={14} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--border-secondary)" }} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
