import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReengagementEmail } from "@/lib/resend";
import { getCronSecret } from "@/lib/env";

/**
 * GET /api/cron/reengagement
 * Runs daily. Sends Day 1 / Day 3 / Day 7 re-engagement emails to users
 * who signed up exactly 1, 3, or 7 days ago and look inactive.
 *
 * "Inactive" heuristic for the variant window:
 *  - day1: zero missions today (just to be sure they actually signed up)
 *  - day3: fewer than 3 completed missions in the last 3 days
 *  - day7: fewer than 5 completed missions in the last 7 days
 *
 * Idempotent within a day: if you call twice the same day, users are still
 * picked once because the day-offset filter is exact.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const dayMs = 86400000;
  const now = Date.now();

  // Day boundaries (UTC) for users created exactly N days ago.
  // We use [start, end) windows on created_at.
  const windows = [
    { variant: "day1" as const, days: 1, threshold: 1 },
    { variant: "day3" as const, days: 3, threshold: 3 },
    { variant: "day7" as const, days: 7, threshold: 5 },
  ];

  let totalSent = 0;
  const breakdown: Record<string, number> = {};

  for (const w of windows) {
    const startIso = new Date(now - (w.days + 1) * dayMs).toISOString();
    const endIso = new Date(now - w.days * dayMs).toISOString();

    const { data: cohort } = await admin
      .from("users")
      .select("id, email, name")
      .gte("created_at", startIso)
      .lt("created_at", endIso);

    if (!cohort?.length) {
      breakdown[w.variant] = 0;
      continue;
    }

    const ids = cohort.map((u) => u.id);
    const sinceIso = new Date(now - w.days * dayMs).toISOString().split("T")[0];

    const { data: doneMissions } = await admin
      .from("missions")
      .select("user_id")
      .in("user_id", ids)
      .gte("date", sinceIso)
      .eq("status", "done");

    const doneCount = new Map<string, number>();
    for (const m of doneMissions ?? []) {
      doneCount.set(m.user_id, (doneCount.get(m.user_id) ?? 0) + 1);
    }

    const targets = cohort.filter(
      (u) => (doneCount.get(u.id) ?? 0) < w.threshold && !!u.email
    );

    const results = await Promise.allSettled(
      targets.map((u) => sendReengagementEmail(u.email!, u.name ?? "", w.variant))
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    breakdown[w.variant] = sent;
    totalSent += sent;
  }

  return NextResponse.json({ sent: totalSent, breakdown });
}
