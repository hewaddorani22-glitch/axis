"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export interface Partner {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  status: "pending" | "active" | "removed";
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get partnerships where I'm user_a or user_b
    const { data: partnerships } = await supabase
      .from("partnerships")
      .select("*, user_a_profile:users!partnerships_user_a_fkey(*), user_b_profile:users!partnerships_user_b_fkey(*)")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .neq("status", "removed");

    if (partnerships) {
      const mapped = partnerships.map((p: any) => {
        const isA = p.user_a === user.id;
        const partner = isA ? p.user_b_profile : p.user_a_profile;
        return {
          id: p.id,
          partnerId: partner?.id,
          name: partner?.name || partner?.email?.split("@")[0] || "Partner",
          email: partner?.email || "",
          status: p.status,
        };
      });
      setPartners(mapped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const sendNudge = async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("nudges").insert({
      from_user: user.id,
      to_user: toUserId,
    });
  };

  return { partners, loading, sendNudge, refetch: fetchPartners };
}
