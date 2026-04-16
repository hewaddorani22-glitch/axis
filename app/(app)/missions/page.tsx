"use client";

import { useState } from "react";
import { useMissions } from "@/hooks/useMissions";
import { IconTarget, IconCheck, IconPlus } from "@/components/icons";
import Link from "next/link";

type Priority = "high" | "med" | "low";

export default function MissionsPage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("med");

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDay);
  const dateStr = targetDate.toISOString().split("T")[0];

  const { missions, loading, addMission, toggleMission, completedCount, completionRate, total } = useMissions(dateStr);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addMission(newTitle.trim(), newPriority);
    setNewTitle("");
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconTarget size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>Completion</span>
          <span className="text-sm font-bold text-axis-accent">{completionRate}%</span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconCheck size={14} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>Done</span>
          <span className="text-sm font-bold">{completedCount}/{total}</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {days.map((day, i) => {
          const isToday = i === 3;
          const isSelected = i - 3 === selectedDay;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i - 3)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-xl transition-all min-w-[60px] ${
                isSelected ? "bg-axis-accent text-axis-dark" : ""
              }`}
              style={!isSelected ? { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)" } : undefined}
            >
              <span className="text-[10px] font-mono uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="text-lg font-bold">{day.getDate()}</span>
              {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-axis-accent mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Add mission */}
      <div className="axis-card flex items-center gap-3">
        <div className="w-5 h-5 rounded-md border-2 border-dashed flex-shrink-0" style={{ borderColor: "var(--border-secondary)" }} />
        <input
          type="text"
          placeholder="Add a new mission..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as Priority)} className="text-xs font-mono rounded-lg px-2 py-1.5 outline-none" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
          <option value="high">High</option>
          <option value="med">Med</option>
          <option value="low">Low</option>
        </select>
        <button onClick={handleAdd} className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all">Add</button>
      </div>

      {/* Missions */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
      ) : missions.length === 0 ? (
        <div className="text-center py-12">
          <IconTarget size={40} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-tertiary)" }}>No missions for this day</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Add your first mission above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {missions.map((m) => (
            <div key={m.id} className="group axis-card flex items-center gap-4">
              <button
                onClick={() => toggleMission(m.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${m.status === "done" ? "bg-axis-accent border-axis-accent axis-check" : "hover:border-axis-accent/50"}`}
                style={m.status !== "done" ? { borderColor: "var(--border-secondary)" } : undefined}
              >
                {m.status === "done" && <IconCheck size={14} className="text-axis-dark" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${m.status === "done" ? "line-through" : ""}`} style={{ color: m.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}>{m.title}</p>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg ${m.priority === "high" ? "bg-red-500/10 text-red-500" : m.priority === "med" ? "bg-amber-500/10 text-amber-500" : "bg-gray-500/10 text-gray-400"}`}>{m.priority}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {total}/5 missions today · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited
        </p>
      </div>
    </div>
  );
}
