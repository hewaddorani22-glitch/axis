"use client";

import { useMemo } from "react";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useStreak } from "@/hooks/useStreak";
import { calculateFocusScore, ScoreResult } from "@/lib/scoring";

export interface AxisScoreResult extends ScoreResult {
  loading: boolean;
}

export function useAxisScore(): AxisScoreResult {
  const { completedCount, total: missionsTotal, loading: missionsLoading } = useMissions();
  const { completedToday: habitsCompleted, total: habitsTotal, loading: habitsLoading } = useHabits();
  const { streak, loading: streakLoading } = useStreak();

  const loading = missionsLoading || habitsLoading || streakLoading;

  const result = useMemo(
    () =>
      calculateFocusScore({
        missionsCompleted: completedCount,
        missionsTotal: Math.max(missionsTotal, 1),
        habitsCompleted,
        habitsTotal: Math.max(habitsTotal, 1),
        streakDays: streak,
      }),
    [completedCount, missionsTotal, habitsCompleted, habitsTotal, streak]
  );

  return { ...result, loading };
}
