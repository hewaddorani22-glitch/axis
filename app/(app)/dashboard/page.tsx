"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "@/components/app/empty-state";
import { AxisScoreWidget } from "@/components/app/axis-score-widget";
import { useAxisScore } from "@/hooks/useAxisScore";
import { useHabits } from "@/hooks/useHabits";
import { useMissions } from "@/hooks/useMissions";
import { useObjectives } from "@/hooks/useObjectives";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import { useUser } from "@/hooks/useUser";
import { formatCurrency, formatDate, getGreeting } from "@/lib/utils";
import {
  IconBriefing,
  IconCheck,
  IconCommand,
  IconFocus,
  IconHabits,
  IconRevenue,
  IconStreak,
  IconTarget,
  IconWarning,
} from "@/components/icons";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

function priorityWeight(priority: "high" | "med" | "low") {
  if (priority === "high") return 3;
  if (priority === "med") return 2;
  return 1;
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { missions, loading: missionsLoading, toggleMission } = useMissions();
  const { habits, loading: habitsLoading, toggleHabit } = useHabits();
  const { mtdTotal, loading: revenueLoading } = useRevenue();
  const { streak, recoveryAvailable, loading: streakLoading } = useStreak();
  const axisScore = useAxisScore();

  const isLoading = userLoading || missionsLoading || habitsLoading || revenueLoading || streakLoading || axisScore.loading;

  const completedCount = missions.filter((mission) => mission.status === "done").length;
  const missionsTotal = missions.length;
  const habitsCompleted = habits.filter((habit) => habit.todayDone).length;

  const currentHour = new Date().getHours();
  const isLate = currentHour >= 20;
  const streakNeedsAttention = streak >= 3 && habitsCompleted === 0 && isLate;

  const stats = [
    { label: "Revenue MTD", value: formatCurrency(mtdTotal), change: "This month", changeColor: "text-emerald-500", icon: <IconRevenue size={18} className="text-emerald-500" /> },
    { label: "Tasks Done", value: `${completedCount}/${missionsTotal}`, change: missionsTotal > 0 ? `${Math.round((completedCount/missionsTotal)*100)}%` : "Start today", changeColor: "text-axis-accent", icon: <IconTarget size={18} className="text-axis-accent" /> },
    { label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, change: streak > 0 ? "Active" : "Start now", changeColor: "text-orange-500", icon: <IconStreak size={18} className="text-orange-500" /> },
    { label: "Focus Score", value: axisScore.score.toString(), change: `Grade: ${axisScore.grade}`, changeColor: "text-violet-500", icon: <IconFocus size={18} className="text-violet-500" /> },
  ];

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-axis-accent/10 border border-axis-accent/20">
            <IconCommand size={22} className="text-axis-accent" />
          </div>
          <div>
            {isLoading ? (
              <><Skeleton className="h-6 w-40 mb-1" /><Skeleton className="h-4 w-24" /></>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{getGreeting()}, {user?.name || "there"}</h2>
                <p className="text-[11px] font-mono tracking-widest text-white/30">{formatDate(new Date())}</p>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block">
           <AxisScoreWidget {...axisScore} loading={isLoading} compact />
        </div>
      </div>

      {/* Extreme Focus Alert */}
      {!isLoading && streakNeedsAttention && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="axis-card border-red-500/30 bg-red-500/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconWarning size={24} className="text-red-500 mt-1" />
            <div>
              <p className="text-red-500 font-bold mb-1">STREAK AT RISK</p>
              <p className="text-sm text-white/50">Your {streak}-day streak is exposed. Complete one habit before midnight.</p>
            </div>
          </div>
          <Link href="/systems" className="w-full md:w-auto text-xs font-bold bg-axis-accent text-axis-dark px-6 py-2.5 rounded-xl hover:scale-105 transition-all">
            ACT NOW
          </Link>
        </motion.div>
      )}

      {/* Global Stats Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div variants={itemVariants} key={stat.label} className="axis-stat-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-white/30">{stat.label}</span>
              {stat.icon}
            </div>
            {isLoading ? <Skeleton className="h-8 w-20 mb-2" /> : <p className="text-2xl font-bold mb-1 tracking-tight">{stat.value}</p>}
            <p className={`text-[10px] font-mono font-bold ${stat.changeColor}`}>{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Two columns layout (The Reverted "Today" Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missions */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-3">
              <IconTarget size={18} className="text-axis-accent" /> Today&apos;s Missions
            </h3>
            <Link href="/missions" className="text-xs font-mono text-axis-accent hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : missions.length === 0 ? (
            <EmptyState
              icon={<IconTarget size={20} className="text-axis-accent" />}
              title="No missions set"
              description="Define today's top priorities."
              actions={[{ label: "Add Mission", href: "/missions?quickAdd=1" }]}
              compact
            />
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.04]">
                  <button onClick={() => toggleMission(m.id)} className={`relative w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${m.status === "done" ? "bg-axis-accent border-axis-accent" : "border-white/10 hover:border-axis-accent/50"}`}>
                    <AnimatePresence>
                      {m.status === "done" && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
                          <IconCheck size={12} className="text-axis-dark" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <span className={`flex-1 text-sm ${m.status === "done" ? "line-through opacity-30 text-white/50" : "text-white/80"}`}>{m.title}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${m.priority === "high" ? "bg-red-500/10 text-red-500" : m.priority === "med" ? "bg-amber-500/10 text-amber-500" : "text-white/20"}`}>{m.priority.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-3">
              <IconHabits size={18} className="text-axis-accent" /> Daily Systems
            </h3>
            <Link href="/systems" className="text-xs font-mono text-axis-accent hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : habits.length === 0 ? (
            <EmptyState
              icon={<IconHabits size={20} className="text-axis-accent" />}
              title="No systems active"
              description="Track recurring daily habits."
              actions={[{ label: "Add Habit", href: "/systems?quickAdd=1" }]}
              compact
            />
          ) : (
            <div className="space-y-3">
              {habits.map((h) => (
                <div key={h.id} className="flex items-center gap-4 py-3 px-3 rounded-2xl transition-colors hover:bg-white/[0.04]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.todayDone ? 'bg-axis-accent/10 text-axis-accent' : 'bg-white/5 text-white/20'}`}>
                    <IconHabits size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium truncate ${h.todayDone ? 'text-white/30' : 'text-white/90'}`}>{h.name}</p>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{h.streak} day streak</p>
                  </div>
                  <button onClick={() => toggleHabit(h.id, h.todayDone ? "undo" : "done")} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${h.todayDone ? 'bg-axis-accent text-axis-dark shadow-[0_0_15px_rgba(205,255,79,0.2)]' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                    {h.todayDone ? <IconCheck size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
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
