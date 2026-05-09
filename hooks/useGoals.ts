"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";

export interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  deadline: string | null;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("goals")
      .select("*")
      .order("created_at");

    setGoals((data as Goal[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (
    title: string,
    targetValue: number,
    unit?: string,
    deadline?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).maybeSingle();
    if (profile?.plan === "free" && goals.length >= 2) {
      const isDe = typeof document !== "undefined" && document.documentElement.lang === "de";
      toast.error(isDe ? "Free-Plan-Limit erreicht" : "Free plan limit reached", {
        description: isDe
          ? "Maximal 2 Goals. Upgrade auf Pro fuer unbegrenzte Goals."
          : "2 goals maximum. Upgrade to Pro to unlock unlimited goals.",
      });
      openUpgradePrompt({ source: "goal_limit" });
      return;
    }

    const { data } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title,
        target_value: targetValue,
        unit: unit || null,
        deadline: deadline || null,
      })
      .select()
      .single();

    if (data) {
      if (goals.length === 0) {
        trackEvent("first_goal_created", { source: "goals" });
      }
      setGoals((prev) => [...prev, data as Goal]);
    }
  };

  const updateGoalProgress = async (id: string, currentValue: number) => {
    await supabase.from("goals").update({ current_value: currentValue }).eq("id", id);
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current_value: currentValue } : g))
    );
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    refetch: fetchGoals,
  };
}
