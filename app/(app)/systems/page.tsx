"use client";

import { useState, useEffect, useCallback } from "react";
import { useHabits, HabitWithStatus } from "@/hooks/useHabits";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { IconHabits, IconCheck, IconStreak, IconFreeze } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmptyState } from "@/components/app/empty-state";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SortableHabitItem({
  habit,
  toggleHabit,
}: {
  habit: HabitWithStatus;
  toggleHabit: (id: string, action?: "done" | "skip" | "undo", val?: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`axis-card transition-all ${isDragging ? "shadow-2xl scale-[1.02] border-axis-accent/50" : ""}`}
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Drag Handle */}
        <button
          className="flex p-2 flex-col items-center justify-center gap-[3px] text-axis-text3 hover:text-axis-text2 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </button>

        <button
          onClick={() => toggleHabit(habit.id, habit.todayDone || habit.todaySkipped ? "undo" : "done")}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            habit.todayDone ? "ring-2 ring-axis-accent/30" : habit.todaySkipped ? "ring-2 ring-amber-500/30 opacity-70" : ""
          }`}
          style={{ backgroundColor: habit.todayDone ? "var(--bg-accent-soft)" : habit.todaySkipped ? "rgba(245, 158, 11, 0.1)" : "var(--bg-tertiary)" }}
        >
          <IconHabits
            size={20}
            className={habit.todayDone ? "text-axis-accent" : habit.todaySkipped ? "text-amber-500" : ""}
            style={!(habit.todayDone || habit.todaySkipped) ? { color: "var(--text-tertiary)" } : undefined}
          />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-semibold transition-colors"
              style={{ color: habit.todayDone || habit.todaySkipped ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: habit.todaySkipped ? "line-through" : "none" }}
            >
              {habit.name}
            </h3>
            {habit.todayDone && (
              <span
                className="text-xs font-mono text-axis-accent px-2 py-0.5 rounded-md"
                style={{ backgroundColor: "var(--bg-accent-soft)" }}
              >
                Done
              </span>
            )}
            {habit.todaySkipped && (
              <span
                className="text-xs font-mono text-amber-500 px-2 py-0.5 rounded-md"
                style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
              >
                Skipped
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
              {habit.streak} day streak
            </p>
            {habit.target_value && (
               <div className="flex items-center gap-1">
                 <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                   <div 
                     className="h-full bg-axis-accent transition-all duration-300"
                     style={{ width: `${Math.min(100, ((habit.todayValue || 0) / habit.target_value) * 100)}%` }} 
                   />
                 </div>
                 <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                   {habit.todayValue || 0}/{habit.target_value} {habit.unit || ""}
                 </span>
               </div>
            )}
            {!(habit.todayDone || habit.todaySkipped) && !habit.target_value && (
               <button 
                 onClick={() => toggleHabit(habit.id, "skip")}
                 className="text-[10px] font-semibold text-axis-text2 hover:text-axis-text1 hover:bg-axis-hover px-2 rounded transition-colors"
               >
                 Skip Today
               </button>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleHabit(habit.id, habit.todayDone || habit.todaySkipped ? "undo" : "done")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            habit.todayDone ? "bg-axis-accent text-axis-dark" : habit.todaySkipped ? "bg-amber-500 text-axis-dark" : "hover:bg-axis-hover"
          }`}
          style={!(habit.todayDone || habit.todaySkipped) ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" } : undefined}
        >
          {habit.todayDone ? (
            <IconCheck size={18} />
          ) : habit.todaySkipped ? (
            <span className="text-sm font-bold">−</span>
          ) : (
            <div className="w-3 h-3 rounded-full" style={{ borderWidth: 2, borderColor: "var(--border-secondary)" }} />
          )}
        </button>
      </div>
      {/* Weekly heatmap */}
      <div className="flex items-center gap-2 pl-10">
        {habit.weekLog.map((status, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-full h-8 rounded-lg transition-all ${status !== "missed" ? "scale-105 shadow-sm" : ""}`}
              style={{ backgroundColor: status === "done" ? "var(--accent)" : status === "skipped" ? "rgba(245, 158, 11, 0.4)" : "var(--bg-tertiary)" }}
            />
            <span className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              {weekDays[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemsPage() {
  const { habits, loading, addHabit, toggleHabit, reorderHabits, completedToday, total } = useHabits();
  const { user } = useUser();
  const { streak } = useStreak();
  const [newHabit, setNewHabit] = useState("");
  const [newIcon, setNewIcon] = useState("◆");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [showQuantified, setShowQuantified] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState<string | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);

  const supabase = createClient();

  const checkFreeze = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setFreezeLoading(false);
      return;
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data } = await supabase
      .from("streak_freezes")
      .select("used_on")
      .eq("user_id", authUser.id)
      .eq("month", month)
      .single();
    setFreezeUsed(data?.used_on || null);
    setFreezeLoading(false);
  }, [supabase]);

  useEffect(() => {
    checkFreeze();
  }, [checkFreeze]);

  const handleFreeze = async () => {
    if (freezing) return;
    setFreezing(true);
    const res = await fetch("/api/streak/freeze", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setFreezeUsed(data.used_on);
    }
    setFreezing(false);
  };

  const handleAdd = async () => {
    if (!newHabit.trim()) return;
    const targetVal = showQuantified && newTarget ? parseFloat(newTarget) : null;
    const unitVal = showQuantified && newUnit ? newUnit.trim() : null;
    
    // We pass target and unit to addHabit. We need to update useHabits to support it.
    await addHabit(newHabit.trim(), newIcon || "◆", targetVal, unitVal);
    setNewHabit("");
    setNewIcon("◆");
    setNewTarget("");
    setNewUnit("");
    setShowQuantified(false);
  };

  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  const Skeleton = ({ className = "" }: { className?: string }) => <div className={`axis-skeleton ${className}`} />;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderHabits(active.id as string, over.id as string);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconHabits size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Today
          </span>
          <span className="text-sm font-bold">
            {completedToday}/{total}
          </span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconStreak size={14} className="text-orange-500" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Best Streak
          </span>
          <span className="text-sm font-bold text-orange-500">{bestStreak > 0 ? `${bestStreak} days` : "—"}</span>
        </div>
      </div>

      {/* Streak Freeze — Pro only */}
      <div className="axis-card bg-gradient-to-r from-[var(--bg-secondary)] to-axis-accent/5 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="mt-0.5"><IconFreeze size={18} className="text-blue-400" /></div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Streak Freeze
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-axis-accent text-axis-dark">
                PRO
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {freezeUsed
                ? `Used on ${freezeUsed} this month. Resets next month.`
                : "Protect your streak on an off day. 1 free pass per month."}
            </p>
          </div>
          {!freezeLoading &&
            (user?.plan === "pro" ? (
              freezeUsed ? (
                <span
                  className="text-xs font-mono px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                >
                  Used
                </span>
              ) : (
                <button
                  onClick={handleFreeze}
                  disabled={freezing || streak === 0}
                  className="text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {freezing ? "Freezing..." : "Use Freeze"}
                </button>
              )
            ) : (
              <Link
                href="/settings"
                className="text-xs font-semibold text-axis-dark bg-axis-accent px-4 py-2 rounded-xl hover:bg-axis-accent/90 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Unlock
              </Link>
            ))}
        </div>
      </div>

      {/* Habits */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<IconHabits size={24} className="text-axis-accent" />}
          title="No habits set up yet"
          description="Build your daily systems by adding a habit below."
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {habits.map((h) => (
                <SortableHabitItem key={h.id} habit={h} toggleHabit={toggleHabit} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add habit */}
      <div className="axis-card space-y-4 !border-dashed focus-within:border-axis-accent/50 focus-within:shadow-md transition-all">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="◆"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="w-12 h-12 rounded-xl text-center text-2xl outline-none"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
            maxLength={2}
          />
          <input
            type="text"
            placeholder="Add a new habit..."
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={() => setShowQuantified(!showQuantified)}
            className="text-[10px] font-mono px-3 py-2 rounded-lg transition-colors border"
            style={{ 
              backgroundColor: showQuantified ? "var(--bg-accent-soft)" : "transparent",
              color: showQuantified ? "var(--text-primary)" : "var(--text-tertiary)",
              borderColor: showQuantified ? "rgba(205,255,79,0.3)" : "var(--border-primary)"
            }}
          >
            {showQuantified ? "Quantified" : "+ Target"}
          </button>
          <button
            onClick={handleAdd}
            className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-95"
          >
            Add
          </button>
        </div>
        
        {showQuantified && (
          <div className="flex items-center gap-3 pl-14 animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="number"
              placeholder="Target (e.g. 5)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-32 text-xs rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              placeholder="Unit (e.g. km, Liters)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-48 text-xs rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
          </div>
        )}
      </div>

      <div
        className="rounded-xl p-4 text-center"
        style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {total}/3 habits ·{" "}
          <Link href="/settings" className="text-axis-accent hover:underline">
            Upgrade to Pro
          </Link>{" "}
          for unlimited
        </p>
      </div>
    </div>
  );
}
