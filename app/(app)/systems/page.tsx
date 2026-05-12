"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useHabits, HabitWithStatus } from "@/hooks/useHabits";
import { useObjectives } from "@/hooks/useObjectives";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { IconHabits, IconCheck, IconStreak } from "@/components/icons";
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
import { useLocale } from "@/lib/i18n/provider";

const WEEK_DAYS = {
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

// Per-habit accent palette (CSS variables defined in globals.css).
const HABIT_PALETTE = [
  "var(--soft-lav)",
  "var(--soft-plum)",
  "var(--soft-warm)",
  "var(--soft-green)",
  "var(--soft-coral)",
];

const COPY = {
  de: {
    today: "Heute",
    bestStreak: "Bester Streak",
    days: "Tage",
    done: "Erledigt",
    skipped: "Übersprungen",
    dayStreak: (n: number) => `${n}d Streak`,
    skipToday: "Heute skippen",
    freezeTitle: "Streak-Freeze",
    freezeUsed: (date: string) => `Am ${date} genutzt. Wird nächsten Monat zurückgesetzt.`,
    freezeBody: "1 Freipass pro Monat",
    used: "Genutzt",
    freezing: "Friert ein...",
    useFreeze: "Freeze nutzen",
    unlock: "Freischalten",
    emptyTitle: "Welche Routine willst du fix machen?",
    emptyBody: "Eine reicht zum Start. Workout, Lernblock, kein Handy nach 22 Uhr — du entscheidest.",
    icon: "Icon",
    addHabit: "Neues Habit hinzufügen...",
    quantified: "Messbar",
    target: "+ Ziel",
    add: "Hinzufügen",
    targetPlaceholder: "Ziel (z. B. 5)",
    unitPlaceholder: "Einheit (z. B. km)",
    noTheme: "Kein Thema",
    upgrade: "Upgrade auf Pro",
  },
  en: {
    today: "Today",
    bestStreak: "Best Streak",
    days: "days",
    done: "Done",
    skipped: "Skipped",
    dayStreak: (n: number) => `${n}d streak`,
    skipToday: "Skip Today",
    freezeTitle: "Streak Freeze",
    freezeUsed: (date: string) => `Used on ${date} this month. Resets next month.`,
    freezeBody: "1 free pass per month",
    used: "Used",
    freezing: "Freezing...",
    useFreeze: "Use Freeze",
    unlock: "Unlock",
    emptyTitle: "Which routine do you want to lock in?",
    emptyBody: "One is enough to start. Workout, study block, no phone after 10pm — your call.",
    icon: "Icon",
    addHabit: "Add a new habit...",
    quantified: "Quantified",
    target: "+ Target",
    add: "Add",
    targetPlaceholder: "Target (e.g. 5)",
    unitPlaceholder: "Unit (e.g. km)",
    noTheme: "No theme",
    upgrade: "Upgrade to Pro",
  },
};

function HabitCard({
  habit,
  color,
  toggleHabit,
  copy,
  weekDays,
}: {
  habit: HabitWithStatus;
  color: string;
  toggleHabit: (id: string, action?: "done" | "skip" | "undo", val?: number) => void;
  copy: typeof COPY.de;
  weekDays: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  const todayIdx = 6;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[15px] p-5 transition-colors ${isDragging ? "shadow-2xl scale-[1.01]" : ""}`}
      style={{
        ...style,
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      {/* Top row */}
      <div className="mb-4 flex items-center gap-3.5">
        {/* Drag handle (subtle) */}
        <button
          className="hidden sm:flex shrink-0 cursor-grab flex-col items-center justify-center gap-[3px] opacity-0 transition-opacity hover:opacity-50 active:cursor-grabbing"
          style={{ color: "var(--text-tertiary)" }}
          {...attributes}
          {...listeners}
        >
          <div className="h-1 w-1 rounded-full bg-current" />
          <div className="h-1 w-1 rounded-full bg-current" />
          <div className="h-1 w-1 rounded-full bg-current" />
        </button>

        {/* Color icon */}
        <button
          onClick={() => toggleHabit(habit.id, habit.todayDone || habit.todaySkipped ? "undo" : "done")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundColor: tint(12) }}
        >
          {habit.icon && habit.icon !== "IconHabits" ? (
            <span className="text-xl">{habit.icon}</span>
          ) : (
            <div
              className="h-[18px] w-[18px] rounded-[5px] transition-colors"
              style={{ backgroundColor: habit.todayDone ? color : tint(30) }}
            />
          )}
        </button>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate text-[15px] font-bold"
              style={{
                color: habit.todayDone || habit.todaySkipped ? "var(--text-tertiary)" : "var(--text-primary)",
                textDecoration: habit.todaySkipped ? "line-through" : "none",
              }}
            >
              {habit.name}
            </span>
            {habit.todayDone && (
              <span
                className="rounded font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                style={{ color: "var(--soft-green)", backgroundColor: "var(--soft-green-dim)" }}
              >
                {copy.done}
              </span>
            )}
            {habit.todaySkipped && (
              <span
                className="rounded font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                style={{ color: "var(--soft-warm)", backgroundColor: "var(--soft-warm-dim)" }}
              >
                {copy.skipped}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {habit.target_value && (
              <span className="font-mono">
                {habit.todayValue || 0}/{habit.target_value} {habit.unit || ""}
              </span>
            )}
            <span>{copy.dayStreak(habit.streak)}</span>
            {!(habit.todayDone || habit.todaySkipped) && !habit.target_value && (
              <button
                onClick={() => toggleHabit(habit.id, "skip")}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: "var(--text-secondary)" }}
              >
                {copy.skipToday}
              </button>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => toggleHabit(habit.id, habit.todayDone || habit.todaySkipped ? "undo" : "done")}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] transition-all"
          style={{
            backgroundColor: habit.todayDone
              ? "var(--soft-green)"
              : habit.todaySkipped
                ? "var(--soft-warm)"
                : "var(--bg-tertiary)",
            border: habit.todayDone || habit.todaySkipped ? "none" : "1px solid var(--border-primary)",
            color: habit.todayDone || habit.todaySkipped ? "var(--text-inverted)" : "var(--text-tertiary)",
          }}
        >
          {habit.todayDone ? (
            <IconCheck size={16} />
          ) : habit.todaySkipped ? (
            <span className="text-sm font-bold">/</span>
          ) : (
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--border-secondary)" }} />
          )}
        </button>
      </div>

      {/* Week heatmap */}
      <div className="flex gap-1">
        {habit.weekLog.map((status, i) => {
          const active = status === "done";
          const isToday = i === todayIdx;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="h-[22px] w-full rounded-[5px] transition-colors"
                style={{
                  backgroundColor: active ? tint(isToday ? 55 : 30) : "var(--bg-tertiary)",
                  border: isToday ? `1px solid ${tint(44)}` : "1px solid transparent",
                }}
              />
              <span
                className="font-mono text-[8px] font-semibold"
                style={{ color: isToday ? color : "var(--text-tertiary)" }}
              >
                {weekDays[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SystemsPage() {
  const { habits, loading, addHabit, toggleHabit, reorderHabits, completedToday, total } = useHabits();
  const { user } = useUser();
  const { locale } = useLocale();
  const copy = COPY[locale === "en" ? "en" : "de"];
  const weekDays = WEEK_DAYS[locale === "en" ? "en" : "de"];
  const { streak } = useStreak();
  const { objectives } = useObjectives();
  const [newHabit, setNewHabit] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newObjectiveId, setNewObjectiveId] = useState("");
  const [showQuantified, setShowQuantified] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState<string | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [quickAddRequested, setQuickAddRequested] = useState(false);
  const habitInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const checkFreeze = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
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
      .maybeSingle();
    setFreezeUsed(data?.used_on || null);
    setFreezeLoading(false);
  }, [supabase]);

  useEffect(() => { checkFreeze(); }, [checkFreeze]);

  useEffect(() => {
    setQuickAddRequested(new URLSearchParams(window.location.search).get("quickAdd") === "1");
  }, []);

  useEffect(() => {
    if (quickAddRequested) habitInputRef.current?.focus();
  }, [quickAddRequested]);

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

  const isFreeAtHabitLimit = Boolean(user) && user?.plan !== "pro" && total >= 3;

  const handleAdd = async () => {
    if (!newHabit.trim() || isFreeAtHabitLimit) return;
    const targetVal = showQuantified && newTarget ? parseFloat(newTarget) : null;
    const unitVal = showQuantified && newUnit ? newUnit.trim() : null;
    await addHabit(newHabit.trim(), newIcon || "IconHabits", targetVal, unitVal, newObjectiveId || null);
    setNewHabit("");
    setNewIcon("");
    setNewTarget("");
    setNewUnit("");
    setNewObjectiveId("");
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
    <div className="mx-auto w-full max-w-2xl">
      {/* Stats */}
      <div className="mb-7 flex flex-wrap gap-2.5">
        <div
          className="flex items-center gap-2 rounded-[10px] px-4 py-2.5"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{copy.today}</span>
          <span
            className="text-[15px] font-extrabold"
            style={{ color: total > 0 && completedToday === total ? "var(--soft-green)" : "var(--text-primary)" }}
          >
            {completedToday}/{total}
          </span>
        </div>
        <div
          className="flex items-center gap-2 rounded-[10px] px-4 py-2.5"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{copy.bestStreak}</span>
          <span className="flex items-center gap-1 text-[15px] font-extrabold" style={{ color: "var(--soft-warm)" }}>
            {bestStreak} {copy.days} <IconStreak size={11} />
          </span>
        </div>
      </div>

      {/* Streak Freeze */}
      <div
        className="mb-5 flex items-center justify-between rounded-[13px] px-5 py-3.5"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">❄️</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold">{copy.freezeTitle}</span>
              <span
                className="rounded font-mono text-[9px] font-bold tracking-wide px-1.5 py-0.5"
                style={{
                  color: "var(--accent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
                }}
              >
                PRO
              </span>
            </div>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {freezeUsed ? copy.freezeUsed(freezeUsed) : copy.freezeBody}
            </div>
          </div>
        </div>
        {!freezeLoading &&
          (user?.plan === "pro" ? (
            freezeUsed ? (
              <span
                className="rounded-lg px-3.5 py-1.5 text-[11px] font-bold font-mono"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
              >
                {copy.used}
              </span>
            ) : (
              <button
                onClick={handleFreeze}
                disabled={freezing || streak === 0}
                className="rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-opacity disabled:opacity-40"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
              >
                {freezing ? copy.freezing : copy.useFreeze}
              </button>
            )
          ) : (
            <Link
              href="/settings"
              className="rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-opacity"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              {copy.unlock}
            </Link>
          ))}
      </div>

      {/* Habits */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-[15px]" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<IconHabits size={24} style={{ color: "var(--accent)" }} />}
          title={copy.emptyTitle}
          description={copy.emptyBody}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {habits.map((h, i) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  color={HABIT_PALETTE[i % HABIT_PALETTE.length]}
                  toggleHabit={toggleHabit}
                  copy={copy}
                  weekDays={weekDays}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add habit */}
      <div
        className="mt-5 rounded-[13px] p-3"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px dashed var(--border-secondary)" }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <input
              type="text"
              placeholder={copy.icon}
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="h-10 w-10 shrink-0 rounded-[10px] text-center text-lg outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
              maxLength={2}
            />
            <input
              ref={habitInputRef}
              type="text"
              placeholder={copy.addHabit}
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none py-2"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuantified((s) => !s)}
              className="rounded-md px-2.5 py-2 sm:py-1.5 text-[11px] sm:text-[10px] font-mono transition-colors"
              style={{
                backgroundColor: showQuantified ? "var(--bg-tertiary)" : "transparent",
                color: showQuantified ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {showQuantified ? copy.quantified : copy.target}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newHabit.trim() || isFreeAtHabitLimit}
              className="ml-auto rounded-[7px] px-4 py-2 sm:py-1.5 text-[11px] font-extrabold transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
            >
              {copy.add}
            </button>
          </div>
        </div>
        {showQuantified && (
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-12">
            <input
              type="number"
              placeholder={copy.targetPlaceholder}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full sm:w-32 rounded-md px-3 py-2.5 sm:py-2 text-xs outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              placeholder={copy.unitPlaceholder}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full sm:w-48 rounded-md px-3 py-2.5 sm:py-2 text-xs outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
            <select
              value={newObjectiveId}
              onChange={(e) => setNewObjectiveId(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[170px] rounded-md px-3 py-2.5 sm:py-2 text-xs font-mono outline-none"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
              }}
            >
              <option value="">{copy.noTheme}</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Limit */}
      <div className="mt-3 py-2.5 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        {total}/3 Habits
        {user?.plan !== "pro" && (
          <>
            {" · "}
            <Link href="/settings" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
              {copy.upgrade}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
