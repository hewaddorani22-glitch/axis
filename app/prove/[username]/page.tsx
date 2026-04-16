import type { Metadata } from "next";
import { IconTarget, IconCheck, IconStreak, IconRevenue, AxisLogo } from "@/components/icons";

// Demo data for the public Prove It profile
const demoProfile = {
  name: "King",
  bio: "Entrepreneur · Building AXIS",
  avatar: "K",
  streak: 17,
  grade: "A",
  focusScore: 87,
  completionRate: 86,
};

const demoHeatmap = Array.from({ length: 28 }, () => Math.random());

const demoBadges = [
  { icon: <IconTarget size={20} className="text-axis-accent" />, title: "100 Missions Done", earned: true },
  { icon: <IconCheck size={20} className="text-emerald-500" />, title: "Perfect Week", earned: true },
  { icon: <IconStreak size={20} className="text-orange-500" />, title: "30-Day Streak", earned: false },
  { icon: <IconRevenue size={20} className="text-emerald-500" />, title: "First $10K Month", earned: true },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — AXIS Prove It`,
    description: `Check out ${username}'s accountability profile on AXIS.`,
  };
}

export default async function ProveItPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AxisLogo size={24} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
            <span className="text-xs font-mono ml-1" style={{ color: "var(--text-tertiary)" }}>/ prove</span>
          </div>
          <a
            href="/"
            className="text-xs font-medium bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all"
          >
            Get AXIS Free
          </a>
        </div>
      </div>

      {/* Profile */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* User info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span className="text-2xl font-bold font-mono text-axis-accent">{demoProfile.avatar}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{demoProfile.name}</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{demoProfile.bio}</p>
          <p className="text-xs font-mono mt-2" style={{ color: "var(--text-tertiary)" }}>axis.app/prove/{username}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-center gap-1">
              <IconStreak size={20} className="text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">{demoProfile.streak}</p>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>DAY STREAK</p>
          </div>
          <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-axis-accent">{demoProfile.grade}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>TODAY&apos;S GRADE</p>
          </div>
          <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{demoProfile.focusScore}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>FOCUS SCORE</p>
          </div>
          <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <p className="text-2xl font-bold text-emerald-500">{demoProfile.completionRate}%</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-tertiary)" }}>30-DAY RATE</p>
          </div>
        </div>

        {/* 28-day heatmap */}
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>28-Day Activity</h3>
          <div className="grid grid-cols-7 gap-2">
            {demoHeatmap.map((intensity, i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{
                  backgroundColor:
                    intensity > 0.7
                      ? "rgba(205,255,79,0.5)"
                      : intensity > 0.4
                      ? "rgba(205,255,79,0.25)"
                      : intensity > 0.15
                      ? "rgba(205,255,79,0.1)"
                      : "var(--bg-hover)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {demoBadges.map((badge, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  badge.earned ? "" : "opacity-40"
                }`}
                style={{
                  backgroundColor: badge.earned ? "var(--bg-accent-soft)" : "var(--bg-tertiary)",
                  borderColor: badge.earned ? "rgba(205,255,79,0.2)" : "var(--border-primary)",
                }}
              >
                <div className="flex-shrink-0">{badge.icon}</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: badge.earned ? "var(--text-primary)" : "var(--text-secondary)" }}>
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

        {/* Shareable card */}
        <div className="rounded-2xl p-8 text-center border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
          <div className="max-w-[280px] mx-auto rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2 justify-center mb-4">
              <AxisLogo size={20} />
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AXIS</span>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{demoProfile.name}</p>
            <p className="text-4xl font-bold text-axis-accent mb-1">{demoProfile.grade}</p>
            <p className="text-[10px] font-mono mb-4" style={{ color: "var(--text-tertiary)" }}>Daily Scorecard</p>
            <div className="flex items-center justify-center gap-5 text-center mb-4">
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
                  <IconStreak size={12} className="text-orange-500" />
                  {demoProfile.streak}
                </p>
                <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
              </div>
            </div>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>axis.app/prove/{username}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Build your own system like {demoProfile.name}.</p>
          <a
            href="/"
            className="inline-flex items-center text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            Get AXIS Free
          </a>
        </div>
      </div>
    </div>
  );
}
