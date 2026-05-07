"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfettiBurst } from "@/components/app/confetti";
import { useLocale } from "@/lib/i18n/provider";

const STORAGE_KEY = "lomoura-welcome-shown";

const COPY = {
  de: {
    title: (name: string) => `Willkommen, ${name}.`,
    sub: "Dein System steht. Streak: 1. Lass uns die erste Mission heute erledigen — drei Tage in Folge und du bist nicht mehr aufzuhalten.",
    cta: "Lass uns loslegen",
    badge: "Tag 1 · Streak 1",
  },
  en: {
    title: (name: string) => `Welcome, ${name}.`,
    sub: "Your system is live. Streak: 1. Let's finish the first mission today — three days in a row and you're unstoppable.",
    cta: "Let's go",
    badge: "Day 1 · Streak 1",
  },
};

/**
 * Welcome ceremony shown once on first dashboard visit after onboarding.
 * Uses localStorage to ensure single-fire.
 */
export function WelcomeCeremony({ name }: { name: string }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [fireConfetti, setFireConfetti] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setOpen(true);
        // Stagger confetti slightly after modal appears
        window.setTimeout(() => setFireConfetti(true), 180);
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch {
      // storage blocked — silently skip
    }
  }, []);

  const copy = COPY[locale === "de" ? "de" : "en"];
  const displayName = name?.trim() || (locale === "de" ? "Champion" : "Champion");

  return (
    <>
      <ConfettiBurst fire={fireConfetti} count={48} durationMs={1800} />
      <AnimatePresence>
        {open && (
          <motion.div
            key="welcome-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-axis-text1/40 backdrop-blur-md p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-axis-bg p-8 text-center shadow-2xl border border-axis-border"
            >
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-axis-accent/30 px-3 py-1 text-[11px] font-mono font-medium text-axis-text1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-axis-accent2 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-axis-accent2" />
                </span>
                {copy.badge}
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-balance">
                {copy.title(displayName)}
              </h2>
              <p className="text-sm text-axis-text2 leading-relaxed mb-6">{copy.sub}</p>
              <button
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-text1 text-white px-6 py-3.5 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all shadow-lg shadow-axis-text1/15"
              >
                {copy.cta}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
