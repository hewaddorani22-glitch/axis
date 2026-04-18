"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

function getDateInTimezone(tz: string, offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() - offsetDays);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    return parts;
  } catch {
    return d.toISOString().split("T")[0];
  }
}

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [recoveredMisses, setRecoveredMisses] = useState(0);
  const [recoveryBudget, setRecoveryBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStreak = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const tz = profile?.timezone || "UTC";

    const yearAgoStr = getDateInTimezone(tz, 365);

    const [missionsRes, habitsRes, freezesRes] = await Promise.all([
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
      supabase
        .from("streak_freezes")
        .select("used_on")
        .eq("user_id", user.id),
    ]);

    const missionDates = new Set(missionsRes.data?.map((m) => m.date) || []);
    const habitDates = new Set(habitsRes.data?.map((h) => h.date) || []);
    const frozenDates = new Set(freezesRes.data?.map((f) => f.used_on) || []);

    let currentStreak = 0;
    let recovered = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = getDateInTimezone(tz, i);

      if (missionDates.has(dateStr) && habitDates.has(dateStr)) {
        currentStreak++;
      } else if (frozenDates.has(dateStr)) {
        currentStreak++;
      } else {
        const allowedRecoveries = Math.floor(currentStreak / 7);
        if (recovered < allowedRecoveries) {
          recovered++;
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreak(currentStreak);
    setRecoveredMisses(recovered);
    setRecoveryBudget(Math.floor(currentStreak / 7));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    loading,
    recoveredMisses,
    recoveryBudget,
    recoveryAvailable: Math.max(0, recoveryBudget - recoveredMisses),
    refetch: fetchStreak,
  };
}
