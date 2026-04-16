"use client";

import { useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { IconHabits, IconCheck, IconStreak } from "@/components/icons";
import Link from "next/link";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SystemsPage() {
  const { habits, loading, addHabit, toggleHabit, completedToday, total } = useHabits();
  const [newHabit, setNewHabit] = useState("");
  const [newIcon, setNewIcon] = useState("◆");

  const handleAdd = async () => {
    if (!newHabit.trim()) return;
    await addHabit(newHabit.trim(), newIcon || "◆");
    setNewHabit("");
    setNewIcon("◆");
  };

  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconHabits size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>Today</span>
          <span className="text-sm font-bold">{completedToday}/{total}</span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconStreak size={14} className="text-orange-500" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>Best Streak</span>
          <span className="text-sm font-bold text-orange-500">{bestStreak > 0 ? `${bestStreak} days` : "—"}</span>
        </div>
      </div>

      {/* Habits */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12">
          <IconHabits size={40} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-tertiary)" }}>No habits set up yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Add your first habit below</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((h) => (
            <div key={h.id} className="axis-card">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => toggleHabit(h.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${h.todayDone ? "ring-2 ring-axis-accent/30" : ""}`}
                  style={{ backgroundColor: h.todayDone ? "var(--bg-accent-soft)" : "var(--bg-tertiary)" }}
                >
                  <IconHabits size={20} className={h.todayDone ? "text-axis-accent" : ""} style={!h.todayDone ? { color: "var(--text-tertiary)" } : undefined} />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold" style={{ color: h.todayDone ? "var(--text-tertiary)" : "var(--text-primary)" }}>{h.name}</h3>
                    {h.todayDone && (
                      <span className="text-xs font-mono text-axis-accent px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{h.streak} day streak</p>
                </div>
                <button
                  onClick={() => toggleHabit(h.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${h.todayDone ? "bg-axis-accent text-axis-dark" : ""}`}
                  style={!h.todayDone ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" } : undefined}
                >
                  {h.todayDone ? <IconCheck size={18} /> : <div className="w-3 h-3 rounded-full" style={{ borderWidth: 2, borderColor: "var(--border-secondary)" }} />}
                </button>
              </div>
              {/* Weekly heatmap */}
              <div className="flex items-center gap-2">
                {h.weekLog.map((done, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full h-8 rounded-lg transition-all" style={{ backgroundColor: done ? "var(--bg-accent-soft)" : "var(--bg-tertiary)" }} />
                    <span className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add habit */}
      <div className="axis-card flex items-center gap-3 !border-dashed">
        <input type="text" placeholder="Icon" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-12 h-12 rounded-xl text-center text-2xl outline-none" style={{ backgroundColor: "var(--bg-tertiary)" }} maxLength={2} />
        <input type="text" placeholder="Add a new habit..." value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
        <button onClick={handleAdd} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all">Add</button>
      </div>

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{total}/3 habits · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited</p>
      </div>
    </div>
  );
}
