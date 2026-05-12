"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForgeEnrollment, computeDayIndex } from "@/hooks/useForgeEnrollment";
import { useStreak } from "@/hooks/useStreak";

const SERIF = "'Cormorant Garamond', serif";

const MILESTONES = new Set([7, 30, 60, 90]);

type DayState = "held" | "recovered" | "missed" | "future" | "today";

interface DayCell {
  day: number;
  state: DayState;
  isMilestone: boolean;
}

export default function PathPage() {
  const { enrollment, loading } = useForgeEnrollment();
  const { streak } = useStreak();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const today = enrollment ? computeDayIndex(enrollment.started_at) : 1;

  // Provisional rendering: use the streak as proxy for held days.
  // (Real day-by-day completion comes with the protocol_completions table.)
  const cells: DayCell[] = Array.from({ length: 90 }, (_, i) => {
    const dayNum = i + 1;
    const isMilestone = MILESTONES.has(dayNum);
    let state: DayState = "future";
    if (dayNum === today) state = "today";
    else if (dayNum < today) {
      // Approximate: last `streak` days were held; earlier in current window were missed.
      const heldFrom = Math.max(1, today - streak);
      state = dayNum >= heldFrom ? "held" : "missed";
    }
    return { day: dayNum, state, isMilestone };
  });

  const heldCount = cells.filter((c) => c.state === "held").length;
  const missedCount = cells.filter((c) => c.state === "missed").length;

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      {/* Header */}
      <header className="mb-10">
        <p
          className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          The Path
        </p>
        <h1
          className="text-3xl tracking-tight sm:text-4xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          Ninety days. <em style={{ color: "var(--forge-gold)" }}>Visible.</em>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
          Each cell is one day. Filled means held. Empty means lost. The path is the record — you
          cannot lie to it.
        </p>
      </header>

      {/* Stats bar */}
      <section
        className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-4"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <StatCell label="Day" value={String(today)} suffix={`of 90`} color="var(--forge-gold)" />
        <StatCell label="Held" value={String(heldCount)} suffix="days" color="var(--forge-bone)" />
        <StatCell label="Missed" value={String(missedCount)} suffix="days" color="var(--forge-shadow)" />
        <StatCell
          label="Streak"
          value={String(streak)}
          suffix="in a row"
          color="var(--forge-gold)"
          className="col-span-3 sm:col-span-1"
        />
      </section>

      {/* The 90 cells */}
      <section
        className="rounded-[14px] p-5 sm:p-8"
        style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
      >
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {cells.map((c) => (
            <Cell key={c.day} cell={c} mounted={mounted} />
          ))}
        </div>

        {/* Legend */}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6"
          style={{ borderColor: "var(--forge-edge)" }}
        >
          <div className="flex flex-wrap items-center gap-5 text-xs" style={{ color: "var(--forge-ash)" }}>
            <LegendDot color="var(--forge-pulse)" label="Held" />
            <LegendDot color="var(--forge-gold)" label="Milestone" />
            <LegendDot color="var(--forge-fail)" label="Missed" />
            <LegendDot color="var(--forge-iron)" label="Not yet" outlined />
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--forge-gold)" }}
          >
            Return to today →
          </Link>
        </div>
      </section>

      {/* Milestones strip */}
      <section className="mt-10">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          Milestones
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { day: 7, label: "First seal", note: "Most stop here." },
            { day: 30, label: "First proof", note: "Proof card unlocks." },
            { day: 60, label: "Second proof", note: "Halfway. Past the doubt." },
            { day: 90, label: "Forged", note: "The full path held." },
          ].map((m) => {
            const reached = today >= m.day;
            return (
              <article
                key={m.day}
                className="rounded-[12px] p-5"
                style={{
                  backgroundColor: reached ? "var(--forge-iron)" : "var(--forge-stone)",
                  border: `1px solid ${reached ? "var(--forge-gold)" : "var(--forge-edge)"}`,
                }}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: reached ? "var(--forge-gold)" : "var(--forge-shadow)" }}
                  >
                    Day {m.day}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: reached ? "var(--forge-gold)" : "var(--forge-shadow)" }}
                  >
                    {reached ? "✓" : ""}
                  </span>
                </div>
                <h3
                  className="text-lg tracking-tight"
                  style={{
                    fontFamily: SERIF,
                    color: reached ? "var(--forge-bone)" : "var(--forge-ash)",
                    fontWeight: 500,
                  }}
                >
                  {m.label}
                </h3>
                <p className="mt-1 text-[11px]" style={{ color: "var(--forge-shadow)" }}>
                  {m.note}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {loading && (
        <p className="mt-6 text-center text-xs" style={{ color: "var(--forge-shadow)" }}>
          Loading the path…
        </p>
      )}
    </div>
  );
}

function Cell({ cell, mounted }: { cell: DayCell; mounted: boolean }) {
  const base: Record<DayState, string> = {
    held: "var(--forge-pulse)",
    recovered: "var(--forge-warn)",
    missed: "var(--forge-fail)",
    today: "var(--forge-gold)",
    future: "var(--forge-iron)",
  };
  const opacity: Record<DayState, number> = {
    held: 0.85,
    recovered: 0.75,
    missed: 0.45,
    today: 1,
    future: 0.4,
  };

  const isMilestoneFilled = cell.isMilestone && (cell.state === "held" || cell.state === "today");

  return (
    <div
      className="group relative aspect-square rounded-[4px]"
      title={`Day ${cell.day} — ${cell.state}`}
      style={{
        backgroundColor: isMilestoneFilled ? "var(--forge-gold)" : base[cell.state],
        opacity: mounted ? opacity[cell.state] : 0,
        border: cell.state === "today" ? "1px solid var(--forge-gold)" : undefined,
        transition: `opacity 0.6s ease ${(cell.day / 90) * 0.4}s`,
      }}
    />
  );
}

function StatCell({
  label,
  value,
  suffix,
  color,
  className = "",
}: {
  label: string;
  value: string;
  suffix: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] px-4 py-4 ${className}`}
      style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
    >
      <p
        className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: "var(--forge-shadow)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-3xl tracking-tight"
          style={{ fontFamily: SERIF, color, fontWeight: 500 }}
        >
          {value}
        </span>
        <span className="text-[10px]" style={{ color: "var(--forge-shadow)" }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  outlined,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-[2px]"
        style={{
          backgroundColor: color,
          border: outlined ? "1px solid var(--forge-edge)" : undefined,
        }}
      />
      {label}
    </span>
  );
}
