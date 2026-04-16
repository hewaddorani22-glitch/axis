"use client";

import { useState } from "react";
import { IconPartners, IconNudge, IconCheck, IconWarning, IconStreak } from "@/components/icons";

interface Partner {
  id: number;
  name: string;
  avatar: string;
  streak: number;
  grade: string;
  missionsToday: string;
  habitsToday: string;
  focusScore: number;
  status: "onfire" | "solid" | "falling";
  lastActive: string;
}

const demoPartners: Partner[] = [
  {
    id: 1,
    name: "Alex Rivera",
    avatar: "AR",
    streak: 23,
    grade: "A+",
    missionsToday: "5/5",
    habitsToday: "3/3",
    focusScore: 94,
    status: "onfire",
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "Maya Johnson",
    avatar: "MJ",
    streak: 8,
    grade: "B+",
    missionsToday: "3/4",
    habitsToday: "2/3",
    focusScore: 72,
    status: "solid",
    lastActive: "5 hours ago",
  },
];

const statusConfig = {
  onfire: { label: "On fire", color: "text-orange-500", bg: "bg-orange-500/10", icon: <IconStreak size={12} className="text-orange-500" /> },
  solid: { label: "Solid", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <IconCheck size={12} className="text-emerald-500" /> },
  falling: { label: "Falling off", color: "text-red-500", bg: "bg-red-500/10", icon: <IconWarning size={12} className="text-red-500" /> },
};

export default function PartnersPage() {
  const [partners] = useState<Partner[]>(demoPartners);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Function to simulate sending a nudge
  const handleNudge = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    alert(`Nudge sent to ${partner.name}!`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Partner cards */}
      <div className="space-y-4">
        {partners.map((partner) => {
          const status = statusConfig[partner.status];
          return (
            <div
              key={partner.id}
              className="axis-card cursor-pointer"
              onClick={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                  <span className="text-sm font-bold font-mono text-axis-accent">{partner.avatar}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{partner.name}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md ${status.bg} ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    Last active {partner.lastActive}
                  </p>
                </div>

                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{partner.grade}</p>
                    <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>GRADE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-500">{partner.streak}</p>
                    <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>STREAK</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-axis-accent">{partner.focusScore}</p>
                    <p className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>FOCUS</p>
                  </div>
                </div>
              </div>

              {/* Expanded comparison view */}
              {selectedPartner?.id === partner.id && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border-primary)" }}>
                  <p className="text-xs font-mono mb-4 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>You vs {partner.name}</p>

                  <div className="space-y-4">
                    {/* Missions comparison */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Missions Today</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-axis-accent">You: 4/5</span>
                          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{partner.name.split(" ")[0]}: {partner.missionsToday}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                        <div className="bg-axis-accent rounded-full" style={{ width: "80%" }} />
                        <div className="rounded-full flex-1" style={{ backgroundColor: "var(--bg-tertiary)" }} />
                      </div>
                    </div>

                    {/* Habits comparison */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Habits Today</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-axis-accent">You: 2/3</span>
                          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{partner.name.split(" ")[0]}: {partner.habitsToday}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                        <div className="bg-axis-accent rounded-full" style={{ width: "67%" }} />
                        <div className="rounded-full flex-1" style={{ backgroundColor: "var(--bg-tertiary)" }} />
                      </div>
                    </div>

                    {/* Focus Score comparison */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Focus Score</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-axis-accent">You: 87</span>
                          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{partner.name.split(" ")[0]}: {partner.focusScore}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                        <div className="bg-axis-accent rounded-full" style={{ width: "87%" }} />
                        <div className="rounded-full flex-1" style={{ backgroundColor: "var(--bg-tertiary)" }} />
                      </div>
                    </div>
                  </div>

                  {/* Nudge button */}
                  <button
                    onClick={(e) => handleNudge(e, partner)}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                    style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    <IconNudge size={14} className="text-axis-accent" />
                    Send Nudge
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite CTA */}
      <div
        className="rounded-2xl p-8 text-center transition-colors"
        style={{ border: "2px dashed var(--border-primary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <IconPartners size={24} className="text-axis-accent" />
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Invite a Partner</h3>
        <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color: "var(--text-tertiary)" }}>
          Share your invite link and hold each other accountable.
        </p>
        <button className="bg-axis-accent text-axis-dark text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-axis-accent/90 transition-all">
          Copy Invite Link
        </button>
      </div>
    </div>
  );
}
