"use client";

import { useTheme } from "@/components/theme-provider";
import { IconStreak, IconCheck, IconTarget, IconFocus, IconRevenue, AxisLogo } from "@/components/icons";

export default function ProvePage() {
  const { theme } = useTheme();
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile preview */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Your Prove It Profile</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Your public profile shows your stats and accountability to the world.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span className="text-xl font-bold font-mono text-axis-accent">K</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>King</h4>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Entrepreneur · Building AXIS</p>
          </div>
        </div>

        {/* Public URL */}
        <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
          <span className="text-xs font-mono flex-1" style={{ color: "var(--text-secondary)" }}>axis.app/prove/king</span>
          <button className="text-xs font-semibold text-axis-accent hover:underline transition-colors">
            Copy Link
          </button>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Public Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <IconStreak size={20} className="text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">17</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-axis-accent">A</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY&apos;S GRADE</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>87</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>FOCUS SCORE</p>
          </div>
          <div className="rounded-xl p-4 text-center border overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-emerald-500">86%</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>30-DAY RATE</p>
          </div>
        </div>
      </div>

      {/* 28-day heatmap */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>28-Day Activity</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className="aspect-square rounded-md transition-colors"
                style={{
                  backgroundColor:
                    intensity > 0.7
                      ? "rgba(205,255,79,0.5)"
                      : intensity > 0.4
                      ? "rgba(205,255,79,0.25)"
                      : intensity > 0.15
                      ? "rgba(205,255,79,0.1)"
                      : theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="axis-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Achievements</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <IconTarget size={20} className="text-axis-accent" />, title: "100 Missions Done", earned: true },
            { icon: <IconCheck size={20} className="text-emerald-500" />, title: "Perfect Week", earned: true },
            { icon: <IconStreak size={20} className="text-orange-500" />, title: "30-Day Streak", earned: false },
            { icon: <IconRevenue size={20} className="text-emerald-500" />, title: "First $10K Month", earned: true },
          ].map((badge) => (
            <div
              key={badge.title}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                badge.earned
                  ? ""
                  : "opacity-40"
              }`}
              style={{
                backgroundColor: badge.earned ? "var(--bg-accent-soft)" : "var(--bg-tertiary)",
                borderColor: badge.earned ? "rgba(205,255,79,0.2)" : "var(--border-primary)",
              }}
            >
              <div className="flex-shrink-0 text-xl">{badge.icon}</div>
              <div>
                <p className="text-xs font-semibold" style={{ color: badge.earned ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                  {badge.title}
                </p>
                <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {badge.earned ? "Earned" : "Locked"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share card */}
      <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "var(--bg-secondary)", border: "2px solid rgba(205,255,79,0.2)" }}>
        <p className="text-xs font-mono text-axis-accent mb-3">SHAREABLE CARD</p>
        <div className="rounded-xl p-6 max-w-xs mx-auto border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-2 justify-center mb-4">
            <AxisLogo size={20} />
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
          </div>
          <p className="text-3xl font-bold text-axis-accent mb-1">A</p>
          <p className="text-xs font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Grade</p>
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>4/5</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>MISSIONS</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>3/3</p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>HABITS</p>
            </div>
            <div>
              <p className="text-sm font-bold text-orange-500 flex items-center justify-center gap-0.5">
                <IconStreak size={10} className="text-orange-500" />
                17
              </p>
              <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
            </div>
          </div>
          <p className="text-[10px] font-mono mt-4" style={{ color: "var(--text-tertiary)" }}>axis.app/prove/king</p>
        </div>
        <button className="mt-4 text-xs font-semibold bg-axis-accent text-axis-dark px-6 py-2.5 rounded-lg hover:bg-axis-accent/90 transition-all">
          Download Card
        </button>
      </div>
    </div>
  );
}
