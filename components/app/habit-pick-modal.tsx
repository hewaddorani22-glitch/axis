"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";
import { toast } from "sonner";

type UserType = "entrepreneur" | "professional" | "creator" | "student" | null;

const SUGGESTIONS_BY_TYPE: Record<Exclude<UserType, null>, string[]> = {
  entrepreneur: ["Deep Work (60 Min)", "3 Cold-DMs / Outreach", "Workout 30 Min"],
  professional: ["Workout 30 Min", "Side-Project (30 Min)", "Kein Handy nach 22 Uhr"],
  creator: ["1 Post / Reel rausschicken", "Engagement (30 Min)", "Workout 30 Min"],
  student: ["Lernblock (60 Min)", "Workout 30 Min", "Schlaf vor 23 Uhr"],
};

const DEFAULT_SUGGESTIONS = ["Workout 30 Min", "60 Min fokussiert arbeiten", "Kein Handy nach 22 Uhr"];

export function HabitPickModal() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const onPrompt = (event: Event) => {
      const detail = (event as CustomEvent<{ userType: UserType }>).detail;
      setUserType(detail?.userType ?? null);
      setOpen(true);
      trackEvent("habit_prompt_shown", { userType: detail?.userType ?? null });
    };
    window.addEventListener("lomoura:habit-prompt", onPrompt as EventListener);
    return () => window.removeEventListener("lomoura:habit-prompt", onPrompt as EventListener);
  }, []);

  const suggestions = userType ? SUGGESTIONS_BY_TYPE[userType] : DEFAULT_SUGGESTIONS;

  const handlePick = async (name: string) => {
    setSaving(name);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(null);
      return;
    }
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name,
      icon: "IconHabits",
      sort_order: 0,
    });
    setSaving(null);

    if (error) {
      toast.error(locale === "de" ? "Konnte Habit nicht anlegen" : "Couldn't create habit");
      return;
    }

    trackEvent("habit_prompt_picked", { name, userType });
    toast.success(locale === "de" ? "Habit angelegt 🔥" : "Habit added 🔥");
    setOpen(false);
    // Tell habit-displaying components to refresh.
    window.dispatchEvent(new CustomEvent("lomoura:habit-created"));
  };

  const handleSkip = () => {
    trackEvent("habit_prompt_skipped", { userType });
    setOpen(false);
  };

  if (!open) return null;

  const copy = locale === "de"
    ? {
        eyebrow: "Erste Mission ✓",
        title: "Eine Routine — und dein Streak startet.",
        sub: "Pick eine Sache, die du jeden Tag hinkriegst. Nur eine. Du kannst später mehr.",
        skip: "Spaeter",
      }
    : {
        eyebrow: "First mission ✓",
        title: "One routine — and your streak starts.",
        sub: "Pick one thing you can do every day. Just one. You can add more later.",
        skip: "Later",
      };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 bg-axis-accent/15 text-axis-accent rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-axis-accent animate-pulse" />
              {copy.eyebrow}
            </span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">{copy.title}</h3>
          <p className="text-sm text-white/70 mb-5">{copy.sub}</p>

          <div className="space-y-2 mb-4">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => handlePick(name)}
                disabled={saving !== null}
                className="w-full flex items-center justify-between bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all disabled:opacity-40"
              >
                <span>{name}</span>
                {saving === name ? (
                  <span className="text-xs text-axis-accent">…</span>
                ) : (
                  <span className="text-axis-accent text-xs">+</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-2"
          >
            {copy.skip}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
