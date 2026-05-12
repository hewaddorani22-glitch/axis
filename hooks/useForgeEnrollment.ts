"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ForgeProgram = "foundation" | "builder" | "scholar";

export interface ForgeEnrollment {
  user_id: string;
  program: ForgeProgram;
  vow: string;
  pillars: {
    body: string;
    mind: string;
    intellect: string;
  };
  started_at: string; // ISO date
}

/**
 * Phase 1 enrollment storage: localStorage. Each user gets their own key
 * so multiple test accounts on one device don't collide. A future migration
 * will move this into an `enrollments` table (see LOMOURA-FORGE.md §6).
 */
export function useForgeEnrollment() {
  const [enrollment, setEnrollment] = useState<ForgeEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      try {
        const raw = localStorage.getItem(`forge:enrollment:${authUser.id}`);
        if (raw) setEnrollment(JSON.parse(raw) as ForgeEnrollment);
      } catch {
        /* private mode */
      }
      setLoading(false);
    })();
  }, []);

  return { enrollment, loading };
}

/** Day-of-program based on the local clock. 1-indexed; capped at 90. */
export function computeDayIndex(startedAt: string): number {
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  const day = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(90, day));
}
