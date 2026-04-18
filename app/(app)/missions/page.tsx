"use client";

import { useState } from "react";
import { useMissions, Mission } from "@/hooks/useMissions";
import { IconTarget, IconCheck, IconPlus } from "@/components/icons";
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

type Priority = "high" | "med" | "low";

// Extracted SortableItem Component
function SortableMissionItem({
  mission,
  toggleMission,
}: {
  mission: Mission;
  toggleMission: (id: string) => void;
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
      className={`group axis-card flex items-center gap-3 !p-3 ${isDragging ? "shadow-2xl scale-[1.02] border-axis-accent/50" : ""}`}
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
          mission.status === "done" ? "bg-axis-accent border-axis-accent axis-check" : "hover:border-axis-accent/50"
        }`}
        style={mission.status !== "done" ? { borderColor: "var(--border-secondary)" } : undefined}
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
              <IconCheck size={14} className="text-axis-dark" />
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {mission.estimated_time && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            ⏳ {mission.estimated_time}m
          </span>
        )}
        {mission.energy_level && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            ⚡ {mission.energy_level}
          </span>
        )}
        <span
          className={`text-[10px] font-mono px-2.5 py-1 rounded-lg ${
            mission.priority === "high"
              ? "bg-red-500/10 text-red-500"
              : mission.priority === "med"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-gray-500/10 text-gray-400"
          }`}
        >
          {mission.priority}
        </span>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("med");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newEnergy, setNewEnergy] = useState<"high" | "med" | "low">("med");

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDay);
  const dateStr = targetDate.toISOString().split("T")[0];

  const { missions, loading, addMission, toggleMission, reorderMissions, completedCount, completionRate, total } =
    useMissions(dateStr);

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
    const estimated_time = showAdvanced && newTime ? parseInt(newTime, 10) : undefined;
    const energy_level = showAdvanced ? newEnergy : undefined;
    
    await addMission(newTitle.trim(), newPriority, undefined, estimated_time, energy_level);
    setNewTitle("");
    setNewTime("");
    setShowAdvanced(false);
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const Skeleton = ({ className = "" }: { className?: string }) => <div className={`axis-skeleton ${className}`} />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconTarget size={14} className="text-axis-accent" />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Completion
          </span>
          <span className="text-sm font-bold text-axis-accent">{completionRate}%</span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <IconCheck size={14} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Done
          </span>
          <span className="text-sm font-bold">
            {completedCount}/{total}
          </span>
        </div>
        <div className="axis-card !p-2.5 !px-4 flex items-center gap-2">
          <span className="text-xs">⏱️</span>
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Est. Time
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
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-md border-2 border-dashed flex-shrink-0"
            style={{ borderColor: "var(--border-secondary)" }}
          />
          <input
            type="text"
            placeholder="Add a new mission..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-mono px-3 py-2 rounded-lg transition-colors border"
            style={{ 
              backgroundColor: showAdvanced ? "var(--bg-accent-soft)" : "transparent",
              color: showAdvanced ? "var(--text-primary)" : "var(--text-tertiary)",
              borderColor: showAdvanced ? "rgba(205,255,79,0.3)" : "var(--border-primary)"
            }}
          >
            {showAdvanced ? "Advanced" : "+ Details"}
          </button>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="text-xs font-mono rounded-lg px-2 py-2 outline-none"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
          >
            <option value="high">High</option>
            <option value="med">Med</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-axis-accent text-axis-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all active:scale-[0.98]"
          >
            Add
          </button>
        </div>
        
        {showAdvanced && (
          <div className="flex items-center gap-3 pl-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="number"
              placeholder="Est. Minutes (e.g. 45)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-40 text-xs rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Energy:</span>
              <select
                value={newEnergy}
                onChange={(e) => setNewEnergy(e.target.value as "high" | "med" | "low")}
                className="text-xs font-mono rounded-lg px-3 py-2 outline-none"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
              >
                <option value="high">High ⚡</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
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
          title="No missions for this day"
          description="Type in the input above to set your daily priorities."
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={missions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {missions.map((m) => (
                <SortableMissionItem key={m.id} mission={m} toggleMission={toggleMission} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div
        className="rounded-xl p-4 text-center"
        style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {total}/5 missions today ·{" "}
          <Link href="/settings" className="text-axis-accent hover:underline">
            Upgrade to Pro
          </Link>{" "}
          for unlimited
        </p>
      </div>
    </div>
  );
}
