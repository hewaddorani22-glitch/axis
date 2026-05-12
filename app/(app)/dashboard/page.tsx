"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useStreak } from "@/hooks/useStreak";
import { useForgeEnrollment, computeDayIndex } from "@/hooks/useForgeEnrollment";

const SERIF = "'Cormorant Garamond', serif";

interface PillarMeta {
  key: "body" | "mind" | "intellect";
  label: string;
  index: number; // 0-100
  weakest: boolean;
  intent: string;
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="h-[6px] w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "var(--forge-iron)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

export default function ForgePage() {
  const { user, loading: userLoading } = useUser();
  const { enrollment, loading: enrollLoading } = useForgeEnrollment();
  const {
    missions,
    completedCount,
    total: missionsTotal,
    toggleMission,
    loading: missionsLoading,
  } = useMissions();
  const {
    habits,
    toggleHabit,
    completedToday: habitsCompleted,
    total: habitsTotal,
    loading: habitsLoading,
  } = useHabits();
  const { streak } = useStreak();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const isLoading = userLoading || enrollLoading || missionsLoading || habitsLoading;

  const day = enrollment ? computeDayIndex(enrollment.started_at) : 1;
  const totalDays = 90;
  const dayLabel = `Day ${day} of ${totalDays}`;

  // Pillar scoring — for the visible Forge shell we derive provisional scores
  // from existing data: completion ratio on missions/habits, plus streak.
  // (Real pillar scoring comes with the Programs/Enrollments migration.)
  const missionRatio = missionsTotal > 0 ? completedCount / missionsTotal : 0;
  const habitRatio = habitsTotal > 0 ? habitsCompleted / habitsTotal : 0;
  const streakLift = Math.min(1, streak / 30);

  const bodyScore = Math.round(40 + habitRatio * 40 + streakLift * 20);
  const mindScore = Math.round(30 + habitRatio * 30 + missionRatio * 25 + streakLift * 15);
  const intellectScore = Math.round(30 + missionRatio * 50 + streakLift * 20);

  const pillarScores = [
    { key: "body" as const, value: bodyScore },
    { key: "mind" as const, value: mindScore },
    { key: "intellect" as const, value: intellectScore },
  ];
  const minScore = Math.min(...pillarScores.map((p) => p.value));

  const pillars: PillarMeta[] = [
    {
      key: "body",
      label: "Body",
      index: bodyScore,
      weakest: bodyScore === minScore,
      intent: enrollment?.pillars.body || "—",
    },
    {
      key: "mind",
      label: "Mind",
      index: mindScore,
      weakest: mindScore === minScore,
      intent: enrollment?.pillars.mind || "—",
    },
    {
      key: "intellect",
      label: "Intellect",
      index: intellectScore,
      weakest: intellectScore === minScore,
      intent: enrollment?.pillars.intellect || "—",
    },
  ];

  const forgeScore = Math.round((bodyScore + mindScore + intellectScore) / 3);

  // Today's stack: top 1 task and up to 2 habits, formatted as the daily prescription.
  const todayMission = missions.find((m) => m.status !== "done") || missions[0];
  const todayHabits = habits.slice(0, 2);

  const dispatchPillarLabel = (idx: number) => {
    if (idx === 0) return "Body";
    if (idx === 1) return "Mind";
    return "Intellect";
  };

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      {/* Vow header */}
      <header
        className="mb-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p
          className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          {dayLabel}
        </p>
        {enrollment ? (
          <>
            <p
              className="text-2xl leading-snug sm:text-3xl"
              style={{
                fontFamily: SERIF,
                color: "var(--forge-bone)",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              &ldquo;{enrollment.vow}&rdquo;
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--forge-shadow)" }}>
              — {user?.name || "you"}, your vow on day one
            </p>
          </>
        ) : (
          <>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              The forge awaits.
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              Take your vow to begin the ninety days.
            </p>
            <Link
              href="/onboarding"
              className="mt-5 inline-block rounded-[10px] px-6 py-3 text-sm font-semibold"
              style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
            >
              Take the vow
            </Link>
          </>
        )}
      </header>

      {/* Pillar bars */}
      <section
        className="mb-10 rounded-[14px] p-6 sm:p-7"
        style={{
          backgroundColor: "var(--forge-stone)",
          border: "1px solid var(--forge-edge)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.6s ease 0.1s",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <p
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            The Pillars
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--forge-shadow)" }}>
              Forge score
            </span>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--forge-gold)", fontFamily: SERIF }}
            >
              {forgeScore}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {pillars.map((p) => (
            <div key={p.key}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: p.weakest ? "var(--forge-gold)" : "var(--forge-ash)" }}
                  >
                    {p.label}
                  </span>
                  {p.weakest && (
                    <span
                      className="font-mono text-[9px] tracking-[0.18em]"
                      style={{ color: "var(--forge-gold)" }}
                    >
                      · weak
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold" style={{ color: "var(--forge-bone)" }}>
                  {p.index}
                </span>
              </div>
              <Bar value={p.index} color={p.weakest ? "var(--forge-gold)" : "var(--forge-bone)"} />
              <p
                className="mt-2 truncate text-[12px]"
                style={{ color: "var(--forge-shadow)" }}
                title={p.intent}
              >
                {p.intent}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Today's stack */}
      <section
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.6s ease 0.2s",
        }}
      >
        <div className="mb-5 flex items-baseline justify-between">
          <h2
            className="text-2xl tracking-tight"
            style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
          >
            Today&rsquo;s stack
          </h2>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            Three acts
          </span>
        </div>

        <div className="space-y-2">
          {/* Slot 1: Body — derived from first habit */}
          {todayHabits[0] ? (
            <StackRow
              pillarLabel="Body"
              title={todayHabits[0].name}
              detail={enrollment?.pillars.body || `${todayHabits[0].streak} day streak`}
              done={todayHabits[0].todayDone}
              onToggle={() =>
                toggleHabit(
                  todayHabits[0].id,
                  todayHabits[0].todayDone || todayHabits[0].todaySkipped ? "undo" : "done"
                )
              }
            />
          ) : (
            <EmptySlot pillarLabel="Body" href="/systems?quickAdd=1" />
          )}

          {/* Slot 2: Mind — second habit, or task */}
          {todayHabits[1] ? (
            <StackRow
              pillarLabel="Mind"
              title={todayHabits[1].name}
              detail={enrollment?.pillars.mind || `${todayHabits[1].streak} day streak`}
              done={todayHabits[1].todayDone}
              onToggle={() =>
                toggleHabit(
                  todayHabits[1].id,
                  todayHabits[1].todayDone || todayHabits[1].todaySkipped ? "undo" : "done"
                )
              }
            />
          ) : (
            <EmptySlot pillarLabel="Mind" href="/systems?quickAdd=1" />
          )}

          {/* Slot 3: Intellect — pulled from missions */}
          {todayMission ? (
            <StackRow
              pillarLabel="Intellect"
              title={todayMission.title}
              detail={enrollment?.pillars.intellect || "Today's task"}
              done={todayMission.status === "done"}
              onToggle={() => toggleMission(todayMission.id)}
            />
          ) : (
            <EmptySlot pillarLabel="Intellect" href="/missions?quickAdd=1" />
          )}
        </div>

        {/* Manage drawer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--forge-shadow)" }}>
            {isLoading
              ? "Loading the day…"
              : `${completedCount + habitsCompleted} of ${missionsTotal + habitsTotal} acts held today`}
          </p>
          <div className="flex gap-2">
            <Link
              href="/missions"
              className="rounded-[8px] px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{ border: "1px solid var(--forge-edge)", color: "var(--forge-ash)" }}
            >
              Manage Tasks
            </Link>
            <Link
              href="/systems"
              className="rounded-[8px] px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{ border: "1px solid var(--forge-edge)", color: "var(--forge-ash)" }}
            >
              Manage Habits
            </Link>
          </div>
        </div>
      </section>

      {/* Streak whisper */}
      {streak > 0 && (
        <div
          className="mt-10 rounded-[12px] px-5 py-4 text-sm"
          style={{
            backgroundColor: "var(--forge-stone)",
            border: "1px solid var(--forge-edge)",
            color: "var(--forge-ash)",
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--forge-gold)" }}>
            Held
          </span>{" "}
          <span style={{ color: "var(--forge-bone)" }}>{streak} days in a row.</span>{" "}
          <span>{streak < 7 ? "Most stop before the seventh." : streak < 30 ? "The path continues." : "Few reach this. Fewer still pass it."}</span>
        </div>
      )}
    </div>
  );
}

function StackRow({
  pillarLabel,
  title,
  detail,
  done,
  onToggle,
}: {
  pillarLabel: string;
  title: string;
  detail: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-4 rounded-[12px] px-5 py-4 text-left transition-colors"
      style={{
        backgroundColor: "var(--forge-stone)",
        border: "1px solid var(--forge-edge)",
        opacity: done ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!done) e.currentTarget.style.backgroundColor = "var(--forge-iron)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--forge-stone)";
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all"
        style={{
          backgroundColor: done ? "var(--forge-gold)" : "transparent",
          borderColor: done ? "var(--forge-gold)" : "var(--forge-edge)",
        }}
      >
        {done && (
          <span className="text-xs font-extrabold" style={{ color: "var(--forge-void)" }}>
            ✓
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--forge-gold)" }}
        >
          {pillarLabel}
        </span>
        <span
          className="block truncate text-base font-medium"
          style={{
            color: done ? "var(--forge-shadow)" : "var(--forge-bone)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {title}
        </span>
        <span className="block truncate text-[11px]" style={{ color: "var(--forge-shadow)" }}>
          {detail}
        </span>
      </span>
    </button>
  );
}

function EmptySlot({ pillarLabel, href }: { pillarLabel: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-[12px] px-5 py-4 text-left transition-colors"
      style={{
        backgroundColor: "transparent",
        border: "1px dashed var(--forge-edge)",
        color: "var(--forge-shadow)",
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2"
        style={{ borderColor: "var(--forge-edge)" }}
      />
      <span className="min-w-0 flex-1">
        <span
          className="block font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          {pillarLabel}
        </span>
        <span className="block text-sm font-medium" style={{ color: "var(--forge-ash)" }}>
          Set the act for this pillar
        </span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--forge-gold)" }}>
        Add →
      </span>
    </Link>
  );
}
