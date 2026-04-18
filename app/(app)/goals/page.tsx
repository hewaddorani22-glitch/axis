"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useObjectives, ObjectiveRollupType, ObjectiveWithRollup } from "@/hooks/useObjectives";
import {
  IconGoals,
  IconHabits,
  IconPlus,
  IconRevenue,
  IconTarget,
  IconTrash,
} from "@/components/icons";

function objectiveIcon(type: ObjectiveRollupType) {
  if (type === "revenue") return <IconRevenue size={16} className="text-emerald-500" />;
  if (type === "habits") return <IconHabits size={16} className="text-axis-accent" />;
  return <IconTarget size={16} className="text-axis-accent" />;
}

function formatObjectiveValue(objective: ObjectiveWithRollup, value: number) {
  if (objective.unit === "$") {
    return `$${Math.round(value).toLocaleString()}`;
  }

  return `${Math.round(value).toLocaleString()}${objective.unit ? ` ${objective.unit}` : ""}`;
}

export default function ThemesPage() {
  const { objectives, loading, addObjective, deleteObjective } = useObjectives();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ObjectiveRollupType>("missions");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newStartDate, setNewStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newDeadline, setNewDeadline] = useState("");
  const [quickAddRequested, setQuickAddRequested] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuickAddRequested(new URLSearchParams(window.location.search).get("quickAdd") === "1");
  }, []);

  useEffect(() => {
    if (!quickAddRequested) return;
    setShowAdd(true);
  }, [quickAddRequested]);

  useEffect(() => {
    if (!showAdd) return;
    titleInputRef.current?.focus();
  }, [showAdd]);

  const handleAddTheme = async () => {
    if (!newTitle.trim()) return;

    await addObjective({
      title: newTitle.trim(),
      rollupType: newType,
      targetValue: newTarget ? parseFloat(newTarget) : null,
      unit: newUnit || null,
      startDate: newStartDate,
      deadline: newDeadline || null,
    });

    setNewTitle("");
    setNewTarget("");
    setNewUnit("");
    setNewDeadline("");
    setNewType("missions");
    setNewStartDate(new Date().toISOString().split("T")[0]);
    setShowAdd(false);
  };

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
            Themes
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            One objective layer that tasks, habits, and revenue can all roll into.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((current) => !current)}
          className="inline-flex items-center gap-2 rounded-xl bg-axis-accent px-4 py-2 text-xs font-semibold text-axis-dark"
        >
          <IconPlus size={12} />
          New Theme
        </button>
      </div>

      {showAdd ? (
        <div className="axis-card space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_200px]">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="e.g. Revenue Q3, Ship v2, Daily Energy"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ObjectiveRollupType)}
              className="w-full rounded-xl px-3 py-3 text-sm font-mono outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            >
              <option value="missions">Tasks Rollup</option>
              <option value="habits">Habits Rollup</option>
              <option value="revenue">Revenue Rollup</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="number"
              placeholder="Target"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full rounded-xl px-3 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              placeholder={newType === "revenue" ? "$" : "unit"}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full rounded-xl px-3 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="w-full rounded-xl px-3 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            />
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full rounded-xl px-3 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--bg-tertiary)" }}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Progress will be rolled up automatically from linked {newType === "missions" ? "tasks" : newType}.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Cancel
              </button>
              <button onClick={handleAddTheme} className="rounded-lg bg-axis-accent px-4 py-2 text-xs font-semibold text-axis-dark">
                Create Theme
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : objectives.length === 0 ? (
        <div className="axis-card py-14 text-center">
          <IconGoals size={40} className="mx-auto mb-4 text-axis-accent" />
          <h2 className="text-xl font-semibold">No themes yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
            Create one objective layer first, then link tasks, habits, or revenue streams to it when you capture them.
          </p>
          <button onClick={() => setShowAdd(true)} className="mt-5 text-sm font-semibold text-axis-accent hover:underline">
            Create your first theme
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective) => (
            <div key={objective.id} className="axis-card">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {objectiveIcon(objective.rollup_type)}
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                      {objective.rollup_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{objective.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {objective.rollup_type === "revenue"
                      ? `${objective.linkedCounts.streams} linked stream${objective.linkedCounts.streams !== 1 ? "s" : ""}`
                      : objective.rollup_type === "habits"
                      ? `${objective.linkedCounts.habits} linked habit${objective.linkedCounts.habits !== 1 ? "s" : ""}`
                      : `${objective.linkedCounts.missions} linked task${objective.linkedCounts.missions !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteObjective(objective.id)}
                  className="rounded-xl p-2 transition-colors hover:bg-axis-hover"
                  title="Delete theme"
                >
                  <IconTrash size={15} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    Progress
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{objective.progressPct}%</p>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    Expected
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{objective.expectedPct}%</p>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    Outcome Pace
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{objective.outcomePct}%</p>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    Current / Target
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatObjectiveValue(objective, objective.currentValue)} / {formatObjectiveValue(objective, objective.targetValue)}
                  </p>
                </div>
              </div>

              <div className="mb-4 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(objective.progressPct, 2)}%`, backgroundColor: objective.color || "#CDFF4F" }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span className="font-mono">
                  Window: {objective.start_date}
                  {objective.deadline ? ` → ${objective.deadline}` : " → open"}
                </span>
                {objective.rollup_type === "revenue" && objective.monthlyTarget > 0 ? (
                  <span className="font-mono">Monthly pace target: {formatObjectiveValue(objective, objective.monthlyTarget)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {objectives.length}/2 themes on Free · <Link href="/settings" className="text-axis-accent hover:underline">Upgrade to Pro</Link> for unlimited
        </p>
      </div>
    </div>
  );
}
