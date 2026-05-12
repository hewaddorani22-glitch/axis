"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import { useLocale } from "@/lib/i18n/provider";
import { useAxisScore } from "@/hooks/useAxisScore";
import {
  IconCheck, IconHabits, IconTarget, IconWarning, IconStreak,
} from "@/components/icons";
import { EmptyState } from "@/components/app/empty-state";
import { AxisScoreWidget } from "@/components/app/axis-score-widget";
import { WelcomeCeremony } from "@/components/app/welcome-ceremony";
import { StreakShare } from "@/components/app/streak-share";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";

type DayPart = "morning" | "afternoon" | "evening";

function getDayPart(): DayPart {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function Ring({
  value, max, size, stroke, color, children,
}: {
  value: number; max: number; size: number; stroke: number; color: string;
  children?: React.ReactNode;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--bg-tertiary)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={animated ? c * (1 - pct) : c}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function Pill({ text, color, dim, icon }: { text: string; color: string; dim: string; icon?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.12em]"
      style={{ backgroundColor: dim, color }}
    >
      {icon}
      {text}
    </span>
  );
}

function useScoreCounter(target: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) { setN(0); return; }
    let start: number | null = null;
    let raf = 0;
    const dur = 1400;
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setN(Math.round(ease(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const to = setTimeout(() => { raf = requestAnimationFrame(tick); }, 300);
    return () => { clearTimeout(to); cancelAnimationFrame(raf); };
  }, [target]);
  return n;
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { missions, completedCount, total: missionsTotal, toggleMission, loading: missionsLoading } = useMissions();
  const { habits, toggleHabit, completedToday: habitsCompleted, total: habitsTotal, loading: habitsLoading } = useHabits();
  const { mtdTotal, loading: revenueLoading } = useRevenue();
  const { streak, loading: streakLoading } = useStreak();
  const axisScore = useAxisScore();
  const { t } = useLocale();

  const [dayPart, setDayPart] = useState<DayPart>("morning");
  useEffect(() => { setDayPart(getDayPart()); }, []);

  const isLoading =
    userLoading || missionsLoading || habitsLoading || revenueLoading || streakLoading || axisScore.loading;

  const userType = user?.user_type;
  const showRevenue =
    userType === "entrepreneur" || userType === "creator" || mtdTotal > 0;

  const tasksLeft = Math.max(missionsTotal - completedCount, 0);
  const habitsLeft = Math.max(habitsTotal - habitsCompleted, 0);
  const allDone =
    missionsTotal > 0 && habitsTotal > 0 &&
    completedCount === missionsTotal && habitsCompleted === habitsTotal;

  const hasStarted =
    missionsTotal > 0 || habitsTotal > 0 ||
    completedCount > 0 || habitsCompleted > 0 || streak > 0;

  const currentHour = new Date().getHours();
  const isLate = currentHour >= 20;
  const streakAtRisk = streak >= 3 && habitsCompleted === 0 && isLate;

  // Soft semantic colors (from globals.css tokens)
  const SOFT_GREEN = "var(--soft-green)";
  const SOFT_GREEN_DIM = "var(--soft-green-dim)";
  const WARM = "var(--soft-warm)";
  const WARM_DIM = "var(--soft-warm-dim)";
  const CORAL = "var(--soft-coral)";
  const LAV = "var(--soft-lav)";
  const PLUM = "var(--soft-plum)";
  const ACCENT = "var(--accent)";

  const score = axisScore.score ?? 0;
  const scoreAnimated = useScoreCounter(score);
  const scoreColor =
    score >= 70 ? SOFT_GREEN : score >= 40 ? WARM : score >= 1 ? CORAL : "var(--text-tertiary)";

  const displayName = user?.name || "there";

  const greetings: Record<DayPart, { h: string; sub: string }> = {
    morning: {
      h: "Good morning",
      sub: "Your day is waiting. What do you want to ship today?",
    },
    afternoon: {
      h: completedCount > 0 ? "Keep going" : "Let's pick it up",
      sub: missionsTotal > 0
        ? `${completedCount} of ${missionsTotal} tasks done. You're on track.`
        : "Add a task to get the day moving.",
    },
    evening: {
      h: allDone ? "Strong day" : "Almost there",
      sub: allDone
        ? "Everything done. Plan tomorrow and keep the flow."
        : tasksLeft > 0
          ? `${tasksLeft} task${tasksLeft === 1 ? "" : "s"} left. Last chance today.`
          : "Wrap up your habits to lock in the day.",
    },
  };
  const g = greetings[dayPart];

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  const priColors: Record<string, string> = {
    high: CORAL,
    med: WARM,
    low: "var(--text-tertiary)",
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <WelcomeCeremony name={user?.name || ""} />

      {/* Greeting */}
      <div className="flex items-start gap-4 sm:items-center">
        <div className="min-w-0">
          {isLoading ? (
            <><Skeleton className="h-7 w-56 mb-2" /><Skeleton className="h-4 w-32" /></>
          ) : (
            <>
              <p className="text-[11px] font-mono mb-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                {formatDate(new Date())}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {g.h}, <span style={{ color: ACCENT }}>{displayName}</span>
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>{g.sub}</p>
            </>
          )}
        </div>
      </div>

      {/* Streak at risk */}
      {!isLoading && streakAtRisk && (
        <div
          className="rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--soft-coral-dim)", border: "1px solid var(--soft-coral)" }}
        >
          <div className="flex items-start gap-4">
            <IconWarning size={26} style={{ color: CORAL }} />
            <div>
              <p className="font-bold mb-1" style={{ color: CORAL }}>
                {t("dash.streak.risk.title", { streak: String(streak) })}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("dash.streak.risk.desc")}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <Link href="/systems" className="w-full text-xs font-semibold px-4 py-2 rounded-lg text-center md:w-auto"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--text-inverted)" }}>
              Complete Habit
            </Link>
            {user?.plan !== "pro" && (
              <button
                onClick={() => openUpgradePrompt({ source: "streak_risk" })}
                className="w-full text-xs font-semibold px-4 py-2 rounded-lg text-center hover:scale-105 transition-all md:w-auto"
                style={{ backgroundColor: ACCENT, color: "var(--accent-text)" }}
              >
                Unlock Freeze (Pro)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero card — adapts to time of day */}
      {!isLoading && dayPart === "morning" && hasStarted && (
        <div className="rounded-2xl px-4 sm:px-7 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <Ring value={Math.min(streak, 30)} max={30} size={52} stroke={4} color={WARM}>
              <span className="text-lg sm:text-xl font-extrabold" style={{ color: WARM }}>{streak}</span>
            </Ring>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-semibold">
                {streak === 0 ? "Start your streak today" : `${streak}-day streak`}
              </div>
              <div className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {streak === 0
                  ? "Finish 1 task + 1 habit to begin."
                  : "Finish at least 1 task + 1 habit to keep it."}
              </div>
            </div>
          </div>
          {streak > 0 && (
            <div className="shrink-0">
              <Pill text={streak >= 30 ? "Legendary" : streak >= 14 ? "16 → 30" : "Day by day"}
                color={WARM} dim={WARM_DIM} icon={<IconStreak size={12} />} />
            </div>
          )}
        </div>
      )}

      {!isLoading && dayPart === "afternoon" && missionsTotal > 0 && (
        <div className="rounded-2xl px-4 sm:px-7 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-7"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
          <Ring value={completedCount} max={missionsTotal} size={64} stroke={5}
            color={completedCount === missionsTotal ? SOFT_GREEN : WARM}>
            <span className="text-xl sm:text-2xl font-extrabold">{completedCount}</span>
            <span className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>/{missionsTotal}</span>
          </Ring>
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-base font-semibold mb-1">
              {tasksLeft === 0 ? "All tasks done" : `${tasksLeft} task${tasksLeft === 1 ? "" : "s"} left`}
            </div>
            <div className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              {streak > 0 ? `Your ${streak}-day streak is safe — finish strong.` : "Knock out the rest and lock in the day."}
            </div>
          </div>
          {hasStarted && score > 0 && (
            <div className="rounded-xl px-5 py-3 text-center hidden sm:block"
              style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>SCORE</span>
              <div className="text-2xl font-extrabold" style={{ color: scoreColor }}>{scoreAnimated}</div>
            </div>
          )}
        </div>
      )}

      {!isLoading && dayPart === "evening" && hasStarted && (
        <div className="rounded-2xl px-5 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: `1px solid ${allDone ? "var(--soft-green)" : "var(--border-primary)"}`,
          }}>
          <div className="max-w-md">
            <Pill
              text={allDone ? "Day complete" : "Open"}
              color={allDone ? SOFT_GREEN : WARM}
              dim={allDone ? SOFT_GREEN_DIM : WARM_DIM}
            />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight mt-3 mb-2">
              {allDone ? "Perfect day. Streak locked." : tasksLeft > 0 ? `${tasksLeft} task${tasksLeft === 1 ? "" : "s"} left.` : "Wrap up your habits."}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {allDone
                ? `Day ${streak} is in the books. Plan tomorrow.`
                : "Every task you finish lifts your score."}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link href="/review" className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--text-inverted)" }}>
                Plan tomorrow
              </Link>
              <Link href="/review" className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                Weekly Review
              </Link>
            </div>
          </div>
          <Ring value={score} max={100} size={100} stroke={6} color={scoreColor}>
            <span className="text-3xl sm:text-4xl font-extrabold">{scoreAnimated}</span>
            <span className="text-[9px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}>SCORE</span>
          </Ring>
        </div>
      )}

      {/* Empty-state hero */}
      {!isLoading && !hasStarted && (
        <div className="rounded-2xl p-7"
          style={{ backgroundColor: "var(--bg-accent-soft)", border: "1px solid var(--border-primary)" }}>
          <Pill text={t("dash.kick.s1.eyebrow")} color={ACCENT} dim="var(--bg-accent-soft)" />
          <h3 className="text-xl font-bold tracking-tight mt-3 mb-1">{t("dash.kick.s1.title")}</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{t("dash.kick.s1.desc")}</p>
          <div className="flex gap-2">
            <Link href="/missions?quickAdd=1" className="text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: ACCENT, color: "var(--accent-text)" }}>
              {t("dash.kick.s1.primary")}
            </Link>
            <Link href="/systems?quickAdd=1" className="text-sm font-semibold px-5 py-2.5 rounded-xl border"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}>
              {t("dash.kick.s1.secondary")}
            </Link>
          </div>
        </div>
      )}

      {/* Metric trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          showRevenue
            ? {
                label: "MTD Revenue",
                value: formatCurrency(mtdTotal),
                num: mtdTotal, total: 0,
                color: mtdTotal > 0 ? SOFT_GREEN : "var(--text-tertiary)",
                sub: mtdTotal > 0 ? "This month" : "No entries yet",
                pill: mtdTotal > 0 ? "Live" : "—",
                progress: 0,
              }
            : {
                label: "Habits",
                value: `${habitsCompleted}`,
                num: habitsCompleted, total: habitsTotal,
                color: habitsTotal && habitsCompleted === habitsTotal
                  ? SOFT_GREEN
                  : habitsCompleted > 0 ? LAV : "var(--text-tertiary)",
                sub: habitsTotal === 0 ? "Add habits" : habitsCompleted === habitsTotal
                  ? "All done" : `${habitsLeft} open`,
                pill: `${habitsCompleted}/${habitsTotal || 0}`,
                progress: habitsTotal > 0 ? habitsCompleted / habitsTotal : 0,
              },
          {
            label: "Tasks",
            value: `${completedCount}`,
            num: completedCount, total: missionsTotal,
            color: missionsTotal && completedCount === missionsTotal
              ? SOFT_GREEN : completedCount > 0 ? SOFT_GREEN : "var(--text-tertiary)",
            sub: missionsTotal === 0 ? "Add tasks" : completedCount === missionsTotal
              ? "Complete" : "In progress",
            pill: `${completedCount}/${missionsTotal || 0}`,
            progress: missionsTotal > 0 ? completedCount / missionsTotal : 0,
          },
          {
            label: t("preview.streak"),
            value: `${streak}`,
            num: streak, total: 30,
            color: WARM,
            sub: streak >= 30 ? "Legendary" : `${30 - streak} to milestone`,
            pill: `${streak}d`,
            isStreak: true,
            progress: Math.min(streak / 30, 1),
            extra: <StreakShare streak={streak} name={displayName} score={axisScore.score} />,
          },
        ].map((m, i) => (
          <div key={i} className="axis-stat-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}>{m.label}</span>
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  color: m.color,
                  backgroundColor: m.color.startsWith("var(") ? "var(--bg-tertiary)" : `${m.color}1f`,
                }}
              >
                {m.pill}
              </span>
            </div>
            {isLoading ? <Skeleton className="h-9 w-24 mb-2" /> : (
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none flex items-baseline gap-1">
                {m.value}
                {!("isStreak" in m && m.isStreak) && m.total > 0 && (
                  <span className="text-base font-medium" style={{ color: "var(--text-tertiary)" }}>
                    /{m.total}
                  </span>
                )}
                {"isStreak" in m && m.isStreak && streak > 0 && (
                  <span className="text-base ml-1">🔥</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-xs font-medium" style={{ color: m.color }}>{m.sub}</p>
              {!isLoading && "extra" in m && m.extra}
            </div>
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((m.progress || 0) * 100)}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.08 }}
                className="h-full rounded-full"
                style={{ backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tasks + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
        {/* Tasks */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <IconTarget size={16} style={{ color: ACCENT }} /> Today&apos;s Tasks
              </h3>
              <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                {missionsTotal === 0
                  ? "Plan your day"
                  : `${completedCount}/${missionsTotal} done`}
              </span>
            </div>
            <Link href="/missions" className="text-xs font-mono hover:underline" style={{ color: ACCENT }}>
              View all →
            </Link>
          </div>
          {missionsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
          ) : missions.length === 0 ? (
            <EmptyState
              icon={<IconTarget size={20} style={{ color: ACCENT }} />}
              title={t("dash.empty.missions.title")}
              description={t("dash.empty.missions.desc")}
              actions={[{ label: t("dash.empty.missions.cta"), href: "/missions?quickAdd=1" }]}
              compact
            />
          ) : (
            <div className="space-y-1.5">
              {missions.slice(0, 5).map((m) => (
                <div key={m.id}
                  className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}>
                  <button
                    onClick={() => toggleMission(m.id)}
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center transition-all relative",
                    )}
                    style={{
                      backgroundColor: m.status === "done" ? SOFT_GREEN : "transparent",
                      border: `2px solid ${m.status === "done" ? SOFT_GREEN : "var(--border-secondary)"}`,
                    }}
                  >
                    <AnimatePresence>
                      {m.status === "done" && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <IconCheck size={12} style={{ color: "var(--text-inverted)" }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <span
                    className={cn("min-w-0 flex-1 truncate text-sm", m.status === "done" && "line-through")}
                    style={{ color: m.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}
                  >
                    {m.title}
                  </span>
                  <span
                    className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      color: priColors[m.priority] || "var(--text-tertiary)",
                      backgroundColor: m.priority === "high"
                        ? "var(--soft-coral-dim)"
                        : m.priority === "med"
                          ? "var(--soft-warm-dim)"
                          : "var(--bg-secondary)",
                    }}
                  >
                    {m.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <IconHabits size={16} style={{ color: ACCENT }} /> Habits
              </h3>
              <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                {habitsTotal === 0
                  ? "Start your routines"
                  : `${habitsCompleted}/${habitsTotal} today`}
              </span>
            </div>
            <Link href="/systems" className="text-xs font-mono hover:underline" style={{ color: ACCENT }}>
              View all →
            </Link>
          </div>

          {habitsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : habits.length === 0 ? (
            <EmptyState
              icon={<IconHabits size={20} style={{ color: ACCENT }} />}
              title={t("dash.empty.habits.title")}
              description={t("dash.empty.habits.desc")}
              actions={[{ label: t("dash.empty.habits.cta"), href: "/systems?quickAdd=1" }]}
              compact
            />
          ) : (
            <div className="space-y-2">
              {habits.map((h, i) => {
                const habitColor = i % 3 === 0 ? LAV : i % 3 === 1 ? SOFT_GREEN : PLUM;
                const done = h.todayDone;
                return (
                  <div key={h.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      border: done ? `1px solid ${habitColor}` : "1px solid transparent",
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: done ? `${habitColor}` : "var(--bg-secondary)" }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: done ? "var(--text-inverted)" : "transparent" }}>
                        {done && <IconCheck size={12} style={{ color: habitColor }} />}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold"
                        style={{ color: done ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                        {h.name}
                      </p>
                      <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {h.streak} day streak
                      </p>
                    </div>
                    <button
                      onClick={() => toggleHabit(h.id, h.todayDone || h.todaySkipped ? "undo" : "done")}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                      style={{
                        color: done ? SOFT_GREEN : WARM,
                        backgroundColor: done ? SOFT_GREEN_DIM : WARM_DIM,
                      }}
                    >
                      {done ? "Done" : "Open"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week strip */}
          {habits.length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
              <div className="flex gap-1.5">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, i) => {
                  const todayIdx = (new Date().getDay() + 6) % 7;
                  const isToday = i === todayIdx;
                  // Use first habit's weekLog if available
                  const log = habits[0]?.weekLog?.[i];
                  const intensity = log === "done" ? 0.75 : log === "skipped" ? 0.3 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full h-6 rounded-md"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(110, 231, 183, ${intensity})`
                            : "var(--bg-tertiary)",
                          border: isToday ? `1px solid ${SOFT_GREEN}` : "none",
                        }}
                      />
                      <span className="text-[9px] font-mono font-semibold"
                        style={{ color: isToday ? SOFT_GREEN : "var(--text-tertiary)" }}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasStarted && (
        <AxisScoreWidget {...axisScore} loading={axisScore.loading} />
      )}
    </div>
  );
}
