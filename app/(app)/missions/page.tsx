"use client";

import { useEffect, useRef, useState } from "react";
import { useMissions, Mission } from "@/hooks/useMissions";
import { useObjectives } from "@/hooks/useObjectives";
import { useUser } from "@/hooks/useUser";
import { IconTarget, IconTimer, IconFocus } from "@/components/icons";
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
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/lib/i18n/provider";

type Priority = "high" | "med" | "low";

const COPY = {
  de: {
    addMission: "Neue Mission hinzufügen...",
    advanced: "Erweitert",
    details: "+ Details",
    high: "Hoch",
    med: "Mittel",
    low: "Niedrig",
    add: "Hinzufügen",
    minutes: "Minuten (z. B. 45)",
    energy: "Energie:",
    noTheme: "Kein Thema",
    emptyTitle: "Was machst du heute?",
    emptyBody: "Tipp 1–3 Dinge ein, die heute zählen. Klein anfangen ist okay.",
    allDone: "Alles erledigt ✦",
    tasksOpen: (n: number) => `${n} Tasks offen`,
    percentToday: (p: number) => `${p}% abgeschlossen heute`,
    counter: (n: number) => `${n} Missionen heute`,
    upgrade: "Upgrade für mehr",
  },
  en: {
    addMission: "Add a new mission...",
    advanced: "Advanced",
    details: "+ Details",
    high: "High",
    med: "Med",
    low: "Low",
    add: "Add",
    minutes: "Est. minutes (e.g. 45)",
    energy: "Energy:",
    noTheme: "No theme",
    emptyTitle: "What are you doing today?",
    emptyBody: "Type 1–3 things that matter today. Starting small is fine.",
    allDone: "All done ✦",
    tasksOpen: (n: number) => `${n} tasks open`,
    percentToday: (p: number) => `${p}% complete today`,
    counter: (n: number) => `${n} missions today`,
    upgrade: "Upgrade for more",
  },
};

