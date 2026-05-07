"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfettiBurst } from "@/components/app/confetti";
import { useLocale } from "@/lib/i18n/provider";

const TOAST_COPY_DE = [
  "Bam. Eine durch.",
  "Schon wieder eine. Maschinenmodus.",
  "Ein Stein vom Weg. Weiter.",
  "Genau so. Streak baut sich auf.",
  "Du, in Aktion. Ich seh's.",
];

const TOAST_COPY_EN = [
  "Boom. One down.",
  "Another one. Machine mode.",
  "One stone off the path. Keep going.",
  "Exactly that. Streak is building.",
  "You, in motion. I see it.",
];

const COOLDOWN_MS = 600;

/**
 * Listens to `lomoura:mission-completed` window events and fires a confetti
 * burst + toast. Mount once near the app shell.
 */
export function Celebrations() {
  const { locale } = useLocale();
  const [fire, setFire] = useState(0);
  const [lastAt, setLastAt] = useState(0);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - lastAt < COOLDOWN_MS) return;
      setLastAt(now);
      setFire((n) => n + 1);
      const pool = locale === "de" ? TOAST_COPY_DE : TOAST_COPY_EN;
      const message = pool[Math.floor(Math.random() * pool.length)];
      toast.success(message, { duration: 1800 });
    };
    window.addEventListener("lomoura:mission-completed", handler as EventListener);
    return () => window.removeEventListener("lomoura:mission-completed", handler as EventListener);
  }, [lastAt, locale]);

  return <ConfettiBurst key={fire} fire={fire > 0} count={28} durationMs={1200} />;
}
