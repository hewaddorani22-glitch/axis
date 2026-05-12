"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  color: string;
  shape: "square" | "circle";
};

const COLORS = [
  "#C9A35E", // forge-gold
  "#D9B373", // gold lighter
  "#8A8A82", // forge-ash
  "#F0EFE8", // forge-bone
];

function createBurst(count: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 90 + Math.random() * 220;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 80, // slight upward bias
      rotate: Math.random() * 720 - 360,
      scale: 0.6 + Math.random() * 0.8,
      color: COLORS[i % COLORS.length],
      shape: Math.random() > 0.5 ? "square" : "circle",
    };
  });
}

/**
 * Lightweight confetti burst at a center point.
 * Renders fixed-position absolute, pointer-events none.
 */
export function ConfettiBurst({
  fire,
  count = 36,
  durationMs = 1400,
  onDone,
}: {
  fire: boolean;
  count?: number;
  durationMs?: number;
  onDone?: () => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!fire) return;
    setParticles(createBurst(count));
    const timer = window.setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [fire, count, durationMs, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              rotate: p.rotate,
              scale: p.scale,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationMs / 1000, ease: [0.2, 0.6, 0.3, 1] }}
            className={p.shape === "square" ? "absolute h-2.5 w-2.5" : "absolute h-2.5 w-2.5 rounded-full"}
            style={{ backgroundColor: p.color }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