function SortableMissionItem({
  mission,
  toggleMission,
  isFocusable,
  priLabel,
}: {
  mission: Mission;
  toggleMission: (id: string) => void;
  isFocusable: boolean;
  priLabel: Record<Priority, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mission.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const priStyles: Record<Priority, { color: string; bg: string }> = {
    high: { color: "var(--soft-coral)", bg: "var(--soft-coral-dim)" },
    med: { color: "var(--soft-warm)", bg: "var(--soft-warm-dim)" },
    low: { color: "var(--text-tertiary)", bg: "var(--bg-tertiary)" },
  };
  const pri = priStyles[mission.priority];

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
        opacity: mission.status === "done" ? 0.5 : 1,
      }}
      className={`group flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors cursor-pointer ${
        isDragging ? "shadow-2xl scale-[1.01]" : ""
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-toggle]")) return;
        toggleMission(mission.id);
      }}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
      }}
    >
      {/* Drag handle (subtle, on hover) */}
      <button
        data-no-toggle
        className="flex shrink-0 cursor-grab flex-col items-center justify-center gap-[3px] opacity-0 transition-opacity group-hover:opacity-30 active:cursor-grabbing"
        style={{ color: "var(--text-tertiary)" }}
        {...attributes}
        {...listeners}
      >
        <div className="h-1 w-1 rounded-full bg-current" />
        <div className="h-1 w-1 rounded-full bg-current" />
        <div className="h-1 w-1 rounded-full bg-current" />
      </button>

      {/* Checkbox */}
      <div
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-all"
        style={{
          backgroundColor: mission.status === "done" ? "var(--soft-green)" : "transparent",
          borderColor: mission.status === "done" ? "var(--soft-green)" : "var(--border-secondary)",
        }}
      >
        <AnimatePresence>
          {mission.status === "done" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="text-xs font-extrabold"
              style={{ color: "var(--text-inverted)" }}
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Title */}
      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${mission.status === "done" ? "line-through" : ""}`}
        style={{ color: mission.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}
      >
        {mission.title}
      </span>

      {/* Meta */}
      <div className="flex shrink-0 items-center gap-2" data-no-toggle>
        {isFocusable && mission.estimated_time && mission.status !== "done" ? (
          <Link
            href={`/missions/focus/${mission.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
            title="Enter focus mode"
          >
            <IconFocus size={13} style={{ color: "var(--accent)" }} />
          </Link>
        ) : null}
        {mission.estimated_time && (
          <span
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            <IconTimer size={10} style={{ color: "var(--soft-warm)" }} />
            {mission.estimated_time}m
          </span>
        )}
        <span
          className="rounded-md px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider"
          style={{ color: pri.color, backgroundColor: pri.bg }}
        >
          {priLabel[mission.priority]}
        </span>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user } = useUser();
  const { locale } = useLocale();
  const copy = COPY[locale === "en" ? "en" : "de"];
  const [selectedDay, setSelectedDay] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("med");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newEnergy, setNewEnergy] = useState<"high" | "med" | "low">("med");
  const [newObjectiveId, setNewObjectiveId] = useState("");
  const [quickAddRequested, setQuickAddRequested] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDay);
  const dateStr = targetDate.toISOString().split("T")[0];
  const isTodayView = selectedDay === 0;

  const { missions, loading, addMission, toggleMission, reorderMissions, completedCount, completionRate, total } =
    useMissions(dateStr);
  const { objectives } = useObjectives();
  const isFreeAtMissionLimit = Boolean(user) && user?.plan !== "pro" && isTodayView && total >= 5;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderMissions(active.id as string, over.id as string);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || isFreeAtMissionLimit) return;
    const estimated_time = showAdvanced && newTime ? parseInt(newTime, 10) : undefined;
    const energy_level = showAdvanced ? newEnergy : undefined;
    await addMission(
      newTitle.trim(),
      newPriority,
      undefined,
      estimated_time,
      energy_level,
      newObjectiveId || undefined
    );
    setNewTitle("");
    setNewTime("");
    setNewObjectiveId("");
    setShowAdvanced(false);
  };

  useEffect(() => {
    setQuickAddRequested(new URLSearchParams(window.location.search).get("quickAdd") === "1");
  }, []);

  useEffect(() => {
    if (quickAddRequested) inputRef.current?.focus();
  }, [quickAddRequested]);

  // Calendar strip: 3 days back → today → 3 days forward
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });
  const todayIdx = 3;

  const priLabel: Record<Priority, string> = { high: copy.high, med: copy.med, low: copy.low };

  const arcColor =
    completionRate === 100 ? "var(--soft-green)" : completionRate > 0 ? "var(--soft-warm)" : "var(--text-tertiary)";
  const r = 23;
  const c = 2 * Math.PI * r;

  const Skeleton = ({ className = "" }: { className?: string }) => <div className={`axis-skeleton ${className}`} />;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress arc */}
      <div className="mb-7 flex items-center gap-5">
        <div className="relative h-14 w-14">
          <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="28" cy="28" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke={arcColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - completionRate / 100)}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold">
            {completedCount}/{total || 0}
          </div>
        </div>
        <div>
          <div className="text-base font-bold">
            {total > 0 && completedCount === total ? copy.allDone : copy.tasksOpen(Math.max(total - completedCount, 0))}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {copy.percentToday(completionRate)}
          </div>
        </div>
      </div>

      {/* Calendar strip */}
      <div className="mb-6 flex gap-1.5">
        {days.map((day, i) => {
          const isToday = i === todayIdx;
          const isSelected = i - todayIdx === selectedDay;
          const isPast = i < todayIdx;
          const dotColor =
            isToday && total > 0
              ? completedCount === total
                ? "var(--soft-green)"
                : completedCount > 0
                  ? "var(--soft-warm)"
                  : "var(--text-tertiary)"
              : null;
          const weekday = day.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { weekday: "short" });
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i - todayIdx)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all"
              style={{
                backgroundColor: isSelected ? "var(--bg-tertiary)" : "transparent",
                border: isToday
                  ? `1px solid color-mix(in srgb, var(--accent) 30%, transparent)`
                  : "1px solid transparent",
                opacity: isPast && !isSelected ? 0.7 : 1,
              }}
            >
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{ color: isToday ? "var(--accent)" : "var(--text-tertiary)" }}
              >
                {weekday}
              </span>
              <span
                className="text-lg leading-none"
                style={{
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {day.getDate()}
              </span>
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: dotColor ?? "transparent" }}
              />
            </button>
          );
        })}
      </div>

      {/* Add */}
      <div
        className="mb-4 rounded-[13px] p-3 transition-colors"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 shrink-0 rounded-md border-2"
            style={{ borderColor: "var(--border-secondary)" }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={copy.addMission}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="rounded-md px-2.5 py-1.5 text-[10px] font-mono transition-colors"
            style={{
              backgroundColor: showAdvanced ? "var(--bg-tertiary)" : "transparent",
              color: showAdvanced ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {showAdvanced ? copy.advanced : copy.details}
          </button>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="rounded-md px-2 py-1.5 text-[11px] font-mono outline-none"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="high">{copy.high}</option>
            <option value="med">{copy.med}</option>
            <option value="low">{copy.low}</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || isFreeAtMissionLimit}
            className="rounded-[7px] px-3.5 py-1.5 text-[11px] font-extrabold transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
            }}
          >
            {copy.add}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
            <input
              type="number"
              placeholder={copy.minutes}
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-40 rounded-md px-3 py-2 text-xs outline-none"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
            <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              {copy.energy}
            </span>
            <select
              value={newEnergy}
              onChange={(e) => setNewEnergy(e.target.value as "high" | "med" | "low")}
              className="rounded-md px-3 py-2 text-xs font-mono outline-none"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
              }}
            >
              <option value="high">{copy.high}</option>
              <option value="med">{copy.med}</option>
              <option value="low">{copy.low}</option>
            </select>
            <select
              value={newObjectiveId}
              onChange={(e) => setNewObjectiveId(e.target.value)}
              className="min-w-[170px] rounded-md px-3 py-2 text-xs font-mono outline-none"
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

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-xl" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <EmptyState
          icon={<IconTarget size={22} style={{ color: "var(--accent)" }} />}
          title={copy.emptyTitle}
          description={copy.emptyBody}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={missions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {missions.map((m) => (
                <SortableMissionItem
                  key={m.id}
                  mission={m}
                  toggleMission={toggleMission}
                  isFocusable={isTodayView}
                  priLabel={priLabel}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Limit */}
      <div className="mt-3 py-2.5 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        {copy.counter(total)}
        {user?.plan !== "pro" && isTodayView && (
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
