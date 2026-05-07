"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useLocale } from "@/lib/i18n/provider";

const PEAK_KEY = "lomoura-streak-peak";
const DISMISS_KEY = "lomoura-recover-dismissed-until";
const SHOWN_FOR_KEY = "lomoura-recover-shown-for";
const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_DAYS = 14;
const MIN_LOST_STREAK = 7;

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

function writeNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

/**
 * Streak Recovery Modal — the single highest-leverage Pro upsell.
 *
 * Flow:
 *  1. Track the user's all-time peak streak in localStorage.
 *  2. When the *current* streak drops to 0 and the peak was >= 7,
 *     trigger this modal once per peak-event.
 *  3. After dismissal we hold off for 14 days OR until peak grows
 *     past the previous one (which means a new streak chapter started).
 */
export function StreakRecoveryModal() {
  const { user } = useUser();
  const { streak, loading } = useStreak();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [lostStreak, setLostStreak] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.plan === "pro") return;

    const peak = readNumber(PEAK_KEY);

    // Update peak if we beat it
    if (streak > peak) {
      writeNumber(PEAK_KEY, streak);
      return;
    }

    // Trigger criteria: current is 0, peak was >= MIN_LOST_STREAK
    if (streak !== 0 || peak < MIN_LOST_STREAK) return;

    // Already shown for this peak?
    const shownFor = readNumber(SHOWN_FOR_KEY);
    if (shownFor === peak) return;

    // Inside cooldown after a recent dismiss?
    const dismissedUntil = readNumber(DISMISS_KEY);
    if (Date.now() < dismissedUntil) return;

    setLostStreak(peak);
    setOpen(true);
    writeNumber(SHOWN_FOR_KEY, peak);
  }, [streak, loading, user]);

  const handleDismiss = () => {
    writeNumber(DISMISS_KEY, Date.now() + COOLDOWN_DAYS * DAY_MS);
    // Reset peak so user gets a clean slate
    writeNumber(PEAK_KEY, 0);
    setOpen(false);
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* ignore */
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!user || user.plan === "pro") return null;

  const titleText = lostStreak > 0
    ? t("recover.title", { n: String(lostStreak) })
    : t("recover.title.short");
  const subText = lostStreak > 0
    ? t("recover.sub", { n: String(lostStreak) })
    : t("recover.sub.fallback");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 bg-red-500/15 text-red-300 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {t("recover.badge")}
              </span>
              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-3xl font-bold tracking-tight mb-2 leading-tight">{titleText}</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">{subText}</p>

            <ul className="space-y-2.5 mb-6">
              {[
                t("recover.bullet.restore"),
                t("recover.bullet.freeze"),
                t("recover.bullet.history"),
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/85">
                  <svg className="w-4 h-4 text-axis-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-accent text-axis-text1 px-6 py-4 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {checkoutLoading ? t("upgrade.loading") : t("recover.cta")}
            </button>
            <p className="text-[11px] text-center text-white/35 mt-3 font-mono">{t("recover.fineprint")}</p>
            <button
              onClick={handleDismiss}
              className="w-full mt-3 text-xs text-white/40 hover:text-white/70 transition-colors py-2"
            >
              {t("recover.dismiss")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
