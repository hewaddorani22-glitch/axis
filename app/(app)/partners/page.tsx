"use client";

import { useState, useEffect, useCallback } from "react";
import { usePartners } from "@/hooks/usePartners";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useMissions } from "@/hooks/useMissions";
import { useHabits } from "@/hooks/useHabits";
import { calculateFocusScore } from "@/lib/scoring";
import { IconPartners, IconNudge, IconCheck, IconWarning, IconStreak } from "@/components/icons";
import { getBrowserAppUrl } from "@/lib/env";

interface PartnerStats {
  missionsCompleted: number;
  missionsTotal: number;
  habitsCompleted: number;
  streak: number;
  focusScore: number;
  grade: string;
  lastActive: string | null;
}

function getStatusFromStats(stats: PartnerStats | undefined, lastActive: string | null) {
  if (!stats) return "falling";
  if (stats.grade === "A+" || stats.grade === "A" || stats.streak >= 7) return "onfire";
  if (stats.grade === "F" || stats.focusScore < 50) return "falling";
  if (!lastActive) return "falling";
  const daysSince = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);
  if (daysSince >= 2) return "falling";
  return "solid";
}

function getLastActiveLabel(lastActive: string | null): string {
  if (!lastActive) return "Never";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastActive === today) return "Today";
  if (lastActive === yesterday) return "Yesterday";
  const daysSince = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);
  return `${daysSince} days ago`;
}

const statusConfig = {
  onfire: {
    label: "On fire",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    icon: <IconStreak size={12} className="text-orange-500" />,
  },
  solid: {
    label: "Solid",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    icon: <IconCheck size={12} className="text-emerald-500" />,
  },
  falling: {
    label: "Falling off",
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: <IconWarning size={12} className="text-red-500" />,
  },
};

