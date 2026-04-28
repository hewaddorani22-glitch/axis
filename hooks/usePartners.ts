"use client";

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

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners", { cache: "no-store" });
      if (res.status === 401) {
        setPartners([]);
        return;
      }

      const json = await res.json();
      setPartners(json.partners || []);
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const sendNudge = async (toUserId: string) => {
    await fetch("/api/partners/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });
  };

  return { partners, loading, sendNudge, refetch: fetchPartners };
}
