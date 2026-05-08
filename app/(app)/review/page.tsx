"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { trackEvent } from "@/lib/analytics";
import { openUpgradePrompt } from "@/lib/upgrade-prompt";
import { formatCurrency } from "@/lib/utils";

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

function formatWeekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(`${weekStart}T00:00:00`);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} / ${end.toLocaleDateString("en-US", opts)}`;
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

export default function ReviewPage() {
  const { user, loading: userLoading } = useUser();
  const { streak } = useStreak();

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
      label: "TASKS DONE",
      value: summary.missionsTotal > 0 ? `${summary.missionsCompleted}/${summary.missionsTotal}` : "0",
      sub: summary.missionsTotal > 0 ? "Completed this week" : "No tasks yet",
      accent: "text-axis-accent",
    },
    {
      label: "HABITS DONE",
      value: `${summary.habitsCompleted}`,
      sub: summary.habitsCompleted > 0 ? "Check-ins this week" : "No check-ins yet",
      accent: "text-axis-accent2",
    },
    {
      label: "ACTIVE DAYS",
      value: `${summary.activeDays}/${summary.daysElapsed}`,
      sub: "Task + habit on the same day",
      accent: "text-orange-500",
    },
    showRevenueSummary
      ? {
          label: "WEEK REVENUE",
          value: formatCurrency(summary.revenueTotal),
          sub: "Tracked this week",
          accent: "text-emerald-500",
        }
      : {
          label: "DAY STREAK",
          value: `${streak}`,
          sub: streak > 0 ? "Keep it alive" : "Start today",
          accent: "text-orange-500",
        },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="axis-card">
        <div className="flex flex-col gap-2 mb-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            This Week&apos;s Review
          </h2>
          {isSunday() && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-axis-accent/10 text-axis-accent">
              Sunday: do your review
            </span>
          )}
        </div>
        <p className="text-xs font-mono mb-5" style={{ color: "var(--text-tertiary)" }}>
          {formatWeekLabel(thisWeek)}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-3"
              style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
            >
              <p className={`text-xl font-bold ${card.accent}`}>{card.value}</p>
              <p className="mt-0.5 text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                {card.label}
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl px-4 py-3 mb-5" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            What actually happened this week?
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            Write down what worked, what felt messy, and the one focus for next week. This becomes much more useful once you have a few weeks in a row.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Wins this week
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well? What are you proud of?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(205,255,79,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Struggles
            </label>
            <textarea
              value={struggles}
              onChange={(e) => setStruggles(e.target.value)}
              placeholder="What was hard? What would you do differently?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(205,255,79,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Next week&apos;s focus
            </label>
            <textarea
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              placeholder="What's the one thing that will make next week a win?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(205,255,79,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (!wins.trim() && !struggles.trim() && !nextFocus.trim())}
          className="mt-5 w-full flex items-center justify-center text-sm font-semibold bg-axis-accent text-axis-dark px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-axis-dark/30 border-t-axis-dark rounded-full animate-spin" />
          ) : saved ? (
            "Saved ✓"
          ) : thisWeekReview ? (
            "Update Review"
          ) : (
            "Save Review"
          )}
        </button>
      </div>

      {!reviewsLoading && pastReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold px-1" style={{ color: "var(--text-primary)" }}>
            Past Reviews
          </h3>
          {pastReviews.map((review) => (
            <details key={review.id} className="axis-card group">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatWeekLabel(review.week_start)}
                </p>
                <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {review.wins || review.struggles || review.next_week_focus ? "View" : "Empty"}
                </span>
              </summary>
              <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                {review.wins && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold mb-1 text-axis-accent">WINS</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                      {review.wins}
                    </p>
                  </div>
                )}
                {review.struggles && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold mb-1 text-amber-500">STRUGGLES</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                      {review.struggles}
                    </p>
                  </div>
                )}
                {review.next_week_focus && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                      NEXT FOCUS
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
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
        <p className="text-center text-sm py-4" style={{ color: "var(--text-tertiary)" }}>
          Complete your first weekly review above. Come back every Sunday.
        </p>
      )}

      {!isPro && hiddenPastCount > 0 && (
        <button
          onClick={() => openUpgradePrompt({ source: "review_history" })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-axis-accent/25 bg-axis-accent/5 px-4 py-3 text-left transition-all hover:bg-axis-accent/10"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              + {hiddenPastCount} earlier {hiddenPastCount === 1 ? "review" : "reviews"} in your archive
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Pro unlocks full history.
            </p>
          </div>
          <span className="shrink-0 text-xs font-mono font-bold rounded-md bg-axis-accent text-axis-dark px-2.5 py-1">
            UPGRADE
          </span>
        </button>
      )}
    </div>
  );
}
