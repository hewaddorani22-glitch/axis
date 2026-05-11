"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { trackEvent } from "@/lib/analytics";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/provider";

interface WeeklyReview {
  id: string;
  week_start: string;
  wins: string | null;
  struggles: string | null;
  next_week_focus: string | null;
  created_at: string;
}

interface WeeklySummary {
  missionsCompleted: number;
  missionsTotal: number;
  habitsCompleted: number;
  activeDays: number;
  revenueTotal: number;
  daysElapsed: number;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getWeekEnd(weekStart: string): string {
  const end = new Date(`${weekStart}T00:00:00`);
  end.setDate(end.getDate() + 6);
  return end.toISOString().split("T")[0];
}

function getDaysElapsedInWeek(weekStart: string): number {
  const start = new Date(`${weekStart}T00:00:00`);
  const today = new Date();
  const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(7, elapsed));
}

function formatWeekLabel(weekStart: string, locale: "de" | "en"): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(`${weekStart}T00:00:00`);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const dateLocale = locale === "de" ? "de-DE" : "en-US";
  return `${start.toLocaleDateString(dateLocale, opts)} / ${end.toLocaleDateString(dateLocale, opts)}`;
}

function isSunday(): boolean {
  return new Date().getDay() === 0;
}

const EMPTY_SUMMARY: WeeklySummary = {
  missionsCompleted: 0,
  missionsTotal: 0,
  habitsCompleted: 0,
  activeDays: 0,
  revenueTotal: 0,
  daysElapsed: 1,
};

const COPY = {
  de: {
    title: "Dein Wochen-Review",
    sunday: "Sonntag: Review machen",
    tasksDone: "AUFGABEN",
    tasksCompleted: "Diese Woche erledigt",
    noTasks: "Noch keine Aufgaben",
    habitsDone: "HABITS",
    checkins: "Check-ins diese Woche",
    noCheckins: "Noch keine Check-ins",
    activeDays: "AKTIVE TAGE",
    activeDaysSub: "Aufgabe + Habit am selben Tag",
    weekRevenue: "WOCHEN-UMSATZ",
    trackedThisWeek: "Diese Woche getrackt",
    dayStreak: "TAGE-STREAK",
    keepAlive: "Am Leben halten",
    startToday: "Heute starten",
    promptTitle: "Was ist diese Woche wirklich passiert?",
    promptBody:
      "Schreib auf, was funktioniert hat, was chaotisch war und worauf du dich nächste Woche fokussierst. Nach ein paar Wochen wird daraus dein persönliches Muster.",
    wins: "Wins diese Woche",
    winsPlaceholder: "Was lief gut? Worauf bist du stolz?",
    struggles: "Schwierigkeiten",
    strugglesPlaceholder: "Was war schwer? Was würdest du anders machen?",
    nextFocus: "Fokus nächste Woche",
    nextFocusPlaceholder: "Welche eine Sache macht nächste Woche erfolgreich?",
    saving: "Speichert...",
    saved: "Gespeichert ✓",
    update: "Review aktualisieren",
    save: "Review speichern",
    past: "Vergangene Reviews",
    view: "Öffnen",
    empty: "Leer",
    winsShort: "WINS",
    strugglesShort: "SCHWIERIG",
    nextShort: "NÄCHSTER FOKUS",
    firstReview: "Mach oben dein erstes Wochen-Review. Komm jeden Sonntag zurück.",
    archive: (n: number) => `+ ${n} ältere${n === 1 ? "s Review" : " Reviews"} im Archiv`,
    archiveSub: "Pro schaltet den kompletten Verlauf frei.",
    upgrade: "UPGRADE",
  },
  en: {
    title: "This Week's Review",
    sunday: "Sunday: do your review",
    tasksDone: "TASKS DONE",
    tasksCompleted: "Completed this week",
    noTasks: "No tasks yet",
    habitsDone: "HABITS DONE",
    checkins: "Check-ins this week",
    noCheckins: "No check-ins yet",
    activeDays: "ACTIVE DAYS",
    activeDaysSub: "Task + habit on the same day",
    weekRevenue: "WEEK REVENUE",
    trackedThisWeek: "Tracked this week",
    dayStreak: "DAY STREAK",
    keepAlive: "Keep it alive",
    startToday: "Start today",
    promptTitle: "What actually happened this week?",
    promptBody:
      "Write down what worked, what felt messy, and the one focus for next week. This becomes much more useful once you have a few weeks in a row.",
    wins: "Wins this week",
    winsPlaceholder: "What went well? What are you proud of?",
    struggles: "Struggles",
    strugglesPlaceholder: "What was hard? What would you do differently?",
    nextFocus: "Next week's focus",
    nextFocusPlaceholder: "What's the one thing that will make next week a win?",
    saving: "Saving...",
    saved: "Saved ✓",
    update: "Update Review",
    save: "Save Review",
    past: "Past Reviews",
    view: "View",
    empty: "Empty",
    winsShort: "WINS",
    strugglesShort: "STRUGGLES",
    nextShort: "NEXT FOCUS",
    firstReview: "Complete your first weekly review above. Come back every Sunday.",
    archive: (n: number) => `+ ${n} earlier ${n === 1 ? "review" : "reviews"} in your archive`,
    archiveSub: "Pro unlocks full history.",
    upgrade: "UPGRADE",
  },
};

