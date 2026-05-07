"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useLocale } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "lomoura-upgrade-dismissed-until";
const DAY_MS = 24 * 60 * 60 * 1000;
const TRIGGER_DAY = 7;
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
    window.localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + days * DAY_MS),
    );
  } catch {
    // ignore
  }
}

export function UpgradeModal() {
  const { user } = useUser();
  const { t } = useLocale();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.plan === "pro") return;
    if (Date.now() < dismissedUntil()) return;

    let cancelled = false;
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const createdAt = authUser?.created_at;
      if (!createdAt) return;
      const ageMs = Date.now() - new Date(createdAt).getTime();
      if (ageMs < TRIGGER_DAY * DAY_MS) return;
      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // fall through to close
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = () => {
    snoozeFor(REDISMISS_DAYS);
    setOpen(false);
  };

  if (!user || user.plan === "pro") return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={handleSnooze}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 bg-axis-accent/15 text-axis-accent rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-axis-accent animate-pulse" />
                {t("upgrade.badge")}
              </span>
              <button
                onClick={handleSnooze}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-2xl font-bold tracking-tight mb-2">{t("upgrade.title")}</h3>
            <p className="text-sm text-white/70 mb-6">{t("upgrade.sub")}</p>

            <ul className="space-y-2.5 mb-6">
              {[
                t("upgrade.bullet.unlimited"),
                t("upgrade.bullet.streak"),
                t("upgrade.bullet.partners"),
                t("upgrade.bullet.early"),
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg className="w-4 h-4 text-axis-accent2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-6 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">$9</span>
              <span className="text-sm text-white/50">{t("upgrade.permonth")}</span>
              <span className="ml-auto text-[11px] font-mono text-axis-accent uppercase">
                {t("upgrade.cancel")}
              </span>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-accent text-axis-text1 px-6 py-4 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? t("upgrade.loading") : t("upgrade.cta")}
            </button>
            <button
              onClick={handleSnooze}
              className="w-full mt-2 text-xs text-white/40 hover:text-white/70 transition-colors py-2"
            >
              {t("upgrade.later")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
