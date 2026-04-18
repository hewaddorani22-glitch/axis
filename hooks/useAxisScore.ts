"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHabits } from "@/hooks/useHabits";
import { useMissions } from "@/hooks/useMissions";
import { useObjectives } from "@/hooks/useObjectives";
import { useStreak } from "@/hooks/useStreak";

export type AxisScoreLayers = {
  execution: number;
  consistency: number;
  outcome: number;
};

export type AxisScoreResult = {
  score: number;
  grade: string;
  label: string;
  detail: string;
  layers: AxisScoreLayers;
};

function gradeForScore(score: number) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function calculateAxisScore(layers: AxisScoreLayers): AxisScoreResult {
  const score = Math.round(
    layers.execution * 0.45 + layers.consistency * 0.3 + layers.outcome * 0.25
  );

  const label =
    score >= 85 ? "Operating Clean" : score >= 65 ? "Stable" : score >= 45 ? "Leaking" : "Unstable";
  const detail =
    score >= 85
      ? "You are executing, staying consistent, and pacing against real outcomes."
      : score >= 65
      ? "The system is functioning, but one layer is drifting."
      : score >= 45
      ? "You are active, but discipline or outcomes are falling behind."
      : "The operating system is not holding today.";

  return {
    score,
    grade: gradeForScore(score),
    label,
    detail,
    layers: {
      execution: Math.round(layers.execution),
      consistency: Math.round(layers.consistency),
      outcome: Math.round(layers.outcome),
    },
  };
}

export function useAxisScore() {
  const supabase = createClient();
  const { missions, loading: missionsLoading } = useMissions();
  const { habits, loading: habitsLoading } = useHabits();
  const { objectives, loading: objectivesLoading } = useObjectives();
  const { loading: streakLoading } = useStreak();
  const [consistency, setConsistency] = useState(0);
  const [consistencyLoading, setConsistencyLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchConsistency() {
      setConsistencyLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setConsistency(0);
          setConsistencyLoading(false);
        }
        return;
      }

      const since = new Date();
      since.setDate(since.getDate() - 29);
      const sinceStr = since.toISOString().split("T")[0];

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("id").eq("user_id", user.id).eq("archived", false),
        supabase
          .from("habit_logs")
          .select("habit_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("date", sinceStr),
      ]);

      const habitCount = habitsRes.data?.length || 0;
      const completedCount = logsRes.data?.length || 0;
      const expectedCount = habitCount * 30;
      const nextConsistency =
        expectedCount > 0 ? Math.min(100, Math.round((completedCount / expectedCount) * 100)) : 0;

      if (isMounted) {
        setConsistency(nextConsistency);
        setConsistencyLoading(false);
      }
    }

    fetchConsistency();

    return () => {
      isMounted = false;
    };
  }, [supabase, habits.length]);

  const missionsCompleted = missions.filter((mission) => mission.status === "done").length;
  const habitsCompleted = habits.filter((habit) => habit.todayDone).length;
  const execution =
    missions.length > 0 || habits.length > 0
      ? Math.round(
          (missions.length > 0 ? (missionsCompleted / missions.length) * 55 : 0) +
            (habits.length > 0 ? (habitsCompleted / habits.length) * 45 : 0)
        )
      : 0;

  const activeObjectives = objectives.filter((objective) => objective.targetValue > 0);
  const outcome =
    activeObjectives.length > 0
      ? Math.round(
          activeObjectives.reduce((sum, objective) => sum + objective.outcomePct, 0) /
            activeObjectives.length
        )
      : 0;

  return {
    ...calculateAxisScore({
      execution,
      consistency,
      outcome,
    }),
    loading: missionsLoading || habitsLoading || objectivesLoading || consistencyLoading || streakLoading,
  };
}
