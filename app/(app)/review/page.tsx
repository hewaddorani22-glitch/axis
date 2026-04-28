"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { useRevenue } from "@/hooks/useRevenue";
import { useStreak } from "@/hooks/useStreak";
import { calculateFocusScore } from "@/lib/scoring";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface WeeklyReview {
  id: string;
  week_start: string;
  wins: string | null;
  struggles: string | null;
  next_week_focus: string | null;
  created_at: string;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekStart + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} / ${end.toLocaleDateString("en-US", opts)}`;
}

function isSunday(): boolean {
  return new Date().getDay() === 0;
}

export default function ReviewPage() {
  const { user, loading: userLoading } = useUser();
  const { completedCount, total: missionsTotal } = useMissions();
  const { completedToday: habitsCompleted, total: habitsTotal } = useHabits();
  const { mtdTotal } = useRevenue();
  const { streak } = useStreak();

  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [nextFocus, setNextFocus] = useState("");

  const thisWeek = getWeekStart();
  const supabase = createClient();

  const score = calculateFocusScore({
    missionsCompleted: completedCount,
    missionsTotal: Math.max(missionsTotal, 1),
    habitsCompleted,
    habitsTotal: Math.max(habitsTotal, 1),
    streakDays: streak,
  });

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    const { data } = await supabase
      .from("weekly_reviews")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(12);
    setReviews((data as WeeklyReview[]) || []);

    // Pre-fill if this week's review already exists
    const thisWeekReview = (data as WeeklyReview[])?.find((r) => r.week_start === thisWeek);
    if (thisWeekReview) {
      setWins(thisWeekReview.wins || "");
      setStruggles(thisWeekReview.struggles || "");
      setNextFocus(thisWeekReview.next_week_focus || "");
    }
    setReviewsLoading(false);
  }, [supabase, thisWeek]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSave = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setSaving(true);

    await supabase.from("weekly_reviews").upsert({
      user_id: authUser.id,
      week_start: thisWeek,
      wins: wins.trim() || null,
      struggles: struggles.trim() || null,
      next_week_focus: nextFocus.trim() || null,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchReviews();
  };

  const isPro = user?.plan === "pro";

  if (!userLoading && !isPro) {
    return (
      <div className="mx-auto w-full max-w-2xl relative group">
        {/* Fake blurred content */}
        <div className="pointer-events-none opacity-40 blur-sm scale-[0.98] transition-all duration-500 group-hover:blur-md select-none space-y-6">
          <div className="axis-card">
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>This Week&apos;s Review</h2>
            <div className="grid grid-cols-1 gap-3 my-5 sm:grid-cols-3">
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--bg-tertiary)" }}><p className="text-xl font-bold text-axis-accent">S</p><p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>WEEKLY GRADE</p></div>
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--bg-tertiary)" }}><p className="text-xl font-bold text-axis-text1">$1,4k</p><p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>MTD REVENUE</p></div>
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--bg-tertiary)" }}><p className="text-xl font-bold text-orange-500">14</p><p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p></div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-24 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}></div>
              <div className="w-full h-24 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}></div>
            </div>
          </div>
        </div>

        {/* Premium Lock Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-axis-dark flex items-center justify-center mb-6 shadow-2xl border border-axis-border/10">
            <span className="text-3xl relative">
              🔒
              <span className="absolute -top-1 -right-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded pl-1 bg-axis-accent text-axis-dark">PRO</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Unlock Focus Reviews
          </h2>
          <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
            Tracking your tasks is basic. Reflecting on them is how you win. Deep weekly insights, win tracking, and focus scores are available for Pro users.
          </p>
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3.5 rounded-xl hover:bg-axis-accent/90 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          >
            Upgrade to Pro
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const thisWeekReview = reviews.find((r) => r.week_start === thisWeek);
  const pastReviews = reviews.filter((r) => r.week_start !== thisWeek);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* This Week */}
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

        {/* Auto-filled stats */}
        <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-3">
          <div className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold text-axis-accent">{score.grade}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>WEEKLY GRADE</p>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(mtdTotal)}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>MTD REVENUE</p>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold text-orange-500">{streak}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>
        </div>

        {/* Reflection fields */}
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

      {/* Past Reviews */}
      {!reviewsLoading && pastReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold px-1" style={{ color: "var(--text-primary)" }}>Past Reviews</h3>
          {pastReviews.map((review) => (
            <details
              key={review.id}
              className="axis-card group"
            >
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
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{review.wins}</p>
                  </div>
                )}
                {review.struggles && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold mb-1 text-amber-500">STRUGGLES</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{review.struggles}</p>
                  </div>
                )}
                {review.next_week_focus && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>NEXT FOCUS</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{review.next_week_focus}</p>
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
    </div>
  );
}
