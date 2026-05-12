"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useForgeEnrollment, computeDayIndex } from "@/hooks/useForgeEnrollment";

const SERIF = "'Cormorant Garamond', serif";

type Tier = "Initiate" | "Apprentice" | "Forged" | "Vigilant" | "Legend";

const TIERS: { name: Tier; threshold: number; note: string }[] = [
  { name: "Initiate", threshold: 0, note: "The first day. The vow taken." },
  { name: "Apprentice", threshold: 90, note: "One full forge held." },
  { name: "Forged", threshold: 180, note: "Two cycles. The body remembers." },
  { name: "Vigilant", threshold: 365, note: "A year. The path is who you are." },
  { name: "Legend", threshold: 1000, note: "A thousand days. Few stand here." },
];

export default function SelfPage() {
  const { user } = useUser();
  const { streak } = useStreak();
  const { enrollment } = useForgeEnrollment();
  const { missions, completedCount, total: missionsTotal } = useMissions();
  const { habits, completedToday: habitsCompleted, total: habitsTotal } = useHabits();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const day = enrollment ? computeDayIndex(enrollment.started_at) : 1;

  // Provisional pillar scores (same heuristic as the Forge screen)
  const missionRatio = missionsTotal > 0 ? completedCount / missionsTotal : 0;
  const habitRatio = habitsTotal > 0 ? habitsCompleted / habitsTotal : 0;
  const streakLift = Math.min(1, streak / 30);
  const bodyScore = Math.round(40 + habitRatio * 40 + streakLift * 20);
  const mindScore = Math.round(30 + habitRatio * 30 + missionRatio * 25 + streakLift * 15);
  const intellectScore = Math.round(30 + missionRatio * 50 + streakLift * 20);
  const forgeScore = Math.round((bodyScore + mindScore + intellectScore) / 3);

  // Tier based on "total active days" — proxied by streak (until protocol_completions exists)
  const activeDays = Math.max(day, streak);
  const currentTier =
    TIERS.slice()
      .reverse()
      .find((t) => activeDays >= t.threshold) ?? TIERS[0];
  const nextTier = TIERS[TIERS.findIndex((t) => t.name === currentTier.name) + 1];

  const displayName = user?.name || "you";

  return (
    <div className="mx-auto w-full max-w-3xl pb-12">
      {/* Title */}
      <header className="mb-10">
        <p
          className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          {currentTier.name}
        </p>
        <h1
          className="text-3xl tracking-tight sm:text-4xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          {displayName}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--forge-ash)" }}>
          Day {day} of 90 · {currentTier.note}
        </p>
      </header>

      {/* The Score card */}
      <section
        className="mb-8 rounded-[16px] p-8 sm:p-10"
        style={{
          backgroundColor: "var(--forge-stone)",
          border: "1px solid var(--forge-edge)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <p
          className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          Forge score
        </p>
        <p
          className="text-center text-7xl tracking-tighter sm:text-8xl"
          style={{
            fontFamily: SERIF,
            color: "var(--forge-gold)",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {forgeScore}
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { label: "Body", value: bodyScore },
            { label: "Mind", value: mindScore },
            { label: "Intellect", value: intellectScore },
          ].map((p) => (
            <div key={p.label} className="text-center">
              <p
                className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--forge-shadow)" }}
              >
                {p.label}
              </p>
              <p
                className="text-2xl tracking-tight"
                style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
              >
                {p.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The vow */}
      {enrollment && (
        <section
          className="mb-8 rounded-[14px] p-7"
          style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
        >
          <p
            className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-gold)" }}
          >
            The vow
          </p>
          <p
            className="text-xl leading-relaxed sm:text-2xl"
            style={{
              fontFamily: SERIF,
              color: "var(--forge-bone)",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            &ldquo;{enrollment.vow}&rdquo;
          </p>
          <p className="mt-4 text-xs" style={{ color: "var(--forge-shadow)" }}>
            Taken {new Date(enrollment.started_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {enrollment.program}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Body", value: enrollment.pillars.body },
              { label: "Mind", value: enrollment.pillars.mind },
              { label: "Intellect", value: enrollment.pillars.intellect },
            ].map((p) => (
              <div key={p.label}>
                <p
                  className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--forge-shadow)" }}
                >
                  {p.label}
                </p>
                <p className="text-sm" style={{ color: "var(--forge-ash)" }}>
                  {p.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tier ladder */}
      <section
        className="mb-8 rounded-[14px] p-7"
        style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
      >
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          The path of tiers
        </p>
        <ul className="space-y-3">
          {TIERS.map((t) => {
            const reached = activeDays >= t.threshold;
            const isCurrent = t.name === currentTier.name;
            return (
              <li key={t.name} className="flex items-center gap-4">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: reached ? "var(--forge-gold)" : "transparent",
                    border: `1px solid ${reached ? "var(--forge-gold)" : "var(--forge-edge)"}`,
                  }}
                >
                  {reached && (
                    <span className="text-[10px]" style={{ color: "var(--forge-void)" }}>
                      ✓
                    </span>
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-base tracking-tight"
                      style={{
                        fontFamily: SERIF,
                        color: isCurrent ? "var(--forge-gold)" : reached ? "var(--forge-bone)" : "var(--forge-ash)",
                        fontWeight: 500,
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-[0.18em]"
                      style={{ color: "var(--forge-shadow)" }}
                    >
                      Day {t.threshold === 0 ? "1" : t.threshold}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--forge-shadow)" }}>
                    {t.note}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {nextTier && (
          <p
            className="mt-6 border-t pt-5 text-xs"
            style={{ borderColor: "var(--forge-edge)", color: "var(--forge-ash)" }}
          >
            <span style={{ color: "var(--forge-gold)" }}>{nextTier.threshold - activeDays}</span>{" "}
            days until <span style={{ color: "var(--forge-bone)" }}>{nextTier.name}</span>.
          </p>
        )}
      </section>

      {/* Proof preview */}
      <section
        className="rounded-[14px] p-7"
        style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
      >
        <div className="mb-4 flex items-baseline justify-between">
          <p
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            Proof
          </p>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            Day 30 · 60 · 90
          </span>
        </div>

        {/* The proof card mockup */}
        <div
          className="aspect-[4/5] w-full overflow-hidden rounded-[12px] p-8 sm:aspect-[3/2]"
          style={{
            backgroundColor: "var(--forge-void)",
            border: "1px solid var(--forge-gold)",
            backgroundImage:
              "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(201,163,94,0.10) 0%, transparent 70%)",
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: "var(--forge-gold)" }}
              >
                lomoura · the forge
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--forge-shadow)" }}
              >
                Day {day} of 90
              </span>
            </div>

            <div className="my-auto text-center">
              <p
                className="text-7xl tracking-tighter sm:text-8xl"
                style={{ fontFamily: SERIF, color: "var(--forge-gold)", fontWeight: 500 }}
              >
                {forgeScore}
              </p>
              <p
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: "var(--forge-ash)" }}
              >
                Forge score
              </p>
              <p
                className="mt-6 text-base italic leading-snug sm:text-lg"
                style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
              >
                {enrollment ? `“${enrollment.vow}”` : '"Take the vow to begin."'}
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--forge-shadow)" }}>
                — {displayName}
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--forge-edge)" }}>
              <PillarMini label="Body" value={bodyScore} />
              <PillarMini label="Mind" value={mindScore} />
              <PillarMini label="Intellect" value={intellectScore} />
            </div>
          </div>
        </div>

        <p
          className="mt-5 text-center text-xs"
          style={{ color: "var(--forge-shadow)" }}
        >
          {day < 30
            ? `Your first proof card unlocks on Day 30 — ${30 - day} days away.`
            : day < 60
              ? `Day 30 proof unlocked. Day 60 in ${60 - day} days.`
              : day < 90
                ? `Day 60 proof unlocked. Day 90 in ${90 - day} days.`
                : "All three proofs are yours. Share what you have become."}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            disabled={day < 30}
            className="rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-30"
            style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
          >
            {day < 30 ? "Locked" : "Share proof"}
          </button>
          <Link
            href="/path"
            className="rounded-[10px] px-5 py-2.5 text-center text-sm font-semibold"
            style={{ border: "1px solid var(--forge-edge)", color: "var(--forge-bone)" }}
          >
            See the path
          </Link>
        </div>
      </section>
    </div>
  );
}

function PillarMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p
        className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--forge-shadow)" }}
      >
        {label}
      </p>
      <p className="text-lg" style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}>
        {value}
      </p>
    </div>
  );
}
