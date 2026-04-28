"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { IconPartners, IconCheck, IconPlus, IconCopy, IconStreak } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Squad {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

interface SquadMember {
  user_id: string;
  joined_at: string;
  users: { name: string | null; email: string };
}

interface MemberHeatmap {
  userId: string;
  displayName: string;
  initials: string;
  // last 7 days: "done" | "missed"
  week: ("done" | "missed")[];
  todayDone: boolean;
  streak: number;
}

// ── Heatmap cell ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HeatmapRow({ member }: { member: MemberHeatmap }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-3 rounded-2xl px-4 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4"
      style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
    >
      {/* Avatar */}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--bg-accent-soft)" }}
        >
          <span className="text-xs font-bold font-mono text-axis-accent">{member.initials}</span>
        </div>

        {/* Name + streak */}
        <div className="min-w-0 flex-1 sm:w-28 sm:flex-none">
          <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {member.displayName}
          </p>
          {member.streak > 0 && (
            <p className="text-[10px] font-mono flex items-center gap-1 text-orange-400">
              <IconStreak size={10} /> {member.streak}d streak
            </p>
          )}
        </div>
      </div>

      {/* 7-day heatmap */}
      <div className="grid w-full grid-cols-7 gap-1.5 sm:flex sm:flex-1 sm:items-center">
        {member.week.map((status, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-7 h-7 rounded-lg transition-all",
                status === "done"
                  ? "bg-axis-accent/80"
                  : "bg-white/[0.04] border border-white/[0.06]"
              )}
              title={DAY_LABELS[i]}
              style={
                status === "done"
                  ? { boxShadow: "0 0 8px rgba(205,255,79,0.3)" }
                  : undefined
              }
            />
            <span className="text-[8px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Today badge */}
      <div className="w-full sm:w-auto sm:flex-shrink-0">
        {member.todayDone ? (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-axis-accent/10 text-axis-accent px-2 py-1 rounded-lg border border-axis-accent/20">
            <IconCheck size={10} /> Done
          </span>
        ) : (
          <span
            className="text-[10px] font-mono px-2 py-1 rounded-lg"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
          >
            Pending
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { user } = useUser();

  const [squads, setSquads] = useState<Squad[]>([]);
  const [members, setMembers] = useState<MemberHeatmap[]>([]);
  const [loadingSquads, setLoadingSquads] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeSquad, setActiveSquad] = useState<Squad | null>(null);

  // Create squad form
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  // Join squad form
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // ── Fetch squads the user belongs to ───────────────────────────────────────
  const fetchSquads = useCallback(async () => {
    if (!user) return;
    setLoadingSquads(true);

    try {
      const res = await fetch("/api/squads", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load squads");
      setSquads(json.squads || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load squads.");
      setSquads([]);
    } finally {
      setLoadingSquads(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  // ── Fetch heatmap for active squad ────────────────────────────────────────
  const fetchHeatmap = useCallback(
    async (squadId: string) => {
      setLoadingMembers(true);

      try {
        const res = await fetch(`/api/squads/${squadId}/heatmap`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load squad grid");
        setMembers(json.members || []);
      } catch (error: any) {
        toast.error(error.message || "Failed to load squad grid.");
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeSquad) fetchHeatmap(activeSquad.id);
  }, [activeSquad, fetchHeatmap]);

  // Auto-select first squad
  useEffect(() => {
    if (squads.length > 0 && (!activeSquad || !squads.some((squad) => squad.id === activeSquad.id))) {
      setActiveSquad(squads[0]);
    } else if (squads.length === 0 && activeSquad) {
      setActiveSquad(null);
    }
  }, [squads, activeSquad]);

  // ── Create squad ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);

    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create squad");

      toast.success(`Squad "${json.squad.name}" created!`);
      setNewName("");
      setActiveSquad(json.squad);
      fetchSquads();
    } catch (error: any) {
      toast.error(error.message || "Failed to create squad.");
    } finally {
      setCreating(false);
    }
  };

  // ── Join squad ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    setJoining(true);

    try {
      const res = await fetch("/api/squads/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to join squad");

      if (json.already) {
        toast.info("You're already in this squad.");
      } else {
        toast.success(`Joined "${json.squad.name}"!`);
      }
      setInviteCode("");
      fetchSquads();
      setActiveSquad(json.squad);
    } catch (error: any) {
      toast.error(error.message || "Failed to join squad.");
    } finally {
      setJoining(false);
    }
  };

  // ── Leave squad ───────────────────────────────────────────────────────────
  const handleLeave = async (squadId: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/squads/${squadId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to leave squad");

      if (activeSquad?.id === squadId) setActiveSquad(null);
      toast.success("Left the squad.");
      fetchSquads();
    } catch (error: any) {
      toast.error(error.message || "Failed to leave squad.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-accent-soft)" }}
        >
          <IconPartners size={22} className="text-axis-accent" />
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            The Grid
          </h2>
          <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
            Social accountability | track your squad's daily consistency
          </p>
        </div>
      </div>

      {/* Create + Join row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create */}
        <div
          className="axis-card space-y-3"
          style={{ ["--tw-ring-color" as string]: "transparent" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Create a Squad
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Squad name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-axis-accent px-4 py-2 text-xs font-semibold text-axis-dark transition-all hover:bg-axis-accent/90 disabled:opacity-50 sm:w-auto"
            >
              <IconPlus size={12} /> Create
            </button>
          </div>
        </div>

        {/* Join */}
        <div className="axis-card space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Join via Invite Code
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Enter 8-char code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="min-w-0 flex-1 bg-transparent text-sm font-mono outline-none tracking-widest"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={handleJoin}
              disabled={joining || inviteCode.length !== 8}
              className="w-full rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 sm:w-auto"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Squad tabs */}
      {loadingSquads ? (
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="axis-skeleton h-9 w-28 rounded-xl" />
          ))}
        </div>
      ) : squads.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          <IconPartners size={32} className="mx-auto mb-3 text-axis-accent opacity-40" />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            No squads yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Create one above or enter an invite code from a friend.
          </p>
        </div>
      ) : (
        <>
          {/* Squad selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {squads.map((squad) => (
              <button
                key={squad.id}
                onClick={() => setActiveSquad(squad)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeSquad?.id === squad.id
                    ? "bg-axis-accent text-axis-dark"
                    : "text-white/50 hover:text-white/80"
                )}
                style={
                  activeSquad?.id !== squad.id
                    ? { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }
                    : undefined
                }
              >
                {squad.name}
              </button>
            ))}
          </div>

          {/* Active squad panel */}
          <AnimatePresence mode="wait">
            {activeSquad && (
              <motion.div
                key={activeSquad.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Squad meta */}
                <div
                  className="flex flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
                  style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {activeSquad.name}
                    </p>
                    <p
                      className="text-xs font-mono mt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div
                      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 sm:justify-start"
                      style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
                    >
                      <span
                        className="text-xs font-mono tracking-widest"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {activeSquad.invite_code}
                      </span>
                      <button
                        onClick={() => copyCode(activeSquad.invite_code)}
                        className="text-axis-accent hover:opacity-80 transition-opacity"
                      >
                        <IconCopy size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleLeave(activeSquad.id)}
                      className="w-full rounded-xl px-3 py-2 text-xs font-mono transition-colors sm:w-auto"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.08)",
                        color: "rgb(248,113,113)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Heatmap grid */}
                <div className="space-y-2">
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest px-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Habit Consistency | Last 7 Days
                  </p>
                  {loadingMembers ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="axis-skeleton h-16 rounded-2xl" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <p
                      className="text-sm text-center py-8"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      No members yet | share the invite code!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m) => (
                        <HeatmapRow key={m.userId} member={m} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
