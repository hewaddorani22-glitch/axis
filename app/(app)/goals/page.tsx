"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { getDaysUntil } from "@/lib/utils";
import { IconGoals, IconWarning, IconPlus } from "@/components/icons";
import Link from "next/link";

export default function GoalsPage() {
  const { goals, loading, addGoal, updateGoalProgress } = useGoals();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddGoal = async () => {
    if (!newTitle.trim() || !newTarget) return;
    await addGoal(newTitle.trim(), parseFloat(newTarget), newUnit || undefined, newDeadline || undefined);
    setNewTitle(""); setNewTarget(""); setNewUnit(""); setNewDeadline(""); setShowAdd(false);
  };

  const handleUpdateProgress = async (id: string) => {
    if (!editValue) return;
    await updateGoalProgress(id, parseFloat(editValue));
    setEditingId(null); setEditValue("");
  };

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{goals.length} active goal{goals.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs font-semibold bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all flex items-center gap-1"><IconPlus size={12} /> New Goal</button>
      </div>

      {showAdd && (
        <div className="axis-card space-y-4">
          <input type="text" placeholder="Goal title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full text-sm rounded-xl px-4 py-3 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} autoFocus />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Target</label>
              <input type="number" placeholder="10000" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Unit</label>
              <input type="text" placeholder="$" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-tertiary)" }}>Deadline</label>
              <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs px-4 py-2" style={{ color: "var(--text-tertiary)" }}>Cancel</button>
            <button onClick={handleAddGoal} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg">Create</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12">
          <IconGoals size={40} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-tertiary)" }}>No goals set yet</p>
          <button onClick={() => setShowAdd(true)} className="text-xs font-semibold text-axis-accent hover:underline mt-2">Set your first goal →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = g.target_value > 0 ? Math.round((Number(g.current_value) / Number(g.target_value)) * 100) : 0;
            const deadline = g.deadline ? new Date(g.deadline) : null;
            const daysLeft = deadline ? getDaysUntil(deadline) : null;
            const isWarning = daysLeft !== null && daysLeft < 14 && pct < 80;
            const progressColor = pct >= 80 ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-axis-accent";

            return (
              <div key={g.id} className="axis-card" style={isWarning ? { borderColor: "rgba(245,158,11,0.3)" } : undefined}>
                {isWarning && (
                  <div className="flex items-center gap-2 rounded-xl px-4 py-2 mb-4" style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <IconWarning size={14} className="text-amber-500" />
                    <span className="text-xs font-mono text-amber-500">{daysLeft} days left — only {pct}% done</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold">{g.title}</h3>
                    {deadline && <p className="text-xs font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>Deadline: {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{daysLeft !== null && daysLeft > 0 ? ` · ${daysLeft}d left` : daysLeft === 0 ? " · Due today" : " · Overdue"}</p>}
                  </div>
                  <span className="text-2xl font-bold">{pct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {g.unit === "$" ? `$${Number(g.current_value).toLocaleString()}` : `${g.current_value} ${g.unit || ""}`} / {g.unit === "$" ? `$${Number(g.target_value).toLocaleString()}` : `${g.target_value} ${g.unit || ""}`}
                  </span>
                  {editingId === g.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUpdateProgress(g.id)} className="w-24 text-xs rounded-lg px-2 py-1.5 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} autoFocus />
                      <button onClick={() => handleUpdateProgress(g.id)} className="text-xs font-semibold text-axis-accent">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(g.id); setEditValue(String(g.current_value)); }} className="text-xs transition-colors text-axis-accent hover:underline">Update progress</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{goals.length}/2 goals · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited</p>
      </div>
    </div>
  );
}
