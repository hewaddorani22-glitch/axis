"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export interface Habit {
  id: string;
  name: string;
  icon: string;
  archived: boolean;
  sort_order: number;
  objective_id?: string | null;
  target_value?: number | null;
  unit?: string | null;
}

export interface HabitWithStatus extends Habit {
  todayDone: boolean;
  todaySkipped: boolean;
  todayValue: number | null;
  streak: number;
  weekLog: ("done" | "skipped" | "missed")[];
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
      .eq("user_id", user.id)
      .gte("date", weekAgoStr)
      .lte("date", todayStr);

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
      const todayLog = habitLogs.find((l) => l.date === todayStr);
      const todayDone = todayLog?.completed || false;
      const todaySkipped = todayLog?.skipped || false;
      const todayValue = todayLog?.value || null;

      // Week log (last 7 days)
      const weekLog: ("done" | "skipped" | "missed")[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        
        const logForDay = habitLogs.find((l) => l.date === dateStr);
        if (logForDay?.completed) weekLog.push("done");
        else if (logForDay?.skipped) weekLog.push("skipped");
        else weekLog.push("missed");
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

      return { ...habit, todayDone, todaySkipped, todayValue, streak, weekLog } as HabitWithStatus;
    });

    setHabits(habitsWithStatus);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (
    name: string,
    icon: string = "IconHabits",
    target_value?: number | null,
    unit?: string | null,
    objective_id?: string | null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && habits.length >= 3) {
      toast.error("Free plan limit reached", { description: "3 habits maximum. Upgrade to Pro in Settings to unlock unlimited habits." });
      return;
    }

    const { data } = await supabase
      .from("habits")
      .insert({ 
        user_id: user.id, 
        name, 
        icon, 
        sort_order: habits.length,
        objective_id: objective_id || null,
        target_value: target_value || null,
        unit: unit || null
      })
      .select()
      .single();

    if (data) {
      setHabits((prev) => [
        ...prev,
        { ...(data as Habit), todayDone: false, todaySkipped: false, todayValue: null, streak: 0, weekLog: Array(7).fill("missed") },
      ]);
    }
  };

  const toggleHabit = async (habitId: string, action: "done" | "skip" | "undo" = "done", newValue?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const wasDone = habit.todayDone;
    const wasSkipped = habit.todaySkipped;

    // Determine new state
    const isNowDone = action === "done";
    const isNowSkipped = action === "skip";
    
    // Streaks calculation: skips are neutral.
    let newStreak = habit.streak;
    if (wasDone && !isNowDone && !isNowSkipped) newStreak = Math.max(0, habit.streak - 1);
    else if (!wasDone && !wasSkipped && isNowDone) newStreak += 1;

    // Optimistic update for zero-latency UI
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { 
              ...h, 
              todayDone: isNowDone, 
              todaySkipped: isNowSkipped,
              todayValue: newValue !== undefined ? newValue : h.todayValue,
              streak: newStreak
            }
          : h
      )
    );

    let error = null;
    if (action === "undo") {
      const result = await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("date", todayStr);
      error = result.error;
    } else {
      const payload: any = { 
        habit_id: habitId, 
        user_id: user.id, 
        date: todayStr, 
        completed: isNowDone,
        skipped: isNowSkipped 
      };
      if (newValue !== undefined) payload.value = newValue;
      
      const result = await supabase.from("habit_logs").upsert(payload);
      error = result.error;
    }

    if (error) {
      // Rollback on failure
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, todayDone: wasDone, todaySkipped: wasSkipped, streak: habit.streak } : h
        )
      );
    }
  };

  const reorderHabits = async (activeId: string, overId: string) => {
    setHabits((prev) => {
      const oldIndex = prev.findIndex((h) => h.id === activeId);
      const newIndex = prev.findIndex((h) => h.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newHabits = [...prev];
      const [movedItem] = newHabits.splice(oldIndex, 1);
      newHabits.splice(newIndex, 0, movedItem);
      
      const updatedHabits = newHabits.map((h, i) => ({ ...h, sort_order: i }));
      
      const updates = updatedHabits.map((h) => ({ id: h.id, sort_order: h.sort_order }));
      supabase.from("habits").upsert(updates).then(({ error }) => {
        if (error) {
          toast.error("Failed to reorder habits");
          fetchHabits();
        }
      });
      
      return updatedHabits;
    });
  };

  const completedToday = habits.filter((h) => h.todayDone).length;

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    reorderHabits,
    completedToday,
    total: habits.length,
    refetch: fetchHabits,
  };
}
