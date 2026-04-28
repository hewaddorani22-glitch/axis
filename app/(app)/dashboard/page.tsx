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
  const { objectives, loading: objectivesLoading } = useObjectives();
  const { streak, recoveryAvailable, loading: streakLoading } = useStreak();
  const axisScore = useAxisScore();

  const isLoading =
    userLoading ||
    missionsLoading ||
    habitsLoading ||
    revenueLoading ||
    objectivesLoading ||
    streakLoading ||
    axisScore.loading;

  const completedCount = missions.filter((mission) => mission.status === "done").length;
  const habitsCompleted = habits.filter((habit) => habit.todayDone).length;
  const missionsTotal = missions.length;
  const openHabits = habits.filter((habit) => !habit.todayDone && !habit.todaySkipped);
  const topTasks = missions
    .filter((mission) => mission.status !== "done")
    .sort((left, right) => priorityWeight(right.priority) - priorityWeight(left.priority))
    .slice(0, 3);
  const todayStr = new Date().toISOString().split("T")[0];

  const revenueObjectives = objectives.filter(
    (objective) =>
      objective.rollup_type === "revenue" &&
      objective.monthlyTarget > 0 &&
      objective.start_date <= todayStr &&
      (!objective.deadline || objective.deadline >= todayStr)
  );
  const activeObjectives = objectives.filter(
    (objective) =>
      objective.targetValue > 0 &&
      objective.start_date <= todayStr &&
      (!objective.deadline || objective.deadline >= todayStr)
  );
  const monthlyRevenueTarget = revenueObjectives.reduce((sum, objective) => sum + objective.monthlyTarget, 0);
  const revenueDelta = mtdTotal - monthlyRevenueTarget;

  const currentHour = new Date().getHours();
  const isLate = currentHour >= 20;
  const streakNeedsAttention = streak >= 3 && habitsCompleted === 0 && isLate;
  const streakAtRisk = streakNeedsAttention && recoveryAvailable === 0;

  // Comeback mechanic: detect users returning after a streak break.
  // Show a supportive reset message instead of a silent zero.
  const hadStreakBefore = streak === 0 && (completedCount > 0 || habitsCompleted > 0);
  const isReturningUser = !isLoading && streak === 0 && (missionsTotal > 0 || habits.length > 0);

  const nextBestAction = (() => {
    if (streakNeedsAttention) {
      return {
        title: recoveryAvailable > 0 ? "Use the free recovery window" : "Protect your streak now",
        detail:
          recoveryAvailable > 0
            ? "One miss is forgiven every 7 days. Close a habit tonight so the recovery stays unused."
            : "You are late in the day with no completed habits. Close one habit before midnight.",
        href: "/systems",
        cta: "Open Habits",
      };
    }

    if (missionsTotal === 0) {
      return {
        title: "Set today's top 3 tasks",
        detail: "The system has nothing to execute until you define today's work.",
        href: "/missions?quickAdd=1",
        cta: "Add Tasks",
      };
    }

    if (topTasks.length > 0) {
      return {
        title: `Ship: ${topTasks[0].title}`,
        detail: "Move the highest-value open task before you widen the day.",
        href: "/missions",
        cta: "Open Tasks",
      };
    }

    if (openHabits.length > 0) {
      return {
        title: "Close the remaining habits",
        detail: `${openHabits.length} habit${openHabits.length !== 1 ? "s" : ""} still open today.`,
        href: "/systems",
        cta: "Finish Habits",
      };
    }

    if (monthlyRevenueTarget > 0 && revenueDelta < 0) {
      return {
        title: "Revenue is behind pace",
        detail: `${formatCurrency(Math.abs(revenueDelta))} behind this month's target pace.`,
        href: "/revenue?quickAdd=entry",
        cta: "Log Revenue",
      };
    }

    if (activeObjectives.length === 0) {
      return {
        title: "Create your first theme",
        detail: "Objectives are still disconnected. Add one theme to tie work to outcomes.",
        href: "/goals?quickAdd=1",
        cta: "Create Theme",
      };
    }

    return {
      title: "Close the loop",
      detail: "Execution is clean. Capture revenue, review outcomes, and prepare tomorrow.",
      href: "/review",
      cta: "Open Review",
    };
  })();

  const stats = [
    {
      label: "Revenue Pace",
      value: monthlyRevenueTarget > 0 ? `${formatCurrency(mtdTotal)} / ${formatCurrency(monthlyRevenueTarget)}` : formatCurrency(mtdTotal),
      change:
        monthlyRevenueTarget > 0
          ? `${revenueDelta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(revenueDelta))} vs pace`
          : "Add a revenue theme",
      changeColor: revenueDelta >= 0 ? "text-emerald-500" : "text-red-400",
      icon: <IconRevenue size={18} className="text-emerald-500" />,
    },
    {
      label: "Tasks Done",
      value: `${completedCount}/${missionsTotal}`,
      change: missionsTotal > 0 ? `${Math.round((completedCount / missionsTotal) * 100)}% complete` : "No tasks set",
      changeColor: "text-axis-accent",
      icon: <IconTarget size={18} className="text-axis-accent" />,
    },
    {
      label: "Themes Active",
      value: `${activeObjectives.length}`,
      change: activeObjectives.length > 0 ? `${objectives.filter((objective) => objective.outcomePct >= 100).length} on pace` : "Create your first theme",
      changeColor: "text-blue-400",
      icon: <IconBriefing size={18} className="text-blue-400" />,
    },
    {
      label: "Focus Score",
      value: axisScore.score.toString(),
      change: `Grade | ${axisScore.grade}`,
      changeColor: "text-violet-500",
      icon: <IconFocus size={18} className="text-violet-500" />,
    },
  ];

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header — greeting + hero score zone */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-axis-accent/10 border border-axis-accent/20">
            <IconCommand size={22} className="text-axis-accent" />
          </div>
          <div>
            {isLoading ? (
              <><Skeleton className="h-6 w-40 mb-1" /><Skeleton className="h-4 w-24" /></>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  {getGreeting()}, {user?.name || "there"}
                  {streak >= 7 && <span className="ml-2 text-base">🔥</span>}
                </h2>
                <p className="text-[11px] font-mono tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                  {formatDate(new Date())}
                  {streak > 0 && (
                    <span className="ml-2 text-axis-accent font-semibold">· {streak}-day streak</span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
        {/* Grade + Score hero — primary focal point on desktop */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold leading-none text-axis-accent font-mono">{axisScore.grade}</p>
                <p className="text-[9px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY</p>
              </div>
              <div className="w-px h-8" style={{ backgroundColor: "var(--border-primary)" }} />
              <div className="text-center">
                <p className="text-2xl font-bold leading-none font-mono" style={{ color: "var(--text-primary)" }}>{axisScore.score}</p>
                <p className="text-[9px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>FOCUS</p>
              </div>
            </div>
          )}
          <div className="hidden md:block">
            <AxisScoreWidget {...axisScore} loading={isLoading} compact />
          </div>
        </div>
      </div>

      {/* Comeback banner — for users returning after a streak break */}
      {!isLoading && isReturningUser && !streakNeedsAttention && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="axis-card border-axis-accent/20 bg-axis-accent/5 p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <IconStreak size={20} className="text-axis-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>Welcome back. Today is day one of your next streak.</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Complete one mission and one habit — that&apos;s all it takes to restart momentum.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak attention banner — supportive, not punishing */}
      {!isLoading && (streakAtRisk || streakNeedsAttention) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="axis-card border-amber-500/20 bg-amber-500/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconWarning size={20} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {streak > 0 ? `Your ${streak}-day streak needs one more thing today.` : "Today's still yours."}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {recoveryAvailable > 0
                  ? `Close a habit to protect your streak — you have a recovery buffer available.`
                  : `Log one habit before midnight to keep the streak alive.`}
              </p>
            </div>
          </div>
          <Link href="/systems" className="w-full md:w-auto text-xs font-semibold bg-axis-accent text-axis-dark px-6 py-2.5 rounded-xl hover:scale-105 transition-all text-center shrink-0">
            Open Habits
          </Link>
        </motion.div>
      )}

      {/* Main Operating Surface */}
      <div className="axis-card">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
              Today
            </p>
            <h3 className="mt-1 text-2xl font-semibold">One operating surface for the day</h3>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
              Top tasks, open habits, revenue pace, and the next action are all visible in one place.
            </p>
          </div>
          <div className="hidden rounded-2xl px-4 py-3 lg:block" style={{ backgroundColor: "var(--bg-tertiary)" }}>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
              Recovery Buffer
            </p>
            <p className="mt-2 text-lg font-semibold">{recoveryAvailable}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-5">
            <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <IconTarget size={16} className="text-axis-accent" />
                  Top 3 Tasks
                </h4>
                <Link href="/missions" className="text-xs font-mono text-axis-accent hover:underline">
                  View all
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div>
              ) : topTasks.length === 0 ? (
                <EmptyState
                  icon={<IconTarget size={18} className="text-axis-accent" />}
                  title="No open tasks"
                  description="Set today's top priorities before the day gets fragmented."
                  actions={[{ label: "Add Task", href: "/missions?quickAdd=1" }]}
                  compact
                />
              ) : (
                <div className="space-y-2">
                  {topTasks.map((mission) => (
                    <div key={mission.id} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <button
                        onClick={() => toggleMission(mission.id)}
                        className={`relative flex h-6 w-6 items-center justify-center rounded-lg border-2 ${
                          mission.status === "done" ? "border-axis-accent bg-axis-accent" : "border-white/10 hover:border-axis-accent/50"
                        }`}
                      >
                        <AnimatePresence>
                          {mission.status === "done" ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <IconCheck size={12} className="text-axis-dark" />
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${mission.status === "done" ? "line-through opacity-30" : ""}`}>{mission.title}</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/20">
                          {mission.priority} priority
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <IconHabits size={16} className="text-axis-accent" />
                  Open Habits
                </h4>
                <Link href="/systems" className="text-xs font-mono text-axis-accent hover:underline">
                  View all
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div>
              ) : openHabits.length === 0 ? (
                <div className="flex items-center gap-3 px-1 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-axis-accent/10">
                    <IconCheck size={14} className="text-axis-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All systems clear.</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Every habit logged. Strong day.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {openHabits.slice(0, 4).map((habit) => (
                    <div key={habit.id} className="flex items-center gap-3 rounded-2xl px-3 py-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-axis-accent/10">
                        <IconHabits size={16} className="text-axis-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{habit.name}</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/20">
                          {habit.streak} day streak
                        </p>
                      </div>
                      <button
                        onClick={() => toggleHabit(habit.id, "done")}
                        className="rounded-lg bg-axis-accent px-3 py-2 text-xs font-semibold text-axis-dark hover:scale-105 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <AxisScoreWidget {...axisScore} loading={isLoading} />

            <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <div className="mb-3 flex items-center gap-2">
                <IconRevenue size={16} className="text-emerald-500" />
                <p className="text-sm font-semibold">Revenue Pace</p>
              </div>
              <p className="text-3xl font-semibold tracking-tight">{formatCurrency(mtdTotal)}</p>
              <p className="mt-2 text-sm text-white/40">
                {monthlyRevenueTarget > 0
                  ? `${revenueDelta >= 0 ? "Ahead of" : "Behind"} pace: ${formatCurrency(Math.abs(revenueDelta))} vs target of ${formatCurrency(monthlyRevenueTarget)} this month.`
                  : "No revenue theme is setting a monthly pace yet."}
              </p>
            </div>

            <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/20">
                Next Best Action
              </p>
              <p className="text-lg font-semibold tracking-tight">{nextBestAction.title}</p>
              <p className="mt-2 text-sm text-white/40">
                {nextBestAction.detail}
              </p>
              <Link href={nextBestAction.href} className="mt-4 inline-flex rounded-xl bg-axis-accent px-4 py-2 text-sm font-semibold text-axis-dark hover:scale-105 transition-all">
                {nextBestAction.cta}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
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

      {/* Briefing Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconBriefing size={16} className="text-axis-accent" />
              Briefing
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-white/40">
              {streak > 0 ? (
                <>
                  The streak is at <span className="font-semibold text-axis-accent">{streak} days</span>.
                  {recoveryAvailable > 0 ? ` ${recoveryAvailable} free recovery window${recoveryAvailable !== 1 ? "s are" : " is"} still unused.` : " No recovery buffer is left."}
                </>
              ) : (
                <>Start the system today by closing one task and one habit.</>
              )}{" "}
              {activeObjectives.length > 0
                ? `${activeObjectives.filter((objective) => objective.outcomePct >= 100).length} theme${activeObjectives.filter((objective) => objective.outcomePct >= 100).length !== 1 ? "s are" : " is"} on pace.`
                : "You have no active themes yet."}
            </p>
          )}
        </div>

        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconRevenue size={16} className="text-emerald-500" />
              Revenue Delta
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-white/40">
              {monthlyRevenueTarget > 0
                ? `This month is ${revenueDelta >= 0 ? "ahead of" : "behind"} pace by ${formatCurrency(Math.abs(revenueDelta))} against a target track of ${formatCurrency(monthlyRevenueTarget)}.`
                : "No revenue pace exists until at least one revenue theme is created and linked to a stream."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
