"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStreak = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get all dates where user completed at least 1 mission AND 1 habit
    // Going back 365 days max
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setDate(today.getDate() - 365);
    const yearAgoStr = yearAgo.toISOString().split("T")[0];

    const [missionsRes, habitsRes] = await Promise.all([
      supabase
        .from("missions")
        .select("date")
        .eq("user_id", user.id)
        .eq("status", "done")
        .gte("date", yearAgoStr),
      supabase
        .from("habit_logs")
        .select("date")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("date", yearAgoStr),
    ]);

    const missionDates = new Set(missionsRes.data?.map((m) => m.date) || []);
    const habitDates = new Set(habitsRes.data?.map((h) => h.date) || []);

    // Count consecutive days from today backward where both conditions are met
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      if (missionDates.has(dateStr) && habitDates.has(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streak, loading, refetch: fetchStreak };
}
