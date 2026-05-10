"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useLocale } from "@/lib/i18n/provider";
import { useMissions } from "@/hooks/useMissions";

const DISMISS_KEY = "lomoura-push-prompt-dismissed-until";
const DAY_MS = 24 * 60 * 60 * 1000;
// Re-prompt every 7 days after a dismiss. The audit shows 2% subscription
// rate today; halving the silence between asks gets us back in front of
// users while their value perception of the app is highest.
const REDISMISS_DAYS = 7;

function dismissedUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function snoozeFor(days: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * DAY_MS));
  } catch {
    /* ignore */
  }
}

/**
 * Push subscribe prompt — appears the first time a user has at least one
 * completed mission. We wait for that signal because permission acceptance
 * rates are far higher after the user has experienced one Aha-tap than at
 * cold load. Re-prompts every 14 days if dismissed.
 */
export function PushSubscribePrompt({ vapidPublicKey }: { vapidPublicKey: string }) {
  const { user } = useUser();
  const { t } = useLocale();
  const { status, subscribe, busy } = usePushSubscription();
  const { completedCount } = useMissions();
  const [open, setOpen] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    if (!user || !vapidPublicKey) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/push/subscribe", { method: "GET" });
        const data = await res.json();
        if (!cancelled) {
          setBackendReady(Boolean(data?.ready));
        }
      } catch {
        if (!cancelled) {
          setBackendReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, vapidPublicKey]);

  useEffect(() => {
    if (!user) return;
    if (!vapidPublicKey) return;
    if (!backendReady) return;
    if (status !== "default") return; // unsupported / denied / already subscribed
    if (completedCount < 1) return; // wait for first aha-moment
    if (Date.now() < dismissedUntil()) return;
    // 4s gives the post-first-mission HabitPickModal room to land first; the
    // user picks a habit, the modal closes, then the push ask appears.
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, [user, vapidPublicKey, backendReady, status, completedCount]);

  const handleEnable = async () => {
    const ok = await subscribe(vapidPublicKey);
    if (ok) {
      snoozeFor(REDISMISS_DAYS);
      setOpen(false);
      // Send confirmation push so user sees the system works
      fetch("/api/push/test", { method: "POST" }).catch(() => {});
    }
  };

  const handleSkip = () => {
    snoozeFor(REDISMISS_DAYS);
    setOpen(false);
  };

  if (status !== "default" || !vapidPublicKey || !backendReady) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 bg-axis-accent/15 text-axis-accent rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-axis-accent animate-pulse" />
              {t("push.badge")}
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2 leading-tight">{t("push.title")}</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">{t("push.sub")}</p>
            <ul className="space-y-2 mb-6 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-axis-accent">·</span>
                <span>{t("push.bullet.morning")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-axis-accent">·</span>
                <span>{t("push.bullet.streak")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-axis-accent">·</span>
                <span>{t("push.bullet.evening")}</span>
              </li>
            </ul>
            <button
              onClick={handleEnable}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-accent text-axis-text1 px-6 py-4 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {busy ? t("push.loading") : t("push.cta")}
            </button>
            <button
              onClick={handleSkip}
              disabled={busy}
              className="w-full mt-3 text-xs text-white/40 hover:text-white/70 transition-colors py-2 disabled:opacity-50"
            >
              {t("push.later")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
