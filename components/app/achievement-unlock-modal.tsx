"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useUser } from "@/hooks/useUser";
import { useLocale } from "@/lib/i18n/provider";
import { getBrowserAppUrl } from "@/lib/env";
import { toast } from "sonner";

type AchievementType = "30_day_streak" | "perfect_week" | "100_missions" | "first_10k";

interface UnacknowledgedAchievement {
  id: string;
  type: AchievementType;
  earned_at: string;
}

const SUPPORTED_TYPES: AchievementType[] = [
  "30_day_streak",
  "perfect_week",
  "100_missions",
  "first_10k",
];

const ACHIEVEMENT_EMOJI: Record<AchievementType, string> = {
  "30_day_streak": "🔥",
  perfect_week: "🟢",
  "100_missions": "💯",
  first_10k: "💸",
};

export function AchievementUnlockModal() {
  const { user } = useUser();
  const { t, locale } = useLocale();
  const [queue, setQueue] = useState<UnacknowledgedAchievement[]>([]);
  const supabase = createClient();

  const current = queue[0];

  const fetchUnacknowledged = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("achievements")
      .select("id, type, earned_at")
      .eq("user_id", user.id)
      .is("acknowledged_at", null)
      .order("earned_at", { ascending: true });
    if (data && data.length > 0) {
      const filtered = (data as UnacknowledgedAchievement[]).filter((a) =>
        SUPPORTED_TYPES.includes(a.type),
      );
      setQueue(filtered);
    }
  }, [user, supabase]);

  // Poll once on mount, then again when the tab becomes visible (covers
  // the case where a cron run lands while the user is in another tab).
  useEffect(() => {
    void fetchUnacknowledged();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void fetchUnacknowledged();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchUnacknowledged]);

  // Fire telemetry when an achievement first reaches the top of the queue.
  useEffect(() => {
    if (!current) return;
    trackEvent("achievement_unlock_shown", {
      achievement_type: current.type,
      earned_at: current.earned_at,
    });
  }, [current?.id, current?.type, current?.earned_at]);

  const acknowledge = async () => {
    if (!current) return;
    await supabase
      .from("achievements")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", current.id);
    setQueue((prev) => prev.slice(1));
  };

  const handleShare = async () => {
    if (!current || !user) return;
    trackEvent("achievement_share_clicked", { achievement_type: current.type });
    const url =
      user.prove_it_username
        ? `${getBrowserAppUrl()}/prove/${user.prove_it_username}`
        : getBrowserAppUrl();
    const shareText =
      locale === "de"
        ? `Achievement freigeschaltet: ${t(`ach.${current.type}.title`)} — auf lomoura.`
        : `Just unlocked: ${t(`ach.${current.type}.title`)} on lomoura.`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "lomoura", text: shareText, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        toast.success(locale === "de" ? "Link kopiert!" : "Link copied!");
      }
      trackEvent("achievement_share_completed", { achievement_type: current.type });
    } catch {
      // User cancelled the native share sheet — that's fine.
    }
  };

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={() => void acknowledge()}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <span className="inline-flex items-center gap-2 bg-axis-accent/15 text-axis-accent rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-axis-accent animate-pulse" />
              {t("ach.eyebrow")}
            </span>
            <button
              onClick={() => void acknowledge()}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-5 text-6xl leading-none" aria-hidden>
            {ACHIEVEMENT_EMOJI[current.type]}
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">
            {t(`ach.${current.type}.title`)}
          </h3>
          <p className="text-sm text-white/70 mb-6">
            {t(`ach.${current.type}.sub`)}
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={async () => {
                await handleShare();
                await acknowledge();
              }}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-axis-accent text-axis-dark px-6 py-3.5 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all"
            >
              {t("ach.share")}
            </button>
            <button
              onClick={() => void acknowledge()}
              className="w-full text-xs text-white/55 hover:text-white/85 transition-colors py-2"
            >
              {t("ach.continue")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
