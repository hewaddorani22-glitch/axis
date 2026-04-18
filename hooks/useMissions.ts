"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export interface Mission {
  id: string;
  title: string;
  priority: "high" | "med" | "low";
  status: "active" | "done";
  date: string;
  category: string | null;
  sort_order: number;
  estimated_time?: number | null;
  energy_level?: "high" | "med" | "low" | null;
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

  const addMission = async (title: string, priority: "high" | "med" | "low" = "med", category?: string, estimated_time?: number, energy_level?: "high" | "med" | "low") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && missions.length >= 5) {
      toast.error("Free plan limit reached", { description: "5 daily missions maximum. Upgrade to Pro in Settings to unlock unlimited missions." });
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
        estimated_time: estimated_time || null,
        energy_level: energy_level || null,
      })
      .select()
      .single();

    if (data) setMissions((prev) => [...prev, data as Mission]);
  };

  const toggleMission = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    const newStatus = mission.status === "done" ? "active" : "done";
    
    // Optimistic update for zero-latency UI
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );

    // Background sync
    const { error } = await supabase.from("missions").update({ status: newStatus }).eq("id", id);
    
    if (error) {
      // Rollback on failure
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: mission.status } : m))
      );
    }
  };

  const deleteMission = async (id: string) => {
    await supabase.from("missions").delete().eq("id", id);
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const reorderMissions = async (activeId: string, overId: string) => {
    setMissions((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === activeId);
      const newIndex = prev.findIndex((m) => m.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newMissions = [...prev];
      const [movedItem] = newMissions.splice(oldIndex, 1);
      newMissions.splice(newIndex, 0, movedItem);
      
      // Update sort order instantly for optimistic UI
      const updatedMissions = newMissions.map((m, i) => ({ ...m, sort_order: i }));
      
      // Sync to backend (don't await to keep UI fast)
      const updates = updatedMissions.map((m) => ({ id: m.id, sort_order: m.sort_order }));
      supabase.from("missions").upsert(updates).then(({ error }) => {
        if (error) {
          toast.error("Failed to reorder missions");
          refetch(); // Rollback if mass upsert fails
        }
      });
      
      return updatedMissions;
    });
  };

  const completedCount = missions.filter((m) => m.status === "done").length;
  const completionRate = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  return {
    missions,
    loading,
    addMission,
    toggleMission,
    deleteMission,
    reorderMissions,
    completedCount,
    completionRate,
    total: missions.length,
    refetch: fetchMissions,
  };
}
