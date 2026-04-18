"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
      className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-colors"
      style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--bg-accent-soft)" }}
      >
        <span className="text-xs font-bold font-mono text-axis-accent">{member.initials}</span>
      </div>

      {/* Name + streak */}
      <div className="w-28 flex-shrink-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {member.displayName}
        </p>
        {member.streak > 0 && (
          <p className="text-[10px] font-mono flex items-center gap-1 text-orange-400">
            <IconStreak size={10} /> {member.streak}d streak
          </p>
        )}
      </div>

      {/* 7-day heatmap */}
      <div className="flex items-center gap-1.5 flex-1">
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
      <div className="flex-shrink-0">
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
  const supabase = createClient();

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

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    const groupIds = memberships?.map((m) => m.group_id) || [];
    if (groupIds.length === 0) {
      setSquads([]);
      setLoadingSquads(false);
      return;
    }

    const { data } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    setSquads((data as Squad[]) || []);
    setLoadingSquads(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  // ── Fetch heatmap for active squad ────────────────────────────────────────
  const fetchHeatmap = useCallback(
    async (squadId: string) => {
      setLoadingMembers(true);

      // Get members + user info
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("user_id, joined_at, users(name, email)")
        .eq("group_id", squadId);

      if (!memberRows || memberRows.length === 0) {
        setMembers([]);
        setLoadingMembers(false);
        return;
      }

      const userIds = memberRows.map((m: any) => m.user_id);

      // Last 7 days date range
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      // Get habit logs (only completion status, no revenue)
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("user_id, date, completed")
        .in("user_id", userIds)
        .gte("date", weekAgoStr)
        .lte("date", todayStr)
        .eq("completed", true);

      // Build heatmap per member
      const heatmapData: MemberHeatmap[] = memberRows.map((row: any) => {
        const uid = row.user_id;
        const userInfo = row.users as { name: string | null; email: string };
        const displayName =
          userInfo?.name || userInfo?.email?.split("@")[0] || "User";
        const initials = displayName.charAt(0).toUpperCase();

        const userLogs = logs?.filter((l) => l.user_id === uid) || [];
        const logDates = new Set(userLogs.map((l) => l.date));

        // Build 7-day week array (Mon-Sun aligned to last 7 days)
        const week: ("done" | "missed")[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          week.push(logDates.has(ds) ? "done" : "missed");
        }

        // Streak: consecutive days up to today
        let streak = 0;
        for (let i = 0; i < 60; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          if (logDates.has(ds)) {
            streak++;
          } else {
            break;
          }
        }

        return {
          userId: uid,
          displayName,
          initials,
          week,
          todayDone: logDates.has(todayStr),
          streak,
        };
      });

      // Sort: today-done first, then by streak
      heatmapData.sort((a, b) => {
        if (a.todayDone !== b.todayDone) return a.todayDone ? -1 : 1;
        return b.streak - a.streak;
      });

      setMembers(heatmapData);
      setLoadingMembers(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (activeSquad) fetchHeatmap(activeSquad.id);
  }, [activeSquad, fetchHeatmap]);

  // Auto-select first squad
  useEffect(() => {
    if (squads.length > 0 && !activeSquad) {
      setActiveSquad(squads[0]);
    }
  }, [squads]);

  // ── Create squad ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("groups")
      .insert({ name: newName.trim(), created_by: user.id })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create squad.");
      setCreating(false);
      return;
    }

    await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id });
    toast.success(`Squad "${data.name}" created!`);
    setNewName("");
    setCreating(false);
    fetchSquads();
  };

  // ── Join squad ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    setJoining(true);

    const { data: group } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (!group) {
      toast.error("Invalid invite code.");
      setJoining(false);
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    if (error?.code === "23505") {
      toast.info("You're already in this squad.");
    } else if (error) {
      toast.error("Failed to join squad.");
    } else {
      toast.success(`Joined "${group.name}"!`);
      setInviteCode("");
      fetchSquads();
    }
    setJoining(false);
  };

  // ── Leave squad ───────────────────────────────────────────────────────────
  const handleLeave = async (squadId: string) => {
    if (!user) return;
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", squadId)
      .eq("user_id", user.id);

    if (activeSquad?.id === squadId) setActiveSquad(null);
    toast.success("Left the squad.");
    fetchSquads();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Squad name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold bg-axis-accent text-axis-dark px-4 py-2 rounded-xl hover:bg-axis-accent/90 transition-all disabled:opacity-50"
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 8-char code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="flex-1 bg-transparent text-sm font-mono outline-none tracking-widest"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={handleJoin}
              disabled={joining || inviteCode.length !== 8}
              className="text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
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
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
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
                      className="text-xs font-mono px-3 py-2 rounded-xl transition-colors"
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
