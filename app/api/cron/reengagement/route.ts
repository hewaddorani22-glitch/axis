import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReengagementEmail } from "@/lib/resend";
import { getCronSecret } from "@/lib/env";
import { getUserLocalContext, isInLocalHourWindow } from "@/lib/cron-tz";

const TARGET_LOCAL_HOUR_START = 12;
const TARGET_LOCAL_HOUR_END = 14;

/**
 * GET /api/cron/reengagement
 *
 * Runs hourly. Sends Day 1 / 3 / 7 / 14 / 30 reengagement emails to users
 * who signed up that many days ago and look inactive.
 *
 * Trigger window: 12:00 - 14:00 LOCAL time. Open rates peak around lunch.
 *
 * "Inactive" heuristic per variant (lookback in days, threshold of completed missions):
 *   day1   — fewer than 1 completed mission since signup
 *   day3   — fewer than 3 completed missions in last 3 days
 *   day7   — fewer than 5 completed missions in last 7 days
 *   day14  — zero activity in the last 7 days (proper lapse signal)
 *   day30  — zero activity in the last 14 days (last-chance ping)
 *
 * Idempotency: per-user `last_reengagement_on` stamp gates by local-date so
 * the hourly cron never double-sends, even if multiple variants would match
 * on the same day (only the first matching variant fires).
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
  const now = new Date();
  const dayMs = 86_400_000;

  type Variant = {
    name: "day1" | "day3" | "day7" | "day14" | "day30";
    days: number;          // age of cohort, in days since signup
    lookbackDays: number;  // how far back to check activity
    threshold: number;     // send if completed missions < threshold
  };

  const VARIANTS: Variant[] = [
    { name: "day1", days: 1, lookbackDays: 1, threshold: 1 },
    { name: "day3", days: 3, lookbackDays: 3, threshold: 3 },
    { name: "day7", days: 7, lookbackDays: 7, threshold: 5 },
    { name: "day14", days: 14, lookbackDays: 7, threshold: 1 },
    { name: "day30", days: 30, lookbackDays: 14, threshold: 1 },
  ];

  // We over-fetch one cohort at a time and let the local-hour filter trim.
  let totalSent = 0;
  const breakdown: Record<string, number> = {};

  for (const v of VARIANTS) {
    // Window: signed up exactly v.days ago (24h slice).
    const startIso = new Date(now.getTime() - (v.days + 1) * dayMs).toISOString();
    const endIso = new Date(now.getTime() - v.days * dayMs).toISOString();

    const { data: cohort } = await admin
      .from("users")
      .select("id, email, name, timezone, last_reengagement_on")
      .gte("created_at", startIso)
      .lt("created_at", endIso);

    if (!cohort?.length) {
      breakdown[v.name] = 0;
      continue;
    }

    // Filter by local-time-window AND not-yet-stamped-today.
    const eligible = cohort
      .map((u) => ({ user: u, ctx: getUserLocalContext(u.timezone, now) }))
      .filter(
        ({ user, ctx }) =>
          isInLocalHourWindow(ctx, TARGET_LOCAL_HOUR_START, TARGET_LOCAL_HOUR_END) &&
          user.last_reengagement_on !== ctx.dateIso,
      );

    if (eligible.length === 0) {
      breakdown[v.name] = 0;
      continue;
    }

    const ids = eligible.map(({ user }) => user.id);
    const sinceIso = new Date(now.getTime() - v.lookbackDays * dayMs).toISOString().split("T")[0];

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

    let sent = 0;
    for (const { user, ctx } of eligible) {
      if ((doneCount.get(user.id) ?? 0) >= v.threshold) {
        // User is active enough — stamp anyway so we don't reconsider every hour.
        await admin
          .from("users")
          .update({ last_reengagement_on: ctx.dateIso })
          .eq("id", user.id);
        continue;
      }
      if (!user.email) continue;

      try {
        await sendReengagementEmail(user.email, user.name ?? "", v.name);
        sent++;
      } catch (err) {
        console.error("[reengagement] send failed", { userId: user.id, variant: v.name, err });
      }

      await admin
        .from("users")
        .update({ last_reengagement_on: ctx.dateIso })
        .eq("id", user.id);
    }

    breakdown[v.name] = sent;
    totalSent += sent;
  }

  return NextResponse.json({ sent: totalSent, breakdown });
}
