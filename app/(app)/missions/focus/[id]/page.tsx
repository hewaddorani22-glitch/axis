"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Mission } from "@/hooks/useMissions";
import { IconCheck, IconChevronLeft, IconTimer } from "@/components/icons";

// ── Particle ──────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const COLORS = ["#CDFF4F", "#76A300", "#ffffff", "#a8e063", "#f0ff8a"];

function useParticles(active: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const nextId = useRef(0);

  const spawn = useCallback(() => {
    const count = 60;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const burst: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      return {
        id: nextId.current++,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 8,
        opacity: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });
    setParticles(burst);
  }, []);

  useEffect(() => {
    if (!active) return;
    spawn();
  }, [active, spawn]);

  useEffect(() => {
    if (particles.length === 0) return;

    const tick = () => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.25,
            opacity: p.opacity - 0.015,
          }))
          .filter((p) => p.opacity > 0);
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [particles.length > 0]);

  return particles;
}

// ── Radial Timer ──────────────────────────────────────────────────────────────

function RadialTimer({
  elapsed,
  total,
  paused,
}: {
  elapsed: number;
  total: number;
  paused: boolean;
}) {
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(elapsed / total, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  const remaining = Math.max(total - elapsed, 0);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={280} height={280} className="-rotate-90">
        <circle
          cx={140}
          cy={140}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        <motion.circle
          cx={140}
          cy={140}
          r={radius}
          fill="none"
          stroke="#CDFF4F"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transition={{ duration: 0.5, ease: "linear" }}
          style={{ filter: "drop-shadow(0 0 12px rgba(205,255,79,0.6))" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={remaining}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-5xl font-bold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </motion.span>
        <span
          className="text-xs font-mono mt-1 tracking-widest uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          {paused ? "paused" : "remaining"}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalSecs = (mission?.estimated_time ?? 0) * 60;
  const particles = useParticles(completed);

  // Fetch mission
  useEffect(() => {
    supabase
      .from("missions")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setMission(data as Mission);
        setLoading(false);
      });
  }, [id]);

  // Countdown tick
  useEffect(() => {
    if (paused || completed || totalSecs === 0) return;
    const interval = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSecs) {
          clearInterval(interval);
          return totalSecs;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, completed, totalSecs]);

  const handleComplete = async () => {
    if (!mission) return;
    setCompleted(true);
    await supabase.from("missions").update({ status: "done" }).eq("id", id);
  };

  const handleExit = () => router.push("/missions");

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="axis-skeleton w-32 h-8 rounded-xl" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Mission not found.
        </p>
        <button
          onClick={handleExit}
          className="text-xs font-mono text-axis-accent hover:underline"
        >
          ← Back to Missions
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Particle canvas */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={handleExit}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-mono transition-opacity opacity-40 hover:opacity-100"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconChevronLeft size={14} /> Exit Focus
      </button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative z-20 flex flex-col items-center gap-8 px-6 text-center max-w-lg"
      >
        {/* Label */}
        <div className="flex items-center gap-2">
          <IconTimer size={14} className="text-axis-accent" />
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            Focus Terminal
          </span>
        </div>

        {/* Mission title */}
        <h1
          className="text-2xl font-bold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {mission.title}
        </h1>

        {/* Timer or no-time state */}
        {totalSecs > 0 ? (
          <RadialTimer
            elapsed={elapsed}
            total={totalSecs}
            paused={paused}
          />
        ) : (
          <div
            className="w-56 h-56 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: "rgba(205,255,79,0.2)" }}
          >
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-tertiary)" }}
            >
              No timer set
            </span>
          </div>
        )}

        {/* Controls */}
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              {totalSecs > 0 && (
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {paused ? "Resume" : "Pause"}
                </button>
              )}
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold bg-axis-accent text-axis-dark transition-all hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 0 24px rgba(205,255,79,0.4)" }}
              >
                <IconCheck size={16} /> Mark Complete
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(205,255,79,0.15)",
                  border: "2px solid rgba(205,255,79,0.4)",
                  boxShadow: "0 0 40px rgba(205,255,79,0.3)",
                }}
              >
                <IconCheck size={32} className="text-axis-accent" />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Mission Complete
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {mission.estimated_time
                  ? `Focused for ${mission.estimated_time} min`
                  : "Great work."}
              </p>
              <button
                onClick={handleExit}
                className="mt-2 text-xs font-mono text-axis-accent hover:underline"
              >
                ← Back to Missions
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Priority badge */}
        {!completed && (
          <span
            className={`text-[10px] font-mono px-3 py-1 rounded-lg ${
              mission.priority === "high"
                ? "bg-red-500/10 text-red-500"
                : mission.priority === "med"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            {mission.priority} priority
          </span>
        )}
      </motion.div>
    </div>
  );
}
