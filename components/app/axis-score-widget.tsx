"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AxisScoreResult } from "@/hooks/useAxisScore";
import { IconFocus } from "@/components/icons";

type AxisScoreWidgetProps = Partial<AxisScoreResult> & {
  loading?: boolean;
  compact?: boolean;
  className?: string;
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
  const radius = compact ? 30 : 54;
  const stroke = compact ? 6 : 9;
  const size = compact ? 82 : 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  if (loading) {
    return (
      <div
        className={cn("rounded-[28px] p-4", className)}
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className="axis-skeleton h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className={cn(compact ? "rounded-[24px] p-4" : "rounded-[28px] p-5", className)}
      style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
    >
      <div className={cn("flex", compact ? "items-center gap-4" : "flex-col gap-5 lg:flex-row lg:items-center")}>
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: dashOffset }}
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
            <div
              className={cn("mb-2 flex items-center justify-center rounded-2xl", compact ? "h-7 w-7" : "h-10 w-10")}
              style={{ backgroundColor: "var(--bg-accent-soft)" }}
            >
              <IconFocus size={compact ? 12 : 16} className="text-axis-accent" />
            </div>
            <p className={cn("font-semibold tracking-tight", compact ? "text-xl" : "text-4xl")}>{score}</p>
            <p className={cn("font-mono uppercase", compact ? "text-[9px] tracking-[0.22em]" : "text-[10px] tracking-[0.26em]")} style={{ color: "var(--text-tertiary)" }}>
              Axis Score
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={cn("flex items-center gap-2", compact ? "mb-2" : "mb-3")}>
            <span
              className="rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em]"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              Grade {grade}
            </span>
          </div>

          <p className={cn("font-semibold", compact ? "text-[15px] leading-5" : "text-xl")}>{label}</p>
          <p
            className={cn("mt-1", compact ? "text-[13px] leading-5" : "text-sm")}
            style={{
              color: "var(--text-secondary)",
              display: compact ? "-webkit-box" : undefined,
              WebkitLineClamp: compact ? 2 : undefined,
              WebkitBoxOrient: compact ? "vertical" : undefined,
              overflow: compact ? "hidden" : undefined,
            }}
          >
            {detail}
          </p>

          {!compact ? (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Execution", value: layers.execution },
                { label: "Consistency", value: layers.consistency },
                { label: "Outcome", value: layers.outcome },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
