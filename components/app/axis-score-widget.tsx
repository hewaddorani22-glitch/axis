"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AxisScoreResult } from "@/hooks/useAxisScore";

type AxisScoreWidgetProps = Partial<AxisScoreResult> & {
  loading?: boolean;
  compact?: boolean;
  className?: string;
};

const GRADE_COLOR: Record<string, string> = {
  "S": "#CDFF4F",
  "A": "#86efac",
  "B": "#93c5fd",
  "C": "#fcd34d",
  "D": "#fb923c",
  "F": "#f87171",
};

export function AxisScoreWidget({
  score = 0,
  grade = "F",
  label = "Needs Reset",
  detail = "No score yet.",
  layers = { execution: 0, consistency: 0, outcome: 0 },
  loading = false,
  compact = false,
  className,
}: AxisScoreWidgetProps) {
  const gradientId = useId();
  const gradeColor = GRADE_COLOR[grade] ?? "#f87171";

  if (loading) {
    return (
      <div
        className={cn(compact ? "rounded-2xl p-3" : "rounded-[28px] p-5", className)}
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className={cn("axis-skeleton rounded-xl", compact ? "h-16 w-full" : "h-28 w-full")} />
      </div>
    );
  }

  /* ── Compact (Sidebar) ───────────────────────────────────────────── */
  if (compact) {
    const r = 26;
    const sz = 68;
    const sw = 5;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);

    return (
      <div
        className={cn("rounded-2xl p-3", className)}
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-3">
          {/* Circle */}
          <div className="relative flex-shrink-0">
            <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="-rotate-90">
              <circle cx={sz / 2} cy={sz / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={sw} fill="none" />
              <motion.circle
                cx={sz / 2} cy={sz / 2} r={r}
                stroke={`url(#${gradientId})`}
                strokeWidth={sw} fill="none" strokeLinecap="round"
                strokeDasharray={circ}
                initial={false}
                animate={{ strokeDashoffset: offset }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
              <defs>
                <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#CDFF4F" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold leading-none">{score}</p>
              <p className="text-[8px] font-mono uppercase tracking-widest mt-0.5" style={{ color: "var(--text-tertiary)" }}>score</p>
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-tertiary)" }}>lomoura Score</p>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: `${gradeColor}18`, color: gradeColor }}
              >
                {grade}
              </span>
              <span className="text-xs font-medium truncate">{label}</span>
            </div>
            {/* Mini bars */}
            <div className="space-y-1">
              {[
                { key: "Ex", value: layers.execution },
                { key: "Co", value: layers.consistency },
                { key: "Ou", value: layers.outcome },
              ].map((l) => (
                <div key={l.key} className="flex items-center gap-1.5">
                  <span className="w-4 text-[8px] font-mono" style={{ color: "var(--text-tertiary)" }}>{l.key}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: gradeColor, opacity: 0.7 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${l.value}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="w-5 text-right text-[8px] font-mono" style={{ color: "var(--text-tertiary)" }}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full (Dashboard) ────────────────────────────────────────────── */
  const r = 52;
  const sz = 136;
  const sw = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div
      className={cn("rounded-[28px] p-6", className)}
      style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Circle */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="-rotate-90">
            <circle cx={sz / 2} cy={sz / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={sw} fill="none" />
            <motion.circle
              cx={sz / 2} cy={sz / 2} r={r}
              stroke={`url(#${gradientId}-full)`}
              strokeWidth={sw} fill="none" strokeLinecap="round"
              strokeDasharray={circ}
              initial={false}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
            <defs>
              <linearGradient id={`${gradientId}-full`} x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#CDFF4F" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <p className="text-4xl font-bold tracking-tight">{score}</p>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>lomoura Score</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: `${gradeColor}18`, color: gradeColor }}
              >
                Grade {grade}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{detail}</p>
          </div>

          {/* Layer bars */}
          <div className="space-y-3">
            {[
              { label: "Execution", value: layers.execution },
              { label: "Consistency", value: layers.consistency },
              { label: "Outcome", value: layers.outcome },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
                    {item.label}
                  </span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: gradeColor, opacity: 0.65 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
