"use client";

import { getGreeting, formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import {
  IconCommand, IconRevenue, IconTarget, IconStreak,
  IconBriefing, IconCheck, IconHabits, IconWarning
} from "@/components/icons";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { AxisScoreWidget } from "@/components/app/axis-score-widget";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { missions, completedCount, total: missionsTotal, toggleMission, loading: missionsLoading } = useMissions();
  const { habits, toggleHabit, completedToday: habitsCompleted, total: habitsTotal, loading: habitsLoading } = useHabits();
  const { mtdTotal, loading: revenueLoading } = useRevenue();
  const { streak, loading: streakLoading } = useStreak();

  const currentHour = new Date().getHours();
  const isLate = currentHour >= 20;
  const streakAtRisk = streak >= 3 && habitsCompleted === 0 && isLate;

  const greeting = getGreeting();
  const displayName = user?.name || "there";
  const isLoading = userLoading || missionsLoading || habitsLoading || revenueLoading || streakLoading;

  const stats = [
    { label: "MTD Revenue", value: formatCurrency(mtdTotal), change: mtdTotal > 0 ? "This month" : "No entries yet", changeColor: "text-emerald-500", icon: <IconRevenue size={18} className="text-emerald-500" /> },
    { label: "Missions Done", value: `${completedCount}/${missionsTotal}`, change: missionsTotal > 0 ? `${Math.round((completedCount / missionsTotal) * 100)}%` : "Add missions", changeColor: "text-emerald-500", icon: <IconTarget size={18} className="text-axis-accent" /> },
    { label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, change: streak >= 7 ? "On fire!" : streak > 0 ? "Keep going!" : "Start today", changeColor: "text-orange-500", icon: <IconStreak size={18} className="text-orange-500" /> },
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

      {/* Streak At Risk Alert */}
      {!isLoading && streakAtRisk && (
        <div className="rounded-2xl p-5 border border-red-500/30 bg-red-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5"><IconWarning size={28} className="text-red-500" /></div>
            <div>
              <p className="text-red-500 font-bold mb-1">Your {streak}-Day Streak is at Risk!</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                You haven&apos;t completed any daily systems today. Finish a habit before midnight, or use a Streak Freeze.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/systems" className="text-xs font-semibold px-4 py-2 bg-axis-text1 text-axis-bg rounded-lg text-center hover:opacity-90">
              Complete Habit
            </Link>
            {user?.plan !== "pro" && (
              <Link href="/settings" className="text-xs font-semibold px-4 py-2 bg-axis-accent text-axis-dark rounded-lg text-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(205,255,79,0.3)]">
                Unlock Freeze (Pro)
              </Link>
            )}
            {user?.plan === "pro" && (
              <Link href="/systems" className="text-xs font-semibold px-4 py-2 border border-axis-border text-axis-text2 hover:text-axis-text1 rounded-lg text-center hover:bg-axis-hover transition-all">
                Use Freeze
              </Link>
            )}
          </div>
        </div>
      )}

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

      {/* Stat cards — 3 plain + AxisScoreWidget */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div variants={itemVariants} key={stat.label} className="axis-stat-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{stat.label}</span>
              {stat.icon}
            </div>
            {isLoading ? <Skeleton className="h-8 w-20 mb-2" /> : <p className="text-2xl font-bold mb-1">{stat.value}</p>}
            <p className={`text-xs font-mono ${stat.changeColor}`}>{stat.change}</p>
          </motion.div>
        ))}
        <motion.div variants={itemVariants}>
          <AxisScoreWidget />
        </motion.div>
      </motion.div>

      {/* Two columns — Missions + Habits */}
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
            <EmptyState
              icon={<IconTarget size={20} className="text-axis-accent" />}
              title="No missions set"
              description="Start your day by defining today's top priorities."
              actions={[{ label: "Add Mission", href: "/missions?quickAdd=1" }]}
              compact
            />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
              {missions.slice(0, 5).map((m) => (
                <motion.div variants={itemVariants} key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl transition-colors" style={{ ["--tw-bg-opacity" as string]: 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <button onClick={() => toggleMission(m.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all relative ${m.status === "done" ? "bg-axis-accent border-axis-accent" : "border-gray-300 dark:border-white/20 hover:border-axis-accent/50"}`}>
                    <AnimatePresence>
                      {m.status === "done" && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <IconCheck size={12} className="text-axis-dark" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <span className={`flex-1 text-sm ${m.status === "done" ? "line-through" : ""}`} style={{ color: m.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}>{m.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${m.priority === "high" ? "bg-red-500/10 text-red-500" : m.priority === "med" ? "bg-amber-500/10 text-amber-500" : "text-gray-400"}`}>{m.priority}</span>
                </motion.div>
              ))}
            </motion.div>
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
            <EmptyState
              icon={<IconHabits size={20} className="text-axis-accent" />}
              title="No systems active"
              description="Build consistency by tracking your daily habits."
              actions={[{ label: "Add Habit", href: "/systems?quickAdd=1" }]}
              compact
            />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
              {habits.map((h) => (
                <motion.div variants={itemVariants} key={h.id} className="flex items-center gap-4 py-3 px-3 rounded-xl transition-colors" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: h.todayDone ? "var(--bg-accent-soft)" : h.todaySkipped ? "rgba(245, 158, 11, 0.1)" : "var(--bg-tertiary)" }}>
                    <IconHabits size={16} className={h.todayDone ? "text-axis-accent" : h.todaySkipped ? "text-amber-500" : ""} style={{ color: h.todayDone || h.todaySkipped ? undefined : "var(--text-tertiary)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: h.todayDone || h.todaySkipped ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: h.todaySkipped ? "line-through" : "none" }}>{h.name}</p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{h.streak} day streak</p>
                  </div>
                  <button onClick={() => toggleHabit(h.id, h.todayDone || h.todaySkipped ? "undo" : "done")} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${h.todayDone ? "bg-axis-accent text-axis-dark" : h.todaySkipped ? "bg-amber-500 text-axis-dark" : ""}`} style={!(h.todayDone || h.todaySkipped) ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" } : undefined}>
                    <AnimatePresence>
                      {h.todayDone ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <IconCheck size={14} />
                        </motion.div>
                      ) : h.todaySkipped ? (
                        <span className="text-sm font-bold">−</span>
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--border-secondary)" }} />
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
