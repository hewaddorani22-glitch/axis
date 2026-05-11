"use client";

import { useEffect, useRef, useState } from "react";
import { useMissions, Mission } from "@/hooks/useMissions";
import { useObjectives } from "@/hooks/useObjectives";
import { useUser } from "@/hooks/useUser";
import { IconTarget, IconCheck, IconTimer, IconEnergy, IconFocus } from "@/components/icons";
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
    completion: "Erledigt",
    done: "Erledigt",
    estTime: "Zeit",
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
    emptyBody: "Tipp 1-3 Dinge ein, die heute zählen. Klein anfangen ist okay.",
    limit: "Free: 5 Missionen pro Tag. Pro schaltet unbegrenzt viele Missionen frei.",
    counter: (n: number) => `${n}/5 Missionen heute`,
    upgrade: "Upgrade auf Pro",
  },
  en: {
    completion: "Completion",
    done: "Done",
    estTime: "Est. Time",
    addMission: "Add a new mission...",
    advanced: "Advanced",
    details: "+ Details",
    high: "High",
    med: "Med",
    low: "Low",
    add: "Add",
    minutes: "Est. Minutes (e.g. 45)",
    energy: "Energy:",
    noTheme: "No theme",
    emptyTitle: "What are you doing today?",
    emptyBody: "Type 1-3 things that matter today. Use the input above. Starting small is fine.",
    limit: "Free: 5 daily missions. Pro unlocks unlimited missions.",
    counter: (n: number) => `${n}/5 missions today`,
    upgrade: "Upgrade to Pro",
  },
};