export default function ReviewPage() {
  const { user, loading: userLoading } = useUser();
  const { streak } = useStreak();
  const { locale } = useLocale();
  const copy = COPY[locale === "en" ? "en" : "de"];

  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [summary, setSummary] = useState<WeeklySummary>(EMPTY_SUMMARY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [nextFocus, setNextFocus] = useState("");

  const thisWeek = getWeekStart();
  const weekEnd = getWeekEnd(thisWeek);
  const supabase = createClient();

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);

    const [reviewsRes, missionsRes, habitLogsRes, revenueRes] = await Promise.all([
      supabase.from("weekly_reviews").select("*").order("week_start", { ascending: false }).limit(12),
      supabase.from("missions").select("date, status").gte("date", thisWeek).lte("date", weekEnd),
      supabase
        .from("habit_logs")
        .select("date, completed")
        .eq("completed", true)
        .gte("date", thisWeek)
        .lte("date", weekEnd),
      supabase.from("revenue_entries").select("amount, date").gte("date", thisWeek).lte("date", weekEnd),
    ]);

    const nextReviews = (reviewsRes.data as WeeklyReview[]) || [];
    const missionRows = (missionsRes.data as { date: string; status: "active" | "done" }[]) || [];
    const habitRows = (habitLogsRes.data as { date: string; completed: boolean }[]) || [];
    const revenueRows = (revenueRes.data as { amount: number; date: string }[]) || [];

    const missionDoneDates = new Set(
      missionRows.filter((mission) => mission.status === "done").map((mission) => mission.date)
    );
    const habitDoneDates = new Set(habitRows.map((habit) => habit.date));
    const activeDays = Array.from(missionDoneDates).filter((date) => habitDoneDates.has(date)).length;

    setSummary({
      missionsCompleted: missionRows.filter((mission) => mission.status === "done").length,
      missionsTotal: missionRows.length,
      habitsCompleted: habitRows.length,
      activeDays,
      revenueTotal: revenueRows.reduce((sum, row) => sum + Number(row.amount), 0),
      daysElapsed: getDaysElapsedInWeek(thisWeek),
    });

    setReviews(nextReviews);

    const thisWeekReview = nextReviews.find((review) => review.week_start === thisWeek);
    if (thisWeekReview) {
      setWins(thisWeekReview.wins || "");
      setStruggles(thisWeekReview.struggles || "");
      setNextFocus(thisWeekReview.next_week_focus || "");
    }

    setReviewsLoading(false);
  }, [supabase, thisWeek, weekEnd]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    trackEvent("weekly_review_opened", { week_start: thisWeek });
  }, [thisWeek]);

  const handleSave = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    setSaving(true);

    const { error } = await supabase.from("weekly_reviews").upsert({
      user_id: authUser.id,
      week_start: thisWeek,
      wins: wins.trim() || null,
      struggles: struggles.trim() || null,
      next_week_focus: nextFocus.trim() || null,
    });

    setSaving(false);
    if (error) return;

    setSaved(true);
    trackEvent("weekly_review_saved", { week_start: thisWeek });
    setTimeout(() => setSaved(false), 2000);
    fetchReviews();
  };

  const isPro = user?.plan === "pro";
  const showRevenueSummary =
    summary.revenueTotal > 0 || user?.user_type === "entrepreneur" || user?.user_type === "creator";
  const FREE_HISTORY_WEEKS = 4;

  const thisWeekReview = reviews.find((review) => review.week_start === thisWeek);
  const allPastReviews = reviews.filter((review) => review.week_start !== thisWeek);
  const pastReviews = isPro ? allPastReviews : allPastReviews.slice(0, FREE_HISTORY_WEEKS);
  const hiddenPastCount = isPro ? 0 : Math.max(0, allPastReviews.length - FREE_HISTORY_WEEKS);
  void userLoading;

  const summaryCards = [
    {
      label: copy.tasksDone,
      value: summary.missionsTotal > 0 ? `${summary.missionsCompleted}/${summary.missionsTotal}` : "0",
      sub: summary.missionsTotal > 0 ? copy.tasksCompleted : copy.noTasks,
      color: "var(--soft-green)",
    },
    {
      label: copy.habitsDone,
      value: `${summary.habitsCompleted}`,
      sub: summary.habitsCompleted > 0 ? copy.checkins : copy.noCheckins,
      color: "var(--soft-lav)",
    },
    {
      label: copy.activeDays,
      value: `${summary.activeDays}/${summary.daysElapsed}`,
      sub: copy.activeDaysSub,
      color: "var(--soft-warm)",
    },
    showRevenueSummary
      ? {
          label: copy.weekRevenue,
          value: formatCurrency(summary.revenueTotal),
          sub: copy.trackedThisWeek,
          color: "var(--soft-green)",
        }
      : {
          label: copy.dayStreak,
          value: `${streak}`,
          sub: streak > 0 ? copy.keepAlive : copy.startToday,
          color: "var(--accent)",
        },
  ];

  const inputStyle = {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    color: "var(--text-primary)",
  } as const;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Pro upsell */}
      {!isPro && (
        <button
          onClick={() => openUpgradePrompt({ source: "review_history" })}
          className="mb-6 flex w-full items-center justify-between rounded-[13px] px-5 py-3.5 text-left transition-colors hover:opacity-95"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">⭐</span>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {locale === "de"
                  ? "Volle Historie + AI-Zusammenfassung"
                  : "Full history + AI summary"}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {locale === "de"
                  ? "Pro zeigt Muster über alle Wochen."
                  : "Pro shows patterns across every week."}
              </div>
            </div>
          </div>
          <span
            className="rounded-lg px-3.5 py-1.5 text-[11px] font-bold"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            {locale === "de" ? "Freischalten" : "Unlock"}
          </span>
        </button>
      )}

      {/* Week header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {copy.title}
          </h2>
          {isSunday() && (
            <span
              className="rounded font-mono text-[10px] font-bold px-2 py-1"
              style={{
                color: "var(--accent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              {copy.sunday}
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
          {formatWeekLabel(thisWeek, locale)}
        </div>
      </div>

      {/* Stat grid */}
      <div className="mb-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[14px] px-4 py-[18px]"
            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <div
              className="mb-2.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              {card.label}
            </div>
            <div
              className="text-[28px] font-black leading-none tracking-tight"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Intro card */}
      <div
        className="mb-6 rounded-[14px] px-5 py-[18px]"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {copy.promptTitle}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {copy.promptBody}
        </p>
      </div>

      {/* Textareas */}
      {[
        { label: copy.wins, placeholder: copy.winsPlaceholder, value: wins, set: setWins, hint: locale === "de" ? "Feiere deine Erfolge" : "Celebrate your wins" },
        { label: copy.struggles, placeholder: copy.strugglesPlaceholder, value: struggles, set: setStruggles, hint: locale === "de" ? "Ehrlich reflektieren" : "Reflect honestly" },
        { label: copy.nextFocus, placeholder: copy.nextFocusPlaceholder, value: nextFocus, set: setNextFocus, hint: locale === "de" ? "Ein Fokus, nicht zehn" : "One focus, not ten" },
      ].map((field) => (
        <div key={field.label} className="mb-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {field.label}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {field.hint}
            </span>
          </div>
          <textarea
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full resize-y rounded-xl px-4 py-3.5 text-[13px] leading-relaxed outline-none transition-colors"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
          />
        </div>
      ))}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || (!wins.trim() && !struggles.trim() && !nextFocus.trim())}
        className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold transition-transform active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: "var(--text-primary)", color: "var(--text-inverted)" }}
      >
        {saving ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
        ) : saved ? (
          copy.saved
        ) : thisWeekReview ? (
          copy.update
        ) : (
          copy.save
        )}
      </button>

      {!reviewsLoading && pastReviews.length > 0 && (
        <div className="mt-9 space-y-2.5">
          <h3 className="px-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {copy.past}
          </h3>
          {pastReviews.map((review) => (
            <details
              key={review.id}
              className="group rounded-[14px] px-5 py-4"
              style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatWeekLabel(review.week_start, locale)}
                </p>
                <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {review.wins || review.struggles || review.next_week_focus ? copy.view : copy.empty}
                </span>
              </summary>
              <div className="mt-4 space-y-3 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
                {review.wins && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] font-bold" style={{ color: "var(--soft-green)" }}>
                      {copy.winsShort}
                    </p>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
                      {review.wins}
                    </p>
                  </div>
                )}
                {review.struggles && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] font-bold" style={{ color: "var(--soft-warm)" }}>
                      {copy.strugglesShort}
                    </p>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
                      {review.struggles}
                    </p>
                  </div>
                )}
                {review.next_week_focus && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] font-bold" style={{ color: "var(--soft-lav)" }}>
                      {copy.nextShort}
                    </p>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
                      {review.next_week_focus}
                    </p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {!reviewsLoading && reviews.length === 0 && (
        <p className="py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          {copy.firstReview}
        </p>
      )}

      {!isPro && hiddenPastCount > 0 && (
        <button
          onClick={() => openUpgradePrompt({ source: "review_history" })}
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-[14px] px-5 py-3.5 text-left transition-colors hover:opacity-95"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {copy.archive(hiddenPastCount)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {copy.archiveSub}
            </p>
          </div>
          <span
            className="shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-bold"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            {copy.upgrade}
          </span>
        </button>
      )}
    </div>
  );
}
