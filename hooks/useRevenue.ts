"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export interface RevenueStream {
  id: string;
  name: string;
  color: string;
  is_recurring?: boolean;
  objective_id?: string | null;
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

  const addStream = async (
    name: string,
    color: string = "#CDFF4F",
    isRecurring = false,
    objectiveId?: string | null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
    if (profile?.plan === "free" && streams.length >= 1) {
      toast.error("Free plan limit reached", { description: "1 revenue stream maximum. Upgrade to Pro in Settings to unlock unlimited streams." });
      return;
    }

    const { data } = await supabase
      .from("revenue_streams")
      .insert({ user_id: user.id, name, color, is_recurring: isRecurring, objective_id: objectiveId || null })
      .select()
      .single();

    if (data) setStreams((prev) => [...prev, data as RevenueStream]);
  };

  const addEntry = async (streamId: string, amount: number, note?: string, date?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entryDate = date || new Date().toISOString().split("T")[0];
    const tempId = `temp-${Date.now()}`;
    const tempEntry: RevenueEntry = {
      id: tempId,
      stream_id: streamId,
      amount,
      date: entryDate,
      note: note || null,
    };

    // Optimistic UI
    setEntries((prev) => [tempEntry, ...prev]);

    const { data, error } = await supabase
      .from("revenue_entries")
      .insert({
        user_id: user.id,
        stream_id: streamId,
        amount,
        note: note || null,
        date: entryDate,
      })
      .select()
      .single();

    if (error) {
      // Rollback
      toast.error("Failed to add entry");
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
    } else if (data) {
      // Replace temp ID with real ID
      setEntries((prev) => prev.map((e) => (e.id === tempId ? (data as RevenueEntry) : e)));
    }
  };

  const deleteEntry = async (entryId: string) => {
    // Find the deleted entry in case of rollback
    const deletedEntry = entries.find((e) => e.id === entryId);
    if (!deletedEntry) return;

    // Optimistic UI
    setEntries((prev) => prev.filter((e) => e.id !== entryId));

    const { error } = await supabase.from("revenue_entries").delete().eq("id", entryId);
    
    if (error) {
      toast.error("Failed to delete entry");
      // Rollback
      setEntries((prev) => {
        const reset = [...prev, deletedEntry];
        reset.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return reset;
      });
    }
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

  // MRR: Sum of monthly totals for recurring streams
  const mrrTotal = streamTotals
    .filter((s) => s.is_recurring)
    .reduce((sum, s) => sum + s.total, 0);

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
    mrrTotal,
    streamTotals,
    monthlyTotals,
    refetch: fetchData,
  };
}
