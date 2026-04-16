"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export interface Habit {
  id: string;
  name: string;
  icon: string;
  archived: boolean;
  sort_order: number;
}

export interface HabitWithStatus extends Habit {
  todayDone: boolean;
  streak: number;
  weekLog: boolean[];
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get habits
    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("archived", false)
      .order("sort_order");

    if (!habitsData) { setLoading(false); return; }

    // Get last 7 days of logs
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    const todayStr = today.toISOString().split("T")[0];
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("*")
      .gte("date", weekAgoStr)
      .lte("date", todayStr)
      .eq("completed", true);

    // Calculate streaks (simplified: count consecutive days up to today)
    const { data: allLogs } = await supabase
      .from("habit_logs")
      .select("habit_id, date")
      .eq("completed", true)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    const habitsWithStatus: HabitWithStatus[] = habitsData.map((habit) => {
      const habitLogs = logs?.filter((l) => l.habit_id === habit.id) || [];
      const todayDone = habitLogs.some((l) => l.date === todayStr);

      // Week log (last 7 days)
      const weekLog: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        weekLog.push(habitLogs.some((l) => l.date === dateStr));
      }

      // Streak
      let streak = 0;
      const habitAllLogs = allLogs?.filter((l) => l.habit_id === habit.id) || [];
      const logDates = new Set(habitAllLogs.map((l) => l.date));
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (logDates.has(dateStr)) {
          streak++;
        } else {
          break;
        }
      }

      return { ...habit, todayDone, streak, weekLog } as HabitWithStatus;
    });

    setHabits(habitsWithStatus);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (name: string, icon: string = "◆") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && habits.length >= 3) {
      alert("Free plan limit reached: 3 habits maximum. Upgrade to Pro in Settings to unlock unlimited habits.");
      return;
    }

    const { data } = await supabase
      .from("habits")
      .insert({ user_id: user.id, name, icon, sort_order: habits.length })
      .select()
      .single();

    if (data) {
      setHabits((prev) => [
        ...prev,
        { ...(data as Habit), todayDone: false, streak: 0, weekLog: Array(7).fill(false) },
      ]);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split("T")[0];

    if (habit.todayDone) {
      // Un-complete
      await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitId)
        .eq("date", todayStr);
    } else {
      // Complete
      await supabase
        .from("habit_logs")
        .upsert({ habit_id: habitId, user_id: user.id, date: todayStr, completed: true });
    }

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, todayDone: !h.todayDone, streak: h.todayDone ? h.streak - 1 : h.streak + 1 }
          : h
      )
    );
  };

  const completedToday = habits.filter((h) => h.todayDone).length;

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    completedToday,
    total: habits.length,
    refetch: fetchHabits,
  };
}
