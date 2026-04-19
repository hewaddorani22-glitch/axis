"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconCheck, IconChevronLeft, IconFocus, IconTarget, IconTimer } from "@/components/icons";

type FocusMission = {
  id: string;
  title: string;
  status: "active" | "done";
  priority: "high" | "med" | "low";
  estimated_time: number | null;
  energy_level: "high" | "med" | "low" | null;
};

const burstParticles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 18) * Math.PI * 2) * (120 + (index % 3) * 24),
  y: Math.sin((index / 18) * Math.PI * 2) * (120 + (index % 4) * 18),
  delay: index * 0.02,
}));

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function MissionFocusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const gradientId = useId();
  const [mission, setMission] = useState<FocusMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchMission() {
      const { data, error } = await supabase
        .from("missions")
        .select("id, title, status, priority, estimated_time, energy_level")
        .eq("id", params.id)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        setMission(null);
        setLoading(false);
        return;
      }

      const nextMission = data as FocusMission;
      setMission(nextMission);
      setSecondsLeft((nextMission.estimated_time || 25) * 60);
      setIsRunning(nextMission.status !== "done");
      setLoading(false);
    }

    fetchMission();

    return () => {
      isMounted = false;
    };
  }, [params.id, supabase]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false);
    }
  }, [secondsLeft]);

  const totalSeconds = (mission?.estimated_time || 25) * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  const handleReset = () => {
    setSecondsLeft(totalSeconds);
    setIsRunning(false);
  };

  const handleComplete = async () => {
    if (!mission) return;

    await supabase.from("missions").update({ status: "done" }).eq("id", mission.id);

    setMission({ ...mission, status: "done" });
    setIsRunning(false);
    setShowBurst(true);

    window.setTimeout(() => {
      router.push("/missions");
    }, 1400);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="axis-card w-full max-w-3xl py-20 text-center">
          <div className="axis-skeleton mx-auto mb-5 h-16 w-16 rounded-full" />
          <div className="axis-skeleton mx-auto mb-3 h-8 w-52 rounded-xl" />
          <div className="axis-skeleton mx-auto h-4 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="axis-card w-full max-w-xl py-16 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <IconTarget size={24} className="text-axis-accent" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-semibold">Mission unavailable</h1>
          <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            This focus session could not load. Return to Tasks and pick another mission.
          </p>
          <Link href="/missions" className="inline-flex rounded-xl bg-axis-accent px-4 py-2 text-sm font-semibold text-axis-dark">
            Back to Missions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
      style={{
        background:
          "radial-gradient(circle at top, rgba(205,255,79,0.14), transparent 30%), radial-gradient(circle at bottom, rgba(59,130,246,0.12), transparent 28%), var(--bg-primary)",
      }}
    >
      <AnimatePresence>
        {showBurst
          ? burstParticles.map((particle) => (
              <motion.span
                key={particle.id}
                initial={{ opacity: 0.95, scale: 0.4, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.1, x: particle.x, y: particle.y }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: particle.delay, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-axis-accent"
              />
            ))
          : null}
      </AnimatePresence>

      <div className="absolute left-6 top-6 flex items-center gap-3">
        <Link
          href="/missions"
          className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <IconChevronLeft size={14} />
          <span>Exit focus</span>
        </Link>
      </div>

      <div className="w-full max-w-4xl">
        <div
          className="relative overflow-hidden rounded-[32px] px-6 py-8 md:px-10 md:py-10"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                  <IconFocus size={18} className="text-axis-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                    Focus Mode
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    One mission. No feed. No list churn.
                  </p>
                </div>
              </div>

              <h1 className="text-3xl font-semibold md:text-4xl">{mission.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-mono uppercase"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  Priority {mission.priority}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-mono uppercase"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  {mission.estimated_time || 25} min block
                </span>
                {mission.energy_level ? (
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-mono uppercase"
                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                  >
                    {mission.energy_level} energy
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                  Status
                </p>
                <p className="text-lg font-semibold">{mission.status === "done" ? "Mission cleared" : "In execution"}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                  Timer
                </p>
                <p className="text-lg font-semibold">{formatCountdown(secondsLeft)}</p>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative flex items-center justify-center">
              <svg className="h-[320px] w-[320px] -rotate-90" viewBox="0 0 280 280">
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke={`url(#${gradientId})`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                  initial={false}
                  animate={{ strokeDashoffset: strokeOffset }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                />
                <defs>
                  <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#CDFF4F" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                  <IconTimer size={22} className="text-axis-accent" />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: "var(--text-tertiary)" }}>
                  Countdown
                </p>
                <p className="mt-2 text-6xl font-semibold tracking-tight">{formatCountdown(secondsLeft)}</p>
                <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {secondsLeft === 0 ? "Time block completed. Close it out." : `${Math.round(progress * 100)}% of the block used`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                  Controls
                </p>
                <div className="grid gap-3">
                  <button
                    onClick={() => setIsRunning((current) => !current)}
                    disabled={mission.status === "done"}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
                  >
                    {isRunning ? "Pause timer" : secondsLeft === totalSeconds ? "Start focus session" : "Resume timer"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
                    style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
                  >
                    Reset block
                  </button>
                  <button
                    onClick={handleComplete}
                    className="rounded-2xl bg-axis-accent px-4 py-3 text-sm font-semibold text-axis-dark transition-all hover:bg-axis-accent/90"
                  >
                    {mission.status === "done" ? "Mission complete" : "Mark mission done"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
                  Protocol
                </p>
                <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <li>Work the mission until the timer hits zero or the mission is complete.</li>
                  <li>Pause only for real interruptions, not task switching.</li>
                  <li>Complete the mission here to push progress back into AXIS immediately.</li>
                </ul>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showBurst ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl px-4 py-3 md:inset-x-auto md:right-6 md:w-[320px]"
                style={{ backgroundColor: "rgba(205,255,79,0.12)", border: "1px solid rgba(205,255,79,0.28)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-axis-accent text-axis-dark">
                    <IconCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-axis-accent">Mission cleared</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Returning to Tasks with the session logged.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
