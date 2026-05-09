"use client";

import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";
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
  objective_id?: string | null;
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

  const addMission = async (
    title: string,
    priority: "high" | "med" | "low" = "med",
    category?: string,
    estimated_time?: number,
    energy_level?: "high" | "med" | "low",
    objective_id?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).maybeSingle();
    if (profile?.plan === "free" && missions.length >= 5) {
      const isDe = typeof document !== "undefined" && document.documentElement.lang === "de";
      toast.error(isDe ? "Free-Plan-Limit erreicht" : "Free plan limit reached", {
        description: isDe
          ? "Maximal 5 Missionen pro Tag. Upgrade auf Pro in den Einstellungen fuer unbegrenzte Missionen."
          : "5 daily missions maximum. Upgrade to Pro in Settings to unlock unlimited missions.",
      });
      openUpgradePrompt({ source: "mission_limit" });
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
        objective_id: objective_id || null,
        estimated_time: estimated_time || null,
        energy_level: energy_level || null,
      })
      .select()
      .single();

    if (data) {
      if (missions.length === 0) {
        trackEvent("first_task_created", { source: "missions" });
      }
      setMissions((prev) => [...prev, data as Mission]);
    }
  };

  const toggleMission = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    const newStatus = mission.status === "done" ? "active" : "done";

    // Optimistic update for zero-latency UI
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );

    // Variable reward: fire celebration only when transitioning to done
    if (newStatus === "done" && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lomoura:mission-completed", {
          detail: { id, title: mission.title },
        })
      );
    }

    // Background sync
    const { error } = await supabase.from("missions").update({ status: newStatus }).eq("id", id);

    if (error) {
      // Rollback on failure
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: mission.status } : m))
      );
      return;
    }

    // Activation: fire `first_mission_completed` exactly once per user (server-stamped).
    // Idempotency relies on the conditional update — only the row where
    // first_mission_completed_at IS NULL will be touched, so the count we get back
    // tells us whether *this* completion was the first.
    if (newStatus === "done") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: stamped, error: stampError } = await supabase
          .from("users")
          .update({ first_mission_completed_at: new Date().toISOString() })
          .eq("id", user.id)
          .is("first_mission_completed_at", null)
          .select("id");
        if (!stampError && stamped && stamped.length > 0) {
          const signupAt = user.created_at ? new Date(user.created_at).getTime() : null;
          const dayOffset = signupAt
            ? Math.floor((Date.now() - signupAt) / 86_400_000)
            : null;
          trackEvent("first_mission_completed", {
            day_offset: dayOffset,
            mission_priority: mission.priority,
            missions_total: missions.length,
          });
        }
      }
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
          fetchMissions(); // Rollback if mass upsert fails
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
