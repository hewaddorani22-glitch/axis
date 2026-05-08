"use client";

import { getGreeting, formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import { useLocale } from "@/lib/i18n/provider";
import {
  IconCommand, IconRevenue, IconTarget, IconStreak,
  IconBriefing, IconCheck, IconHabits, IconWarning
} from "@/components/icons";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { AxisScoreWidget } from "@/components/app/axis-score-widget";
import { useAxisScore } from "@/hooks/useAxisScore";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeCeremony } from "@/components/app/welcome-ceremony";
import { StreakShare } from "@/components/app/streak-share";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";

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
  const axisScore = useAxisScore();
  const { t } = useLocale();

  const currentHour = new Date().getHours();
  const isLate = currentHour >= 20;
  const streakAtRisk = streak >= 3 && habitsCompleted === 0 && isLate;
  const hasStarted = missionsTotal > 0 || habitsTotal > 0 || completedCount > 0 || habitsCompleted > 0 || streak > 0;

  const greeting = getGreeting();
  const displayName = user?.name || "there";
  const isLoading = userLoading || missionsLoading || habitsLoading || revenueLoading || streakLoading || axisScore.loading;

  // Climber/Builder segments without side-income see habits instead of revenue.
  // Hustlers and Creators always see revenue (it's their North Star metric).
  const userType = user?.user_type;
  const showRevenue =
    userType === "entrepreneur" ||
    userType === "creator" ||
    mtdTotal > 0;

  const stats = [
    showRevenue
      ? { label: "MTD Revenue", value: formatCurrency(mtdTotal), change: mtdTotal > 0 ? "This month" : "No entries yet", changeColor: "text-emerald-500", icon: <IconRevenue size={18} className="text-emerald-500" />, extra: null }
      : { label: "Habits Done", value: `${habitsCompleted}/${habitsTotal}`, change: habitsTotal > 0 ? `${Math.round((habitsCompleted / Math.max(habitsTotal, 1)) * 100)}%` : "Add habits", changeColor: "text-axis-accent", icon: <IconHabits size={18} className="text-axis-accent" />, extra: null },
    { label: "Tasks Done", value: `${completedCount}/${missionsTotal}`, change: missionsTotal > 0 ? `${Math.round((completedCount / missionsTotal) * 100)}%` : "Add tasks", changeColor: "text-emerald-500", icon: <IconTarget size={18} className="text-axis-accent" />, extra: null },
    { label: t("preview.streak"), value: `${streak} ${streak === 1 ? t("preview.streak.unit") : t("preview.streak.units")}`, change: streak >= 7 ? t("dash.streak.fire") : streak > 0 ? t("dash.streak.keep") : t("dash.streak.start"), changeColor: "text-orange-500", icon: <IconStreak size={18} className="text-orange-500" />, extra: <StreakShare streak={streak} name={displayName} score={axisScore.score} /> },
  ];

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  const nextMission = missions.find((mission) => mission.status !== "done");
  const kickoff = (() => {
    if (missionsTotal === 0) {
      return {
        eyebrow: t("dash.kick.s1.eyebrow"),
        title: t("dash.kick.s1.title"),
        description: t("dash.kick.s1.desc"),
        primaryHref: "/missions?quickAdd=1",
        primaryLabel: t("dash.kick.s1.primary"),
        secondaryHref: "/systems?quickAdd=1",
        secondaryLabel: t("dash.kick.s1.secondary"),
      };
    }

    if (completedCount < missionsTotal && nextMission) {
      const left = missionsTotal - completedCount;
      return {
        eyebrow: t("dash.kick.s2.eyebrow"),
        title: nextMission.title,
        description:
          left === 1
            ? t("dash.kick.s2.left.one")
            : t("dash.kick.s2.left.many", { n: String(left) }),
        primaryHref: "/missions",
        primaryLabel: t("dash.kick.s2.primary"),
        secondaryHref: habitsTotal === 0 ? "/systems?quickAdd=1" : "/systems",
        secondaryLabel: habitsTotal === 0 ? t("dash.kick.s2.secondary.add") : t("dash.kick.s2.secondary.open"),
      };
    }

    if (habitsTotal === 0) {
      return {
        eyebrow: t("dash.kick.s3.eyebrow"),
        title: t("dash.kick.s3.title"),
        description: t("dash.kick.s3.desc"),
        primaryHref: "/systems?quickAdd=1",
        primaryLabel: t("dash.kick.s3.primary"),
        secondaryHref: "/review",
        secondaryLabel: t("dash.kick.s3.secondary"),
      };
    }

    if (habitsCompleted === 0) {
      return {
        eyebrow: t("dash.kick.s4.eyebrow"),
        title: t("dash.kick.s4.title"),
        description: t("dash.kick.s4.desc"),
        primaryHref: "/systems",
        primaryLabel: t("dash.kick.s4.primary"),
        secondaryHref: "/review",
        secondaryLabel: t("dash.kick.s4.secondary"),
      };
    }

    return {
      eyebrow: t("dash.kick.s5.eyebrow"),
      title: t("dash.kick.s5.title"),
      description: t("dash.kick.s5.desc"),
      primaryHref: "/review",
      primaryLabel: t("dash.kick.s5.primary"),
      secondaryHref: "/missions?quickAdd=1",
      secondaryLabel: t("dash.kick.s5.secondary"),
    };
  })();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <WelcomeCeremony name={user?.name || ""} />
      {/* Greeting */}
      <div className="flex items-start gap-4 sm:items-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
          <IconCommand size={22} className="text-axis-accent" />
        </div>
        <div className="min-w-0">
          {isLoading ? (
            <><Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-32" /></>
          ) : (
            <>
              <h2 className="truncate text-xl font-semibold">{greeting}, {displayName}</h2>
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
              <p className="text-red-500 font-bold mb-1">{t("dash.streak.risk.title", { streak: String(streak) })}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("dash.streak.risk.desc")}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <Link href="/systems" className="w-full text-xs font-semibold px-4 py-2 bg-axis-text1 text-axis-bg rounded-lg text-center hover:opacity-90 md:w-auto">
              Complete Habit
            </Link>
            {user?.plan !== "pro" && (
              <button
                onClick={() => openUpgradePrompt({ source: "streak_risk" })}
                className="w-full text-xs font-semibold px-4 py-2 bg-axis-accent text-axis-dark rounded-lg text-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(205,255,79,0.3)] md:w-auto"
              >
                Unlock Freeze (Pro)
              </button>
            )}
            {user?.plan === "pro" && (
              <Link href="/systems" className="w-full text-xs font-semibold px-4 py-2 border border-axis-border text-axis-text2 hover:text-axis-text1 rounded-lg text-center hover:bg-axis-hover transition-all md:w-auto">
                Use Freeze
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-axis-accent/20 p-5 sm:p-6" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-axis-accent/12 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-axis-accent">
              <IconBriefing size={13} className="shrink-0" />
              {kickoff.eyebrow}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-balance" style={{ color: "var(--text-primary)" }}>
              {kickoff.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {kickoff.description}
            </p>
            <p className="mt-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
              {streak > 0
                ? `${t("dash.streak.live", { streak: String(streak) })}${streak < 30 ? t("dash.streak.live.30", { n: String(30 - streak) }) : t("dash.streak.live.keep")}`
                : t("dash.streak.empty")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={kickoff.primaryHref} className="inline-flex items-center justify-center rounded-xl bg-axis-text1 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90">
              {kickoff.primaryLabel}
            </Link>
            <Link href={kickoff.secondaryHref} className="inline-flex items-center justify-center rounded-xl border border-axis-border px-4 py-3 text-sm font-semibold transition-all hover:bg-axis-hover" style={{ color: "var(--text-primary)" }}>
              {kickoff.secondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <motion.div variants={itemVariants} key={stat.label} className="axis-stat-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{stat.label}</span>
              {stat.icon}
            </div>
            {isLoading ? <Skeleton className="h-8 w-20 mb-2" /> : <p className="text-2xl font-bold mb-1">{stat.value}</p>}
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs font-mono ${stat.changeColor}`}>{stat.change}</p>
              {!isLoading && stat.extra}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two columns — Tasks + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconTarget size={16} className="text-axis-accent" /> Today&apos;s Tasks
            </h3>
            <Link href="/missions" className="text-xs font-mono text-axis-accent hover:underline">View all →</Link>
          </div>
          {missionsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : missions.length === 0 ? (
            <EmptyState
              icon={<IconTarget size={20} className="text-axis-accent" />}
              title={t("dash.empty.missions.title")}
              description={t("dash.empty.missions.desc")}
              actions={[{ label: t("dash.empty.missions.cta"), href: "/missions?quickAdd=1" }]}
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
                  <span className={`min-w-0 flex-1 truncate text-sm ${m.status === "done" ? "line-through" : ""}`} style={{ color: m.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}>{m.title}</span>
                  <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md ${m.priority === "high" ? "bg-red-500/10 text-red-500" : m.priority === "med" ? "bg-amber-500/10 text-amber-500" : "text-gray-400"}`}>{m.priority}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Habits */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <IconHabits size={16} className="text-axis-accent" /> Habits
            </h3>
            <Link href="/systems" className="text-xs font-mono text-axis-accent hover:underline">View all →</Link>
          </div>
          {habitsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : habits.length === 0 ? (
            <EmptyState
              icon={<IconHabits size={20} className="text-axis-accent" />}
              title={t("dash.empty.habits.title")}
              description={t("dash.empty.habits.desc")}
              actions={[{ label: t("dash.empty.habits.cta"), href: "/systems?quickAdd=1" }]}
              compact
            />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
              {habits.map((h) => (
                <motion.div variants={itemVariants} key={h.id} className="flex items-center gap-3 py-3 px-3 rounded-xl transition-colors sm:gap-4" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: h.todayDone ? "var(--bg-accent-soft)" : h.todaySkipped ? "rgba(245, 158, 11, 0.1)" : "var(--bg-tertiary)" }}>
                    <IconHabits size={16} className={h.todayDone ? "text-axis-accent" : h.todaySkipped ? "text-amber-500" : ""} style={{ color: h.todayDone || h.todaySkipped ? undefined : "var(--text-tertiary)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: h.todayDone || h.todaySkipped ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: h.todaySkipped ? "line-through" : "none" }}>{h.name}</p>
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

      {hasStarted && (
        <motion.div variants={itemVariants} initial="hidden" animate="show">
          <AxisScoreWidget {...axisScore} loading={axisScore.loading} />
        </motion.div>
      )}
    </div>
  );
}