// Extracted SortableItem Component
function SortableMissionItem({
  mission,
  toggleMission,
  isFocusable,
}: {
  mission: Mission;
  toggleMission: (id: string) => void;
  isFocusable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mission.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group axis-card flex flex-wrap items-center gap-3 !p-3 ${isDragging ? "shadow-2xl scale-[1.02] border-axis-accent/50" : ""}`}
    >
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
        onClick={() => toggleMission(mission.id)}
        className={`w-6 h-6 rounded-lg border-2 flex flex-shrink-0 items-center justify-center transition-all relative ${
          mission.status === "done" ? "axis-check" : ""
        }`}
        style={{
          backgroundColor: mission.status === "done" ? "var(--soft-green)" : "transparent",
          borderColor: mission.status === "done" ? "var(--soft-green)" : "var(--border-secondary)",
        }}
      >
        <AnimatePresence>
          {mission.status === "done" && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <IconCheck size={14} style={{ color: "var(--text-inverted)" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${mission.status === "done" ? "line-through opacity-50" : ""}`}
          style={{ color: mission.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}
        >
          {mission.title}
        </p>
      </div>
      <div className="ml-11 flex w-full flex-wrap items-center gap-2 sm:ml-0 sm:w-auto sm:flex-shrink-0">
        {isFocusable && mission.estimated_time ? (
          <Link
            href={`/missions/focus/${mission.id}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--bg-accent-soft)", color: "var(--text-primary)" }}
            title="Enter focus mode"
          >
            <IconFocus size={14} className="text-axis-accent" />
          </Link>
        ) : null}
        {mission.estimated_time && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <IconTimer size={10} className="text-axis-accent" /> {mission.estimated_time}m
          </span>
        )}
        {mission.energy_level && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <IconEnergy size={10} style={{ color: "var(--soft-warm)" }} /> {mission.energy_level}
          </span>
        )}
        <span
          className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
          style={{
            color:
              mission.priority === "high"
                ? "var(--soft-coral)"
                : mission.priority === "med"
                  ? "var(--soft-warm)"
                  : "var(--text-tertiary)",
            backgroundColor:
              mission.priority === "high"
                ? "var(--soft-coral-dim)"
                : mission.priority === "med"
                  ? "var(--soft-warm-dim)"
                  : "var(--bg-tertiary)",
          }}
        >
          {mission.priority}
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
    if (!newTitle.trim()) return;
    if (isFreeAtMissionLimit) return;
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
    if (!quickAddRequested) return;
    inputRef.current?.focus();
  }, [quickAddRequested]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const Skeleton = ({ className = "" }: { className?: string }) => <div className={`axis-skeleton ${className}`} />;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconTarget size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            {copy.completion}
          </span>
          <span className="text-sm font-bold text-axis-accent">{completionRate}%</span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconCheck size={14} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            {copy.done}
          </span>
          <span className="text-sm font-bold">
            {completedCount}/{total}
          </span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconTimer size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            {copy.estTime}
          </span>
          <span className="text-sm font-bold">
            {missions.reduce((sum, m) => sum + (m.estimated_time || 0), 0)}m
          </span>
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
              style={
                !isSelected
                  ? { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)" }
                  : undefined
              }
            >
              <span className="text-[10px] font-mono uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="text-lg font-bold">{day.getDate()}</span>
              {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-axis-accent mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Add mission */}
      <div className="axis-card space-y-4 focus-within:border-axis-accent/50 focus-within:shadow-md transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="w-5 h-5 rounded-md border-2 border-dashed flex-shrink-0"
              style={{ borderColor: "var(--border-secondary)" }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={copy.addMission}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 sm:flex sm:w-auto sm:items-center">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] font-mono px-3 py-2 rounded-lg transition-colors border"
              style={{ 
                backgroundColor: showAdvanced ? "var(--bg-accent-soft)" : "transparent",
                color: showAdvanced ? "var(--text-primary)" : "var(--text-tertiary)",
                borderColor: showAdvanced ? "rgba(205,255,79,0.3)" : "var(--border-primary)"
              }}
            >
              {showAdvanced ? copy.advanced : copy.details}
            </button>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
              className="text-xs font-mono rounded-lg px-2 py-2 outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            >
              <option value="high">{copy.high}</option>
              <option value="med">{copy.med}</option>
              <option value="low">{copy.low}</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={isFreeAtMissionLimit || !newTitle.trim()}
              className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all active:scale-[0.98]"
            >
              {copy.add}
            </button>
          </div>
        </div>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300 sm:flex sm:flex-wrap sm:items-center sm:pl-8">
            <input
              type="number"
              placeholder={copy.minutes}
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-2 outline-none sm:w-40"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>{copy.energy}</span>
              <select
                value={newEnergy}
                onChange={(e) => setNewEnergy(e.target.value as "high" | "med" | "low")}
                className="text-xs font-mono rounded-lg px-3 py-2 outline-none"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
              >
                <option value="high">{copy.high}</option>
                <option value="med">{copy.med}</option>
                <option value="low">{copy.low}</option>
              </select>
            </div>
            <select
              value={newObjectiveId}
              onChange={(e) => setNewObjectiveId(e.target.value)}
              className="w-full text-xs font-mono rounded-lg px-3 py-2 outline-none sm:min-w-[170px] sm:w-auto"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
            >
              <option value="">{copy.noTheme}</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Missions */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <EmptyState
          icon={<IconTarget size={24} className="text-axis-accent" />}
          title={copy.emptyTitle}
          description={copy.emptyBody}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={missions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {missions.map((m) => (
                <SortableMissionItem
                  key={m.id}
                  mission={m}
                  toggleMission={toggleMission}
                  isFocusable={isTodayView}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isFreeAtMissionLimit && (
        <div className="rounded-xl border border-axis-accent/25 bg-axis-accent/5 px-4 py-3">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {copy.limit}{" "}
            <Link href="/settings" className="font-semibold text-axis-accent hover:underline">
              {copy.upgrade}
            </Link>
          </p>
        </div>
      )}

      <div
        className="rounded-xl p-4 text-center"
        style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {copy.counter(total)} /{" "}
          <Link href="/settings" className="text-axis-accent hover:underline">
            {copy.upgrade}
          </Link>{" "}
        </p>
      </div>
    </div>
  );
}
