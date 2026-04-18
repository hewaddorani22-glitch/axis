"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export interface RevenueStream {
  id: string;
  name: string;
  color: string;
}

export interface RevenueEntry {
  id: string;
  stream_id: string;
  amount: number;
  date: string;
  note: string | null;
}

export function useRevenue() {
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

    const [streamsRes, entriesRes] = await Promise.all([
      supabase.from("revenue_streams").select("*").order("created_at"),
      supabase
        .from("revenue_entries")
        .select("*")
        .gte("date", sixMonthsAgoStr)
        .order("date", { ascending: false }),
    ]);

    setStreams((streamsRes.data as RevenueStream[]) || []);
    setEntries((entriesRes.data as RevenueEntry[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addStream = async (name: string, color: string = "#CDFF4F") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && streams.length >= 1) {
      alert("Free plan limit reached: 1 revenue stream maximum. Upgrade to Pro in Settings to unlock unlimited streams.");
      return;
    }

    const { data } = await supabase
      .from("revenue_streams")
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (data) setStreams((prev) => [...prev, data as RevenueStream]);
  };

  const addEntry = async (streamId: string, amount: number, note?: string, date?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("revenue_entries")
      .insert({
        user_id: user.id,
        stream_id: streamId,
        amount,
        note: note || null,
        date: date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (data) setEntries((prev) => [data as RevenueEntry, ...prev]);
  };

  const deleteEntry = async (entryId: string) => {
    await supabase.from("revenue_entries").delete().eq("id", entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  // Calculate MTD
  const now = new Date();
  const mtdStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mtdTotal = entries
    .filter((e) => e.date >= mtdStart)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Stream totals for current month
  const streamTotals = streams.map((s) => ({
    ...s,
    total: entries
      .filter((e) => e.stream_id === s.id && e.date >= mtdStart)
      .reduce((sum, e) => sum + Number(e.amount), 0),
  }));

  // Monthly totals for last 6 months (for chart)
  const monthlyTotals = (() => {
    const months: { month: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en", { month: "short" });
      const total = entries
        .filter((e) => e.date.startsWith(key))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      months.push({ month: key, label, total });
    }
    return months;
  })();

  return {
    streams,
    entries,
    loading,
    addStream,
    addEntry,
    deleteEntry,
    mtdTotal,
    streamTotals,
    monthlyTotals,
    refetch: fetchData,
  };
}
