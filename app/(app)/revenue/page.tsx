"use client";

import { useState } from "react";
import { useRevenue } from "@/hooks/useRevenue";
import { formatCurrency } from "@/lib/utils";
import { IconRevenue, IconPlus } from "@/components/icons";
import Link from "next/link";

export default function RevenuePage() {
  const { streams, entries, loading, addStream, addEntry, mtdTotal, streamTotals } = useRevenue();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);
  const [entryStreamId, setEntryStreamId] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [newStreamName, setNewStreamName] = useState("");

  const handleAddEntry = async () => {
    if (!entryStreamId || !entryAmount) return;
    await addEntry(entryStreamId, parseFloat(entryAmount), entryNote || undefined);
    setEntryAmount(""); setEntryNote(""); setShowAddEntry(false);
  };

  const handleAddStream = async () => {
    if (!newStreamName.trim()) return;
    await addStream(newStreamName.trim());
    setNewStreamName(""); setShowAddStream(false);
  };

  const grandTotal = streamTotals.reduce((sum, s) => sum + s.total, 0);

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* MTD */}
      <div className="axis-card">
        <div className="flex items-center gap-2 mb-2">
          <IconRevenue size={16} className="text-emerald-500" />
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Month to Date</span>
        </div>
        {loading ? <Skeleton className="h-10 w-40 mt-2" /> : <span className="text-4xl font-bold">{formatCurrency(mtdTotal)}</span>}
      </div>

      {/* Streams */}
      <div className="axis-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Stream Breakdown</h3>
          <button onClick={() => setShowAddStream(!showAddStream)} className="text-xs font-semibold text-axis-accent hover:underline flex items-center gap-1"><IconPlus size={12} /> Add Stream</button>
        </div>
        {showAddStream && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <input type="text" placeholder="Stream name" value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddStream()} className="flex-1 text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            <button onClick={handleAddStream} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg">Add</button>
          </div>
        )}
        {loading ? (
          <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : streams.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No income streams yet</p>
            <button onClick={() => setShowAddStream(true)} className="text-xs font-semibold text-axis-accent hover:underline mt-2">Add your first stream →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {streamTotals.map((s) => {
              const pct = grandTotal > 0 ? Math.round((s.total / grandTotal) * 100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatCurrency(s.total)}</span>
                      <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="axis-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Entries</h3>
          <button onClick={() => { if (streams.length > 0) { setEntryStreamId(streams[0].id); setShowAddEntry(!showAddEntry); } else { setShowAddStream(true); } }} className="text-xs font-semibold bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all flex items-center gap-1"><IconPlus size={12} /> Add Entry</button>
        </div>
        {showAddEntry && streams.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Stream</label>
              <select value={entryStreamId} onChange={(e) => setEntryStreamId(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="w-[120px]">
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Amount</label>
              <input type="number" placeholder="0.00" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            </div>
            <div className="w-[140px]">
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Note</label>
              <input type="text" placeholder="Optional" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            </div>
            <button onClick={handleAddEntry} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg">Save</button>
          </div>
        )}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6"><p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No revenue entries yet</p></div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 10).map((e) => {
              const stream = streams.find((s) => s.id === e.stream_id);
              return (
                <div key={e.id} className="flex items-center gap-4 py-3 px-3 rounded-xl transition-colors" onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "var(--bg-hover)")} onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "transparent")}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stream?.color || "#CDFF4F" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{e.note || "Revenue entry"}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>{stream?.name} · {e.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">+{formatCurrency(Number(e.amount))}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{streams.length}/1 stream · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited</p>
      </div>
    </div>
  );
}
