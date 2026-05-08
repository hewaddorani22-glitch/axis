"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";
import {
  UPGRADE_PROMPT_EVENT,
  type UpgradePromptDetail,
  type UpgradePromptSource,
} from "@/lib/upgrade-prompt";

type PromptCopy = {
  badge: string;
  title: string;
  sub: string;
  bullets: readonly string[];
};

function getPromptCopy(locale: "de" | "en", source: UpgradePromptSource): PromptCopy {
  const copy = {
    de: {
      generic: {
        badge: "Pro freischalten",
        title: "Hol dir das komplette System",
        sub: "Unbegrenzte Tasks, Habit-Schutz, Weekly-Archive und stärkere Accountability in einer App.",
        bullets: [
          "Unbegrenzte Tasks, Habits und Themes",
          "Streak Freeze + Streak Restore",
          "Partner-Features und Accountability",
          "90-Tage-Historie und tiefere Reviews",
        ],
      },
      mission_limit: {
        badge: "Pro · Tasks",
        title: "Plane den ganzen Tag statt nur die Top 5",
        sub: "Du hast das Free-Limit für tägliche Tasks erreicht. Pro macht aus Lomoura deinen vollständigen Tagesplaner.",
        bullets: [
          "Unbegrenzte tägliche Tasks",
          "Weekly Review mit voller Historie",
          "Streak-Schutz für chaotische Tage",
          "Partner-Accountability inklusive",
        ],
      },
      habit_limit: {
        badge: "Pro · Habits",
        title: "Behalte jede Routine in einem System",
        sub: "Du hast das Free-Limit für Habits erreicht. Pro hält alle Routinen, Streaks und die Historie an einem Ort.",
        bullets: [
          "Unbegrenzte Habits und Routinen",
          "Streak Freeze + Restore",
          "90-Tage-Historie für echte Fortschritte",
          "Mehr Accountability mit Partnern",
        ],
      },
      revenue_limit: {
        badge: "Pro · Revenue",
        title: "Tracke jeden Einnahme-Stream",
        sub: "Free ist für einen Stream gut. Pro macht Revenue-Tracking für Creator, Freelancer und Side Hustles wirklich nutzbar.",
        bullets: [
          "Unbegrenzte Revenue-Streams",
          "Mehr Verlauf und bessere Trends",
          "Alles weiter im selben Daily Workflow",
          "Tasks, Habits und Revenue an einem Ort",
        ],
      },
      theme_limit: {
        badge: "Pro · Themes",
        title: "Steuere mehr als nur zwei Fokusbereiche",
        sub: "Mit Pro kannst du mehrere Lebensbereiche parallel sauber planen statt ständig umzubauen.",
        bullets: [
          "Unbegrenzte Themes und Ziele",
          "Mehr Verknüpfungen mit Tasks und Habits",
          "Bessere Weekly-Reviews über mehrere Bereiche",
          "Mehr Kontext für deinen Fortschritt",
        ],
      },
      review_history: {
        badge: "Pro · Archive",
        title: "Öffne dein komplettes Weekly-Review-Archiv",
        sub: "Free zeigt die letzten 4 Wochen. Pro zeigt dir das ganze Muster hinter deinem Fortschritt.",
        bullets: [
          "Volle Weekly-Review-Historie",
          "Bessere Rückblicke auf gute und schlechte Phasen",
          "90-Tage-Verlauf für Gewohnheiten und Fokus",
          "Mehr Kontext statt nur Momentaufnahmen",
        ],
      },
      streak_risk: {
        badge: "Pro · Streak",
        title: "Schütze den Streak, den du schon aufgebaut hast",
        sub: "Ein chaotischer Tag soll nicht alles löschen. Pro gibt dir Freeze und Restore für echte Off-Days.",
        bullets: [
          "Streak Freeze für einen freien Tag",
          "Einmaliger Restore bei Streak-Verlust",
          "Historie, damit Motivation sichtbar bleibt",
          "Perfekt für echte Menschen mit echten Tagen",
        ],
      },
    },
    en: {
      generic: {
        badge: "Unlock Pro",
        title: "Get the full system",
        sub: "Unlimited tasks, habit protection, weekly archives, and deeper accountability in one app.",
        bullets: [
          "Unlimited tasks, habits, and themes",
          "Streak Freeze + Streak Restore",
          "Partner features and accountability",
          "90-day history and deeper reviews",
        ],
      },
      mission_limit: {
        badge: "Pro · Tasks",
        title: "Plan the whole day, not just your top 5",
        sub: "You hit the free daily task limit. Pro turns Lomoura into your full day planner.",
        bullets: [
          "Unlimited daily tasks",
          "Weekly review with full history",
          "Streak protection for messy days",
          "Partner accountability included",
        ],
      },
      habit_limit: {
        badge: "Pro · Habits",
        title: "Keep every routine in one system",
        sub: "You hit the free habit limit. Pro unlocks all your habits, streak protection, and deeper history.",
        bullets: [
          "Unlimited habits and routines",
          "Streak Freeze + Restore",
          "90-day history for real progress",
          "More accountability with partners",
        ],
      },
      revenue_limit: {
        badge: "Pro · Revenue",
        title: "Track every income stream",
        sub: "Free is fine for one stream. Pro makes revenue tracking genuinely useful for creators, freelancers, and side hustles.",
        bullets: [
          "Unlimited revenue streams",
          "More history and better trends",
          "Keep revenue inside your daily workflow",
          "Tasks, habits, and revenue in one place",
        ],
      },
      theme_limit: {
        badge: "Pro · Themes",
        title: "Run more than two focus areas at once",
        sub: "Pro lets you plan multiple life areas in parallel instead of constantly reshuffling your setup.",
        bullets: [
          "Unlimited themes and goals",
          "More links between tasks and habits",
          "Better weekly reviews across areas",
          "More context around your progress",
        ],
      },
      review_history: {
        badge: "Pro · Archive",
        title: "Unlock your full weekly review archive",
        sub: "Free shows the last 4 weeks. Pro shows the real pattern behind your progress.",
        bullets: [
          "Full weekly review history",
          "Better reflection across good and bad weeks",
          "90-day habit and focus history",
          "More context, less guesswork",
        ],
      },
      streak_risk: {
        badge: "Pro · Streak",
        title: "Protect the streak you already built",
        sub: "One chaotic day should not wipe out weeks of momentum. Pro gives you Freeze and Restore for real life.",
        bullets: [
          "Streak Freeze for an off day",
          "One restore if your streak breaks",
          "History that keeps motivation visible",
          "Built for real people with real schedules",
        ],
      },
    },
  } as const;

  return copy[locale][source] ?? copy[locale].generic;
}

export function UpgradeModal() {
  const { user } = useUser();
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<UpgradePromptSource>("generic");

  useEffect(() => {
    if (!user || user.plan === "pro") return;

    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<UpgradePromptDetail>).detail;
      const nextSource = detail?.source ?? "generic";
      setSource(nextSource);
      setOpen(true);
      trackEvent("pro_paywall_seen", { source: nextSource });
    };

    window.addEventListener(UPGRADE_PROMPT_EVENT, handleOpen as EventListener);
    return () => {
      window.removeEventListener(UPGRADE_PROMPT_EVENT, handleOpen as EventListener);
    };
  }, [user]);

  const handleUpgrade = async () => {
    setLoading(true);
    trackEvent("pro_cta_clicked", { source });
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

  if (!user || user.plan === "pro") return null;

  const copy = getPromptCopy(locale === "de" ? "de" : "en", source);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
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
                {copy.badge}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-2xl font-bold tracking-tight mb-2">{copy.title}</h3>
            <p className="text-sm text-white/70 mb-6">{copy.sub}</p>

            <ul className="space-y-2.5 mb-6">
              {copy.bullets.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg className="w-4 h-4 text-axis-accent2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-6 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">9 €</span>
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
              onClick={() => setOpen(false)}
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