export default function PartnersPage() {
  const { user } = useUser();
  const { partners, loading, sendNudge, refetch } = usePartners();
  const { streak: myStreak } = useStreak();
  const { completedCount: myMissionsDone, total: myMissionsTotal } = useMissions();
  const { completedToday: myHabitsDone, total: myHabitsTotal } = useHabits();

  const [partnerStats, setPartnerStats] = useState<Record<string, PartnerStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [nudgeSent, setNudgeSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activePartners = partners.filter((p) => p.status === "active");
  const pendingPartners = partners.filter((p) => p.status === "pending");

  // Fetch real stats for all active partners
  const fetchStats = useCallback(async () => {
    if (activePartners.length === 0) return;
    setStatsLoading(true);
    const ids = activePartners.map((p) => p.partnerId).join(",");
    const res = await fetch(`/api/partners/stats?ids=${ids}`);
    const json = await res.json();
    if (json.stats) setPartnerStats(json.stats);
    setStatsLoading(false);
  }, [activePartners.map((p) => p.partnerId).join(",")]); // eslint-disable-line

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const myScore = calculateFocusScore({
    missionsCompleted: myMissionsDone,
    missionsTotal: Math.max(myMissionsTotal, 1),
    habitsCompleted: myHabitsDone,
    habitsTotal: Math.max(myHabitsTotal, 1),
    streakDays: myStreak,
  });

  const handleCopyInvite = () => {
    if (!user) return;
    const link = `${getBrowserAppUrl()}/signup?invite=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNudge = async (e: React.MouseEvent, partnerId: string, partnerUserId: string, partnerName: string) => {
    e.stopPropagation();
    setNudgingId(partnerId);
    await fetch("/api/partners/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: partnerUserId }),
    });
    setNudgingId(null);
    setNudgeSent(partnerId);
    setTimeout(() => setNudgeSent(null), 3000);
  };

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`axis-skeleton ${className}`} />
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Pending invites notice */}
      {pendingPartners.length > 0 && (
        <div className="rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-500 mb-1">
            {pendingPartners.length} pending invite{pendingPartners.length > 1 ? "s" : ""}
          </p>
          {pendingPartners.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 mt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {p.name} wants to partner with you
              </p>
              <button
                onClick={async () => {
                  // Accept: update partnership status via admin endpoint
                  await fetch("/api/partners/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ inviterId: p.partnerId }),
                  });
                  refetch();
                }}
                className="text-xs font-semibold text-axis-accent hover:underline"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Partner cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : activePartners.length === 0 ? null : (
        <div className="space-y-4">
          {activePartners.map((partner) => {
            const stats = partnerStats[partner.partnerId];
            const status = statusConfig[getStatusFromStats(stats, stats?.lastActive ?? null)];
            const isExpanded = selectedPartnerId === partner.id;

            return (
              <div
                key={partner.id}
                className="axis-card cursor-pointer"
                onClick={() => setSelectedPartnerId(isExpanded ? null : partner.id)}
              >
                <div className="flex items-start gap-4 sm:items-center">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                    <span className="text-sm font-bold font-mono text-axis-accent">
                      {(partner.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        {partner.name}
                      </h3>
                      <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md ${status.bg} ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      Last active {statsLoading ? "..." : getLastActiveLabel(stats?.lastActive ?? null)}
                    </p>
                  </div>

                  {/* Quick stats */}
                  <div className="hidden sm:flex items-center gap-4">
                    {statsLoading ? (
                      <>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                            {stats?.grade ?? ""}
                          </p>
                          <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>GRADE</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-500">{stats?.streak ?? 0}</p>
                          <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-axis-accent">{stats?.focusScore ?? 0}</p>
                          <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>FOCUS</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded comparison view */}
                {isExpanded && (
                  <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border-primary)" }}>
                    <p className="text-xs font-mono mb-4 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                      You vs {partner.name.split(" ")[0]}
                    </p>

                    <div className="space-y-4">
                      {/* Missions */}
                      <div>
                        <div className="flex flex-col gap-1 mb-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Missions Today</span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-xs font-mono text-axis-accent">
                              You: {myMissionsDone}/{myMissionsTotal}
                            </span>
                            <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {partner.name.split(" ")[0]}: {stats?.missionsCompleted ?? 0}/{stats?.missionsTotal ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full bg-axis-accent rounded-full transition-all"
                              style={{ width: `${myMissionsTotal > 0 ? (myMissionsDone / myMissionsTotal) * 100 : 0}%` }} />
                          </div>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${stats && stats.missionsTotal > 0 ? (stats.missionsCompleted / stats.missionsTotal) * 100 : 0}%`,
                                backgroundColor: "var(--text-tertiary)",
                              }} />
                          </div>
                        </div>
                      </div>

                      {/* Habits */}
                      <div>
                        <div className="flex flex-col gap-1 mb-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Habits Today</span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-xs font-mono text-axis-accent">
                              You: {myHabitsDone}/{myHabitsTotal}
                            </span>
                            <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {partner.name.split(" ")[0]}: {stats?.habitsCompleted ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full bg-axis-accent rounded-full transition-all"
                              style={{ width: `${myHabitsTotal > 0 ? (myHabitsDone / myHabitsTotal) * 100 : 0}%` }} />
                          </div>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${stats && stats.habitsCompleted > 0 ? 100 : 0}%`,
                                backgroundColor: "var(--text-tertiary)",
                              }} />
                          </div>
                        </div>
                      </div>

                      {/* Focus Score */}
                      <div>
                        <div className="flex flex-col gap-1 mb-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Focus Score</span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-xs font-mono text-axis-accent">You: {myScore.focusScore}</span>
                            <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {partner.name.split(" ")[0]}: {stats?.focusScore ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full bg-axis-accent rounded-full transition-all"
                              style={{ width: `${myScore.focusScore}%` }} />
                          </div>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${stats?.focusScore ?? 0}%`,
                                backgroundColor: "var(--text-tertiary)",
                              }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nudge button */}
                    <button
                      onClick={(e) => handleNudge(e, partner.id, partner.partnerId, partner.name)}
                      disabled={nudgingId === partner.id || nudgeSent === partner.id}
                      className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
                      style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => { if (!nudgeSent) { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      <IconNudge size={14} className="text-axis-accent" />
                      {nudgeSent === partner.id ? "Nudge sent!" : nudgingId === partner.id ? "Sending..." : "Send Nudge"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invite CTA */}
      <div
        className="rounded-2xl p-8 text-center transition-colors"
        style={{ border: "2px dashed var(--border-primary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <IconPartners size={24} className="text-axis-accent" />
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Invite a Partner
        </h3>
        <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color: "var(--text-tertiary)" }}>
          Share your invite link. When they sign up, you&apos;re automatically connected.
        </p>

        {user && (
        <div className="max-w-sm mx-auto mb-4">
            <div className="flex items-center gap-0 rounded-xl overflow-hidden border"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
              <span className="text-[11px] font-mono px-3 py-2.5 flex-1 truncate text-left"
                style={{ color: "var(--text-tertiary)" }}>
                {typeof window !== "undefined" ? `${getBrowserAppUrl()}/signup?invite=${user.id}` : "Loading..."}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleCopyInvite}
          className="bg-axis-accent text-axis-dark text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-axis-accent/90 transition-all"
        >
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>
      </div>

      {/* Empty state */}
      {!loading && activePartners.length === 0 && pendingPartners.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No partners yet. Share your invite link to get started.
          </p>
        </div>
      )}
    </div>
  );
}
