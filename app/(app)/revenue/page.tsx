"use client";

import { useState } from "react";
import { useRevenue } from "@/hooks/useRevenue";
import { formatCurrency } from "@/lib/utils";
import { IconRevenue, IconPlus } from "@/components/icons";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

export default function RevenuePage() {
  const { streams, entries, loading, addStream, addEntry, mtdTotal, streamTotals, monthlyTotals, deleteEntry } = useRevenue();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);
  const [entryStreamId, setEntryStreamId] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newStreamName, setNewStreamName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddEntry = async () => {
    if (!entryStreamId || !entryAmount) return;
    setSaving(true);
    await addEntry(entryStreamId, parseFloat(entryAmount), entryNote || undefined, entryDate);
    setEntryAmount("");
    setEntryNote("");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setShowAddEntry(false);
    setSaving(false);
  };

  const handleQuickAdd = async (amount: number) => {
    if (!streams.length) return;
    setSaving(true);
    await addEntry(streams[0].id, amount);
    setSaving(false);
  };

  const handleAddStream = async () => {
    if (!newStreamName.trim()) return;
    const colors = ["#CDFF4F", "#F97316", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];
    const color = colors[streams.length % colors.length];
    await addStream(newStreamName.trim(), color);
    setNewStreamName("");
    setShowAddStream(false);
  };

  const openAddEntry = () => {
    if (streams.length > 0) {
      setEntryStreamId(streams[0].id);
      setShowAddEntry(true);
    } else {
      setShowAddStream(true);
    }
  };

  const grandTotal = streamTotals.reduce((sum, s) => sum + s.total, 0);
  const lastMonth = monthlyTotals.length >= 2 ? monthlyTotals[monthlyTotals.length - 2].total : 0;
  const growthPct = lastMonth > 0 ? Math.round(((mtdTotal - lastMonth) / lastMonth) * 100) : 0;

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // Empty state — first time user, no streams yet
  if (streams.length === 0 && !showAddStream) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="axis-card text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <IconRevenue size={32} className="text-axis-accent" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Track Your Income
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-tertiary)" }}>
            Log every dollar you earn — freelance gigs, product sales, subscriptions, anything.
            See your monthly trends and know exactly where your money comes from.
          </p>

          <div className="max-w-sm mx-auto space-y-3 mb-8 text-left">
            <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>How it works</p>
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold bg-axis-accent text-axis-dark w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create an income source (e.g. "Freelance", "Shopify", "YouTube")</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold bg-axis-accent text-axis-dark w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Log income whenever you get paid — takes 5 seconds</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold bg-axis-accent text-axis-dark w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Watch your monthly chart grow and hit your revenue goals</p>
            </div>
          </div>

          <div className="max-w-sm mx-auto">
            <p className="text-xs font-mono mb-2" style={{ color: "var(--text-tertiary)" }}>Name your first income source</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder='e.g. "Freelance Design"'
                value={newStreamName}
                onChange={(e) => setNewStreamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStream()}
                className="flex-1 text-sm rounded-xl px-4 py-3 outline-none"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                autoFocus
              />
              <button
                onClick={handleAddStream}
                disabled={!newStreamName.trim()}
                className="bg-axis-accent text-axis-dark text-sm font-semibold px-5 py-3 rounded-xl hover:bg-axis-accent/90 transition-all disabled:opacity-40"
              >
                Create
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Freelance", "Shopify", "YouTube", "Consulting", "SaaS"].map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStreamName(s)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* MTD + Growth */}
      <div className="axis-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconRevenue size={16} className="text-emerald-500" />
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              {new Date().toLocaleString("en", { month: "long" })} Income
            </span>
          </div>
          {lastMonth > 0 && (
            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${growthPct >= 0 ? "text-emerald-500" : "text-red-400"}`}
              style={{ backgroundColor: growthPct >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
              {growthPct >= 0 ? "+" : ""}{growthPct}% vs last month
            </span>
          )}
        </div>
        <span className="text-4xl font-bold">{formatCurrency(mtdTotal)}</span>

        {/* Quick add buttons */}
        {streams.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
            <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Quick Log</p>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAdd(amt)}
                  disabled={saving}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:ring-1 hover:ring-axis-accent/30 disabled:opacity-50"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  +${amt}
                </button>
              ))}
              <button
                onClick={openAddEntry}
                className="text-xs font-semibold text-axis-accent px-3 py-1.5 rounded-lg transition-all hover:underline flex items-center gap-1"
              >
                <IconPlus size={12} /> Custom
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Entry Form */}
      {showAddEntry && streams.length > 0 && (
        <div className="axis-card !border-axis-accent/20">
          <h3 className="text-sm font-semibold mb-4">Log Income</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Source</label>
                <select
                  value={entryStreamId}
                  onChange={(e) => setEntryStreamId(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                >
                  {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Note <span style={{ color: "var(--text-tertiary)" }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Logo project for client"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddEntry}
                disabled={!entryAmount || saving}
                className="bg-axis-accent text-axis-dark text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-axis-accent/90 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Log Income"}
              </button>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-sm px-4 py-2.5 rounded-xl transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {entries.length > 0 && (
        <div className="axis-card">
          <h3 className="text-sm font-semibold mb-4">Monthly Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotals} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "monospace", fill: "var(--text-tertiary)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: "monospace", fill: "var(--text-tertiary)" }}
                  tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-hover)", radius: 8 }}
                  contentStyle={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Income"]}
                  labelStyle={{ color: "var(--text-tertiary)", fontSize: 11, fontFamily: "monospace" }}
                />
                <Bar dataKey="total" fill="#CDFF4F" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Income Sources */}
      <div className="axis-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Income Sources</h3>
          <button
            onClick={() => setShowAddStream(!showAddStream)}
            className="text-xs font-semibold text-axis-accent hover:underline flex items-center gap-1"
          >
            <IconPlus size={12} /> Add Source
          </button>
        </div>
        {showAddStream && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <input
              type="text"
              placeholder='e.g. "Freelance", "Shopify", "Consulting"'
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStream()}
              className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              autoFocus
            />
            <button onClick={handleAddStream} disabled={!newStreamName.trim()} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40">Add</button>
          </div>
        )}
        {streams.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No income sources yet</p>
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
                      {grandTotal > 0 && (
                        <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{pct}%</span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Income */}
      <div className="axis-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Income</h3>
          <button
            onClick={openAddEntry}
            className="text-xs font-semibold bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all flex items-center gap-1"
          >
            <IconPlus size={12} /> Log Income
          </button>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>No income logged yet</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Use Quick Log above or click "Log Income" to add your first entry</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.slice(0, 15).map((e) => {
              const stream = streams.find((s) => s.id === e.stream_id);
              return (
                <div
                  key={e.id}
                  className="group flex items-center gap-4 py-3 px-3 rounded-xl transition-colors"
                  onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stream?.color || "#CDFF4F" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{e.note || stream?.name || "Income"}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {stream?.name && e.note ? `${stream.name} · ` : ""}{e.date}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">+{formatCurrency(Number(e.amount))}</span>
                  {deleteEntry && (
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {streams.length}/1 income source · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited
        </p>
      </div>
    </div>
  );
}
