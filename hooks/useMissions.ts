"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export interface Mission {
  id: string;
  title: string;
  priority: "high" | "med" | "low";
  status: "active" | "done";
  date: string;
  category: string | null;
  sort_order: number;
}

export function useMissions(date?: string) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("missions")
      .select("*")
      .eq("date", targetDate)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    setMissions((data as Mission[]) || []);
    setLoading(false);
  }, [supabase, targetDate]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const addMission = async (title: string, priority: "high" | "med" | "low" = "med", category?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && missions.length >= 5) {
      alert("Free plan limit reached: 5 daily missions maximum. Upgrade to Pro in Settings to unlock unlimited missions.");
      return;
    }

    const { data } = await supabase
      .from("missions")
      .insert({
        user_id: user.id,
        title,
        priority,
        category: category || null,
        date: targetDate,
        sort_order: missions.length,
      })
      .select()
      .single();

    if (data) setMissions((prev) => [...prev, data as Mission]);
  };

  const toggleMission = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    const newStatus = mission.status === "done" ? "active" : "done";
    await supabase.from("missions").update({ status: newStatus }).eq("id", id);
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  const deleteMission = async (id: string) => {
    await supabase.from("missions").delete().eq("id", id);
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const completedCount = missions.filter((m) => m.status === "done").length;
  const completionRate = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  return {
    missions,
    loading,
    addMission,
    toggleMission,
    deleteMission,
    completedCount,
    completionRate,
    total: missions.length,
    refetch: fetchMissions,
  };
}
