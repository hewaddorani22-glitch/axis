import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateFocusScore } from "@/lib/scoring";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { getAppUrl, getCronSecret } from "@/lib/env";
import { sendPushToUser } from "@/lib/push";
import { getUserLocalContext, isInLocalHourWindow } from "@/lib/cron-tz";

const TARGET_LOCAL_HOUR_START = 7;
const TARGET_LOCAL_HOUR_END = 9;

/**
 * GET /api/cron/morning-briefing
 * Runs hourly. Sends to users whose local time is between 7 and 9 and who have
 * not received the briefing yet on their local date today.
 *
 * Email contains:
 * - Yesterday's grade + key stats
 * - Current streak (with milestone callout)
 * - Today's missions (pre-loaded from yesterday's incomplete or user's template)
 * - Partner comparison if they have active partners
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

  if (!resend) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Pull every onboarded user, then filter in-process by local-hour window.
  // We could do this in SQL with `now() AT TIME ZONE u.timezone` but JS gives
  // us a single source of truth shared with all the other cron jobs.
  const { data: allUsers } = await admin
    .from("users")
    .select("id, email, name, plan, timezone, last_morning_briefing_on")
    .eq("onboarding_done", true);

  if (!allUsers?.length) return NextResponse.json({ sent: 0, eligible: 0 });

  const eligible = allUsers
    .map((u) => ({ user: u, ctx: getUserLocalContext(u.timezone, now) }))
    .filter(({ user, ctx }) =>
      isInLocalHourWindow(ctx, TARGET_LOCAL_HOUR_START, TARGET_LOCAL_HOUR_END) &&
      user.last_morning_briefing_on !== ctx.dateIso,
    );

  if (eligible.length === 0) return NextResponse.json({ sent: 0, eligible: 0 });

  const users = eligible.map(({ user }) => user);
  const localDateByUser = new Map(eligible.map(({ user, ctx }) => [user.id, ctx.dateIso]));
  const userIds = users.map((u) => u.id);

  // Per-user "yesterday" derived from the user's local date minus one day. This
  // matters for users in far-east timezones whose UTC-yesterday and local-yesterday
  // are actually two different calendar dates.
  const yesterdayByUser = new Map(
    eligible.map(({ user, ctx }) => {
      const d = new Date(`${ctx.dateIso}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      return [user.id, d.toISOString().split("T")[0]];
    }),
  );
  const allYesterdays = Array.from(new Set(yesterdayByUser.values()));

  // Fetch yesterday's activity. We pull both yesterdays observed in the cohort
  // (most cohorts will land on the same day; far-east users may add a 2nd) and
  // filter per-user below.
  const [yesterdayMissionsRes, yesterdayHabitLogsRes, streakMissionsRes, streakHabitLogsRes] =
    await Promise.all([
      admin
        .from("missions")
        .select("user_id, status, date")
        .in("user_id", userIds)
        .in("date", allYesterdays),
      admin
        .from("habit_logs")
        .select("user_id, date")
        .in("user_id", userIds)
        .in("date", allYesterdays)
        .eq("completed", true),
      // Last 90 days for streak calc
      admin
        .from("missions")
        .select("user_id, date")
        .in("user_id", userIds)
        .eq("status", "done")
        .gte("date", daysAgo(90)),
      admin
        .from("habit_logs")
        .select("user_id, date")
        .in("user_id", userIds)
        .eq("completed", true)
        .gte("date", daysAgo(90)),
    ]);

  const yMissions = yesterdayMissionsRes.data || [];
  const yHabits = yesterdayHabitLogsRes.data || [];
  const allMissions = streakMissionsRes.data || [];
  const allHabits = streakHabitLogsRes.data || [];

  let sent = 0;
  let pushed = 0;
  let stamped = 0;

  for (const user of users) {
    const uid = user.id;
    const localDate = localDateByUser.get(uid);
    if (!localDate) continue;

    // Yesterday's stats — filter on the user's *local* yesterday.
    const userYesterday = yesterdayByUser.get(uid);
    const userYMissions = yMissions.filter((m) => m.user_id === uid && m.date === userYesterday);
    const yDone = userYMissions.filter((m) => m.status === "done").length;
    const yTotal = userYMissions.length;
    const yHabitsDone = yHabits.filter((h) => h.user_id === uid && h.date === userYesterday).length;

    // Streak
    const mDates = new Set(allMissions.filter((m) => m.user_id === uid).map((m) => m.date));
    const hDates = new Set(allHabits.filter((h) => h.user_id === uid).map((h) => h.date));
    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const d = daysAgo(i);
      if (mDates.has(d) && hDates.has(d)) streak++;
      else break;
    }

    // Skip if no activity at all (new user with no data) but still stamp so we
    // don't reconsider this user every hour for the rest of the day.
    if (yTotal === 0 && streak === 0) {
      await admin.from("users").update({ last_morning_briefing_on: localDate }).eq("id", uid);
      stamped++;
      continue;
    }

    const score = calculateFocusScore({
      missionsCompleted: yDone,
      missionsTotal: Math.max(yTotal, 1),
      habitsCompleted: yHabitsDone,
      habitsTotal: Math.max(yHabitsDone, 1),
      streakDays: streak,
    });

    // Streak milestone message
    let streakMsg = "";
    if (streak === 7) streakMsg = "You just hit 7 days. Keep that fire going.";
    else if (streak === 14) streakMsg = "14 days straight. You're building something real.";
    else if (streak === 30) streakMsg = "30-DAY STREAK. Most people never get here.";
    else if (streak === 60) streakMsg = "60 days. You are the system.";
    else if (streak === 90) streakMsg = "90 days. Legendary. Don't stop.";
    else if (streak >= 7) streakMsg = `${30 - streak > 0 ? `${30 - streak} more days to 30` : `${streak} days and counting`}. Don't break it.`;
    else if (streak > 0) streakMsg = `Day ${streak}. Keep showing up.`;
    else streakMsg = "Start your streak today: complete one mission and one habit.";

    const name = user.name || "there";
    const appUrl = getAppUrl();

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Morning, ${name} | ${score.grade} yesterday. Today's your chance.`,
        html: `
          <div style="font-family: 'Outfit', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #FAFAFA;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; color: #0B0B0F;">lomoura</span>
            </div>

            <!-- Greeting -->
            <h1 style="font-size: 22px; font-weight: 700; color: #0B0B0F; margin: 0 0 6px 0;">
              Good morning, ${name}.
            </h1>
            <p style="font-size: 14px; color: #71717A; margin: 0 0 28px 0;">
              Here's where you stand. Make today count.
            </p>

            <!-- Yesterday's scorecard -->
            <div style="background: #0B0B0F; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
              <p style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">
                YESTERDAY
              </p>
              <div style="display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap;">
                <div>
                  <span style="font-size: 48px; font-weight: 800; color: #CDFF4F; line-height: 1;">${score.grade}</span>
                  <p style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); margin: 4px 0 0 0; text-transform: uppercase;">Grade</p>
                </div>
                <div>
                  <span style="font-size: 24px; font-weight: 700; color: white;">${yDone}/${yTotal}</span>
                  <p style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); margin: 4px 0 0 0; text-transform: uppercase;">Missions</p>
                </div>
                <div>
                  <span style="font-size: 24px; font-weight: 700; color: #F97316;">${streak}</span>
                  <p style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); margin: 4px 0 0 0; text-transform: uppercase;">Day Streak</p>
                </div>
                <div>
                  <span style="font-size: 24px; font-weight: 700; color: #CDFF4F;">${score.focusScore}</span>
                  <p style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); margin: 4px 0 0 0; text-transform: uppercase;">Focus</p>
                </div>
              </div>
            </div>

            <!-- Streak message -->
            <div style="background: white; border: 1px solid #E4E4E7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #0B0B0F; margin: 0; line-height: 1.5;">
                ${streakMsg}
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${appUrl}/dashboard"
                style="display: inline-block; background: #0B0B0F; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: -0.2px;">
                Open Dashboard
              </a>
            </div>

            <!-- Footer -->
            <p style="text-align: center; font-size: 12px; color: #A1A1AA; margin: 0;">
              lomoura | Missions, habits, revenue, goals
              <a href="${appUrl}/settings" style="color: #A1A1AA;">Manage preferences</a>
            </p>
          </div>
        `,
      });
      sent++;
    } catch {
      // Non-fatal per user
    }

    // Push: short, punchy, separate from email so silent users still see it.
    try {
      const pushBody =
        streak > 0
          ? `Tag ${streak} 🔥 — was zählt heute?`
          : "Setz heute deinen ersten Streak.";
      const delivered = await sendPushToUser(uid, {
        title: `Guten Morgen, ${name}`,
        body: pushBody,
        url: "/dashboard",
        tag: "morning-briefing",
      });
      if (delivered > 0) pushed++;
    } catch {
      // Non-fatal — email is still the primary channel
    }

    // Stamp last-sent-on with the user's local date so a re-run within the
    // same hour does not double-send.
    await admin.from("users").update({ last_morning_briefing_on: localDate }).eq("id", uid);
    stamped++;
  }

  return NextResponse.json({ sent, pushed, stamped, eligible: users.length });
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
