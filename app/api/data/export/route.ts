import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/data/export
 * Pro only: exports all user data as a CSV zip-equivalent (multiple CSV sections in one file).
 * Returns a plain text response with sections separated by blank lines.
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check Pro plan
  const { data: profile } = await supabase
    .from("users")
    .select("plan, name, email")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Fetch all user data in parallel
  const [missionsRes, habitsRes, habitLogsRes, streamsRes, entriesRes, goalsRes, objectivesRes, reviewsRes] =
    await Promise.all([
      supabase.from("missions").select("*").order("date", { ascending: false }),
      supabase.from("habits").select("*").eq("archived", false),
      supabase.from("habit_logs").select("*").eq("completed", true).order("date", { ascending: false }),
      supabase.from("revenue_streams").select("*"),
      supabase.from("revenue_entries").select("*, revenue_streams(name)").order("date", { ascending: false }),
      supabase.from("goals").select("*"),
      supabase.from("objectives").select("*"),
      supabase.from("weekly_reviews").select("*").order("week_start", { ascending: false }),
    ]);

  const missions = missionsRes.data || [];
  const habits = habitsRes.data || [];
  const habitLogs = habitLogsRes.data || [];
  const streams = streamsRes.data || [];
  const entries = entriesRes.data || [];
  const goals = goalsRes.data || [];
  const objectives = objectivesRes.data || [];
  const reviews = reviewsRes.data || [];

  const lines: string[] = [];

  // ── Helper ──────────────────────────────────────────────────────────────
  const csv = (headers: string[], rows: string[][]): string => {
    const escape = (v: string) =>
      v.includes(",") || v.includes('"') || v.includes("\n")
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    return [
      headers.join(","),
      ...rows.map((r) => r.map((c) => escape(String(c ?? ""))).join(",")),
    ].join("\n");
  };

  // ── Export date ──────────────────────────────────────────────────────────
  lines.push(`AXIS Data Export | ${profile.name || profile.email}`);
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push("");

  // ── Missions ─────────────────────────────────────────────────────────────
  lines.push("=== MISSIONS ===");
  lines.push(
    csv(
      ["Date", "Title", "Priority", "Status", "Category"],
      missions.map((m) => [m.date, m.title, m.priority, m.status, m.category || ""])
    )
  );
  lines.push("");

  // ── Habits ───────────────────────────────────────────────────────────────
  lines.push("=== HABITS ===");
  lines.push(csv(["Name", "Icon"], habits.map((h) => [h.name, h.icon || ""])));
  lines.push("");

  // ── Habit Logs ───────────────────────────────────────────────────────────
  const habitMap = Object.fromEntries(habits.map((h) => [h.id, h.name]));
  lines.push("=== HABIT LOGS ===");
  lines.push(
    csv(
      ["Date", "Habit"],
      habitLogs.map((l) => [l.date, habitMap[l.habit_id] || l.habit_id])
    )
  );
  lines.push("");

  // ── Revenue Streams ───────────────────────────────────────────────────────
  lines.push("=== REVENUE STREAMS ===");
  lines.push(csv(["Name", "Color"], streams.map((s) => [s.name, s.color || ""])));
  lines.push("");

  // ── Revenue Entries ───────────────────────────────────────────────────────
  lines.push("=== REVENUE ENTRIES ===");
  lines.push(
    csv(
      ["Date", "Stream", "Amount", "Note"],
      entries.map((e) => [
        e.date,
        (e.revenue_streams as any)?.name || "",
        String(e.amount),
        e.note || "",
      ])
    )
  );
  lines.push("");

  // ── Goals ─────────────────────────────────────────────────────────────────
  lines.push("=== GOALS ===");
  lines.push(
    csv(
      ["Title", "Target", "Current", "Unit", "Deadline"],
      goals.map((g) => [
        g.title,
        String(g.target_value),
        String(g.current_value || 0),
        g.unit || "",
        g.deadline || "",
      ])
    )
  );
  lines.push("");

  // ── Objectives / Themes ──────────────────────────────────────────────────
  lines.push("=== THEMES ===");
  lines.push(
    csv(
      ["Title", "Type", "Target", "Unit", "Start", "Deadline"],
      objectives.map((objective) => [
        objective.title,
        objective.rollup_type,
        String(objective.target_value || ""),
        objective.unit || "",
        objective.start_date || "",
        objective.deadline || "",
      ])
    )
  );
  lines.push("");

  // ── Weekly Reviews ────────────────────────────────────────────────────────
  lines.push("=== WEEKLY REVIEWS ===");
  lines.push(
    csv(
      ["Week Start", "Wins", "Struggles", "Next Focus"],
      reviews.map((r) => [
        r.week_start,
        r.wins || "",
        r.struggles || "",
        r.next_week_focus || "",
      ])
    )
  );

  const content = lines.join("\n");
  const filename = `axis-export-${new Date().toISOString().split("T")[0]}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
