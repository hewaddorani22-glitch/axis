"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useAxisScore } from "@/hooks/useAxisScore";
import { IconStreak, IconTarget, IconCheck, IconRevenue, AxisLogo, IconCopy, IconLink } from "@/components/icons";
import { toast } from "sonner";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://useaxis.com";

interface HeatmapDay {
  intensity: number; // 0 = inactive, 0.5 = partial, 1.0 = full
}

export default function ProvePage() {
  const { user, loading: userLoading } = useUser();
  const { streak } = useStreak();
  const { focusScore, grade, loading: scoreLoading } = useAxisScore();
  const supabase = createClient();

  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const username = user?.prove_it_username;
  const publicUrl = username ? `${APP_URL}/prove/${username}` : null;

  const fetchHeatmap = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setHeatmapLoading(false); return; }

    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };

    const [missionsRes, habitsRes] = await Promise.all([
      supabase
        .from("missions")
        .select("date")
        .eq("user_id", authUser.id)
        .eq("status", "done")
        .gte("date", daysAgo(27)),
      supabase
        .from("habit_logs")
        .select("date")
        .eq("user_id", authUser.id)
        .eq("completed", true)
        .gte("date", daysAgo(27)),
    ]);

    const missionDates = new Set(missionsRes.data?.map((m) => m.date) || []);
    const habitDates = new Set(habitsRes.data?.map((l) => l.date) || []);

    const days: HeatmapDay[] = [];
    for (let i = 27; i >= 0; i--) {
      const ds = daysAgo(i);
      const hasMission = missionDates.has(ds);
      const hasHabit = habitDates.has(ds);
      if (hasMission && hasHabit) days.push({ intensity: 1.0 });
      else if (hasMission || hasHabit) days.push({ intensity: 0.5 });
      else days.push({ intensity: 0 });
    }

    const activeDays = days.filter((d) => d.intensity > 0).length;
    setCompletionRate(Math.round((activeDays / 28) * 100));
    setHeatmap(days);
    setHeatmapLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const copyLink = () => {
    if (!publicUrl) {
      toast.error("Set a username in Settings first.");
      return;
    }
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied!");
  };

  const isLoading = userLoading || scoreLoading || heatmapLoading;

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Your Prove It Profile
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Your public profile shows your accountability stats to the world. Share it everywhere.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--bg-accent-soft)" }}
          >
            {isLoading ? (
              <Skeleton className="w-8 h-8 rounded-lg" />
            ) : (
              <span className="text-xl font-bold font-mono text-axis-accent">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <><Skeleton className="h-5 w-32 mb-1.5" /><Skeleton className="h-4 w-48" /></>
            ) : (
              <>
                <h4 className="text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {displayName}
                </h4>
                <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {user?.prove_it_bio || "No bio yet — add one in Settings."}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Public URL */}
        {username ? (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
          >
            <IconLink size={14} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-mono flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
              {publicUrl}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1 text-xs font-semibold text-axis-accent hover:underline transition-colors flex-shrink-0"
            >
              <IconCopy size={12} /> Copy
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
          >
            <span className="text-xs flex-1" style={{ color: "var(--text-tertiary)" }}>
              Set a username in Settings to get your public link.
            </span>
            <a href="/settings" className="text-xs font-semibold text-axis-accent hover:underline flex-shrink-0">
              Settings →
            </a>
          </div>
        )}
      </div>

      {/* Live Stats */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Live Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div
            className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
            ) : (
              <div className="flex items-center justify-center gap-1">
                <IconStreak size={20} className="text-orange-500" />
                <p className="text-2xl font-bold text-orange-500">{streak}</p>
              </div>
            )}
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>

          {/* Grade */}
          <div
            className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <p className="text-2xl font-bold text-axis-accent">{grade}</p>
            )}
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY&apos;S GRADE</p>
          </div>

          {/* Focus Score */}
          <div
            className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
            ) : (
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{focusScore}</p>
            )}
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>AXIS SCORE</p>
          </div>

          {/* 28-Day Rate */}
          <div
            className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
            ) : (
              <p className="text-2xl font-bold text-emerald-500">{completionRate}%</p>
            )}
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>28-DAY RATE</p>
          </div>
        </div>
      </div>

      {/* 28-day heatmap */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          28-Day Activity
        </h3>
        {heatmapLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md axis-skeleton" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2">
              {heatmap.map((day, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md transition-colors"
                  style={{
                    backgroundColor:
                      day.intensity >= 1.0
                        ? "rgba(205,255,79,0.55)"
                        : day.intensity >= 0.5
                        ? "rgba(205,255,79,0.22)"
                        : "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(205,255,79,0.55)" }} />
                <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Full day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(205,255,79,0.22)" }} />
                <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }} />
                <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>Inactive</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Shareable scorecard */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{ backgroundColor: "var(--bg-secondary)", border: "2px solid rgba(205,255,79,0.15)" }}
      >
        <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>SHAREABLE SCORECARD</p>
        <div
          className="rounded-xl p-6 max-w-xs mx-auto border"
          style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center gap-2 justify-center mb-4">
            <AxisLogo size={20} />
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
          </div>
          {isLoading ? (
            <><Skeleton className="h-10 w-12 mx-auto mb-2" /><Skeleton className="h-3 w-20 mx-auto mb-4" /></>
          ) : (
            <>
              <p className="text-3xl font-bold text-axis-accent mb-1">{grade}</p>
              <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Grade</p>
            </>
          )}
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{focusScore}</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>SCORE</p>
            </div>
            <div>
              <p className="text-sm font-bold text-orange-500 flex items-center justify-center gap-0.5">
                <IconStreak size={10} className="text-orange-500" />{streak}
              </p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-500">{completionRate}%</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>28-DAY</p>
            </div>
          </div>
          {publicUrl && (
            <p className="text-[10px] font-mono mt-4 truncate" style={{ color: "var(--text-tertiary)" }}>
              {publicUrl.replace("https://", "")}
            </p>
          )}
        </div>

        <button
          onClick={copyLink}
          className="mt-4 flex items-center gap-2 mx-auto text-xs font-semibold bg-axis-accent text-axis-dark px-6 py-2.5 rounded-lg hover:bg-axis-accent/90 transition-all"
        >
          <IconCopy size={12} /> Copy Profile Link
        </button>
      </div>
    </div>
  );
}
