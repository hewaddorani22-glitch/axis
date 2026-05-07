"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useLocale } from "@/lib/i18n/provider";

const PEAK_KEY = "lomoura-streak-peak";
const DISMISS_KEY = "lomoura-restore-prompt-dismissed";
const MIN_PEAK = 7;

function readNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeFlag(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Streak Restore Prompt — appears for Pro users who have a localStorage peak
 * streak >= 7 and have not yet redeemed their one-time restore. The recovery
 * modal triggers BEFORE upgrade; this modal triggers AFTER upgrade.
 */
export function StreakRestorePromptModal() {
  const { user } = useUser();
  const { streak, refetch } = useStreak();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [peak, setPeak] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.plan !== "pro") return;
    if (readFlag(DISMISS_KEY)) return;

    const localPeak = readNumber(PEAK_KEY);
    if (localPeak < MIN_PEAK) return;
    if (streak >= localPeak) return; // already recovered organically

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/streak/restore", { method: "GET" });
        const data = await res.json();
        if (!cancelled && data?.eligible) {
          setPeak(localPeak);
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, streak]);

  const handleRestore = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/streak/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peak }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      writeFlag(DISMISS_KEY);
      setOpen(false);
      await refetch();
    } catch {
      /* keep modal open so user can retry */
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    writeFlag(DISMISS_KEY);
    setOpen(false);
  };

  if (!user || user.plan !== "pro") return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 bg-axis-accent/15 text-axis-accent rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-axis-accent animate-pulse" />
              {t("restore.badge")}
            </div>

            <h3 className="text-3xl font-bold tracking-tight mb-2 leading-tight">
              {t("restore.title", { n: String(peak) })}
            </h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              {t("restore.sub", { n: String(peak) })}
            </p>

            <button
              onClick={handleRestore}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-accent text-axis-text1 px-6 py-4 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {submitting ? t("restore.loading") : t("restore.cta", { n: String(peak) })}
            </button>
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="w-full mt-3 text-xs text-white/40 hover:text-white/70 transition-colors py-2 disabled:opacity-50"
            >
              {t("restore.skip")}
            </button>
            <p className="text-[11px] text-center text-white/30 mt-2 font-mono">{t("restore.fineprint")}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
