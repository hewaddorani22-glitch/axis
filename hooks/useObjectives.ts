"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export type ObjectiveRollupType = "missions" | "revenue" | "habits";

export interface Objective {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  rollup_type: ObjectiveRollupType;
  target_value: number | null;
  unit: string | null;
  start_date: string;
  deadline: string | null;
  color: string | null;
  created_at: string;
}

export interface ObjectiveWithRollup extends Objective {
  currentValue: number;
  targetValue: number;
  progressPct: number;
  expectedPct: number;
  outcomePct: number;
  monthlyTarget: number;
  linkedCounts: {
    missions: number;
    habits: number;
    streams: number;
  };
}

function getMonthSpan(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  );
}

function getExpectedPct(startDate: string, deadline: string | null) {
  if (!deadline) return 100;

  const start = new Date(startDate);
  const end = new Date(deadline);
  const today = new Date();

  if (today <= start) return 0;
  if (today >= end) return 100;

  const total = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  return total <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function withinWindow(dateValue: string, startDate: string, deadline: string | null) {
  const date = new Date(dateValue);
  const start = new Date(startDate);

  if (date < start) return false;
  if (!deadline) return true;

  return date <= new Date(deadline);
}

export function useObjectives() {
  const [objectives, setObjectives] = useState<ObjectiveWithRollup[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchObjectives = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setObjectives([]);
      setLoading(false);
      return;
    }

    const { data: objectiveRows } = await supabase
      .from("objectives")
      .select("*")
      .order("created_at", { ascending: false });

    const baseObjectives = (objectiveRows as Objective[]) || [];

    if (baseObjectives.length === 0) {
      setObjectives([]);
      setLoading(false);
      return;
    }

    const objectiveIds = baseObjectives.map((objective) => objective.id);

    const [missionsRes, habitsRes, streamsRes] = await Promise.all([
      supabase
        .from("missions")
        .select("id, objective_id, status, date")
        .in("objective_id", objectiveIds),
      supabase
        .from("habits")
        .select("id, objective_id")
        .in("objective_id", objectiveIds),
      supabase
        .from("revenue_streams")
        .select("id, objective_id")
        .in("objective_id", objectiveIds),
    ]);

    const streamRows = (streamsRes.data || []) as { id: string; objective_id: string | null }[];
    const habitRows = (habitsRes.data || []) as { id: string; objective_id: string | null }[];
    const missionRows = (missionsRes.data || []) as {
      id: string;
      objective_id: string | null;
      status: "active" | "done";
      date: string;
    }[];

    const streamIds = streamRows.map((stream) => stream.id);
    const habitIds = habitRows.map((habit) => habit.id);

    const earliestStart = baseObjectives.reduce((earliest, objective) => {
      if (!earliest || objective.start_date < earliest) return objective.start_date;
      return earliest;
    }, "");

    const [entriesRes, habitLogsRes] = await Promise.all([
      streamIds.length > 0
        ? supabase
            .from("revenue_entries")
            .select("stream_id, amount, date")
            .in("stream_id", streamIds)
        : Promise.resolve({ data: [] }),
      habitIds.length > 0
        ? supabase
            .from("habit_logs")
            .select("habit_id, date, completed")
            .eq("completed", true)
            .in("habit_id", habitIds)
            .gte("date", earliestStart)
        : Promise.resolve({ data: [] }),
    ]);

    const revenueRows = (entriesRes.data || []) as { stream_id: string; amount: number; date: string }[];
    const habitLogRows = (habitLogsRes.data || []) as {
      habit_id: string;
      date: string;
      completed: boolean;
    }[];

    const nextObjectives = baseObjectives.map((objective) => {
      const linkedMissions = missionRows.filter((mission) => mission.objective_id === objective.id);
      const linkedHabits = habitRows.filter((habit) => habit.objective_id === objective.id);
      const linkedStreams = streamRows.filter((stream) => stream.objective_id === objective.id);

      let currentValue = 0;
      let targetValue = Number(objective.target_value || 0);
      let monthlyTarget = 0;

      if (objective.rollup_type === "revenue") {
        const linkedStreamIds = new Set(linkedStreams.map((stream) => stream.id));
        const relevantEntries = revenueRows.filter(
          (entry) =>
            linkedStreamIds.has(entry.stream_id) &&
            withinWindow(entry.date, objective.start_date, objective.deadline)
        );

        currentValue = relevantEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
        targetValue = Number(objective.target_value || 0);

        if (targetValue > 0 && objective.deadline) {
          monthlyTarget = targetValue / getMonthSpan(objective.start_date, objective.deadline);
        }
      }

      if (objective.rollup_type === "missions") {
        const relevantMissions = linkedMissions.filter((mission) =>
          withinWindow(mission.date, objective.start_date, objective.deadline)
        );
        currentValue = relevantMissions.filter((mission) => mission.status === "done").length;
        targetValue = Number(objective.target_value || relevantMissions.length || 0);
      }

      if (objective.rollup_type === "habits") {
        const linkedHabitIds = new Set(linkedHabits.map((habit) => habit.id));
        const relevantLogs = habitLogRows.filter(
          (log) =>
            linkedHabitIds.has(log.habit_id) &&
            withinWindow(log.date, objective.start_date, objective.deadline)
        );
        currentValue = relevantLogs.length;
        targetValue = Number(objective.target_value || linkedHabits.length || 0);
      }

      const progressPct =
        targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
      const expectedPct = Math.round(getExpectedPct(objective.start_date, objective.deadline));
      const outcomePct =
        expectedPct <= 0
          ? progressPct > 0
            ? 100
            : 0
          : Math.min(100, Math.round((progressPct / expectedPct) * 100));

      return {
        ...objective,
        currentValue,
        targetValue,
        progressPct,
        expectedPct,
        outcomePct,
        monthlyTarget,
        linkedCounts: {
          missions: linkedMissions.length,
          habits: linkedHabits.length,
          streams: linkedStreams.length,
        },
      };
    });

    setObjectives(nextObjectives);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const addObjective = async (input: {
    title: string;
    rollupType: ObjectiveRollupType;
    targetValue?: number | null;
    unit?: string | null;
    startDate?: string;
    deadline?: string | null;
    color?: string | null;
    description?: string | null;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && objectives.length >= 2) {
      toast.error("Free plan limit reached", {
        description: "2 themes maximum. Upgrade to Pro in Settings to unlock unlimited themes.",
      });
      return;
    }

    const { data } = await supabase
      .from("objectives")
      .insert({
        user_id: user.id,
        title: input.title,
        rollup_type: input.rollupType,
        target_value: input.targetValue || null,
        unit: input.unit || null,
        start_date: input.startDate || new Date().toISOString().split("T")[0],
        deadline: input.deadline || null,
        color: input.color || "#CDFF4F",
        description: input.description || null,
      })
      .select()
      .single();

    if (data) {
      await fetchObjectives();
    }
  };

  const deleteObjective = async (objectiveId: string) => {
    await supabase.from("objectives").delete().eq("id", objectiveId);
    setObjectives((prev) => prev.filter((objective) => objective.id !== objectiveId));
  };

  return {
    objectives,
    loading,
    addObjective,
    deleteObjective,
    refetch: fetchObjectives,
  };
}
