"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { HabitWithStatus } from "./useHabits";
import { Mission } from "./useMissions";

export type DashboardData = {
  habits: HabitWithStatus[];
  missions: Mission[];
  mtdTotal: number;
  streak: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    habits: [],
    missions: [],
    mtdTotal: 0,
    streak: 0,
    loading: true,
    refresh: async () => {},
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Unified Batch Fetch
    const [habitsRes, logsRes, missionsRes, revenueRes, streakRes] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).eq("archived", false).order("sort_order"),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("missions").select("*").eq("user_id", user.id).eq("date", today).order("sort_order"),
      supabase.from("revenue_entries").select("amount").eq("user_id", user.id).gte("date", firstOfMonth),
      supabase.from("daily_scores").select("streak_length").eq("user_id", user.id).order("date", { ascending: false }).limit(1)
    ]);

    const habits = (habitsRes.data || []).map(h => {
      const log = logsRes.data?.find(l => l.habit_id === h.id);
      return {
        ...h,
        todayDone: log?.completed || false,
        todaySkipped: log?.skipped || false,
        todayValue: log?.value || 0,
        streak: 0,
        weekLog: Array(7).fill("missed") as ("done" | "skipped" | "missed")[],
      };
    });

    const mtdTotal = revenueRes.data?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
    const streak = streakRes.data?.[0]?.streak_length || 0;

    setData({
      habits,
      missions: missionsRes.data || [],
      mtdTotal,
      streak,
      loading: false,
      refresh: fetchData
    });
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return data;
}
