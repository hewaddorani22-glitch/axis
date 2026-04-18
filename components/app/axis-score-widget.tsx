"use client";

import { motion } from "framer-motion";
import { useAxisScore } from "@/hooks/useAxisScore";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#CDFF4F";
  if (grade.startsWith("B")) return "#60a5fa";
  if (grade === "C") return "#fbbf24";
  return "#f87171";
}

interface AxisScoreWidgetProps {
  compact?: boolean;
}

export function AxisScoreWidget({ compact = false }: AxisScoreWidgetProps) {
  const { focusScore, grade, loading } = useAxisScore();

  const dashOffset = CIRCUMFERENCE * (1 - focusScore / 100);
  const color = gradeColor(grade);

  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <svg width={40} height={40} className="-rotate-90">
            <circle
              cx={20}
              cy={20}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={4}
            />
            {!loading && (
              <motion.circle
                cx={20}
                cy={20}
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {loading ? (
              <div className="w-3 h-3 rounded-full axis-skeleton" />
            ) : (
              <span
                className="text-[9px] font-mono font-bold"
                style={{ color, marginTop: 2 }}
              >
                {grade}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-mono font-semibold" style={{ color }}>
            {loading ? "—" : `${focusScore}%`}
          </p>
          <p
            className="text-[9px] font-mono"
            style={{ color: "var(--text-tertiary)" }}
          >
            Axis Score
          </p>
        </div>
      </div>
    );
  }

  // Full widget for dashboard
  return (
    <div className="axis-stat-card-dark">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-mono font-medium uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          Axis Score
        </span>
        <div className="relative flex items-center justify-center">
          <svg width={44} height={44} className="-rotate-90">
            <circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={4}
            />
            {!loading && (
              <motion.circle
                cx={22}
                cy={22}
                r={18}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18}
                initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 18 * (1 - focusScore / 100),
                }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 5px ${color}70)` }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {loading ? (
              <div className="w-4 h-4 rounded-full axis-skeleton" />
            ) : (
              <span
                className="text-[10px] font-mono font-bold"
                style={{ color, marginTop: 2 }}
              >
                {grade}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="axis-skeleton h-8 w-16 mb-1 rounded-lg" />
      ) : (
        <motion.p
          className="text-2xl font-bold mb-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ color: "var(--text-primary)" }}
        >
          {focusScore}
          <span className="text-sm font-mono ml-1" style={{ color: "var(--text-tertiary)" }}>
            / 100
          </span>
        </motion.p>
      )}

      <p className="text-xs font-mono" style={{ color }}>
        {loading ? "" : `Grade: ${grade}`}
      </p>
    </div>
  );
}
