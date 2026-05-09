import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { sendPushToUser } from "@/lib/push";
import { getUserLocalContext, isInLocalHourWindow } from "@/lib/cron-tz";

const TARGET_LOCAL_HOUR_START = 19;
const TARGET_LOCAL_HOUR_END = 21;

/**
 * GET /api/cron/weekly-review-push
 *
 * Runs hourly. On the user's local Sunday between 19:00 and 21:00, sends a
 * push reminder to open the weekly review. Email-based weekly digest already
 * fires at 10-12 local on Sunday; this is the evening companion that nudges
 * the user back into the app to actually fill in the review (the digest is
 * read-only history, the review is interactive).
 *
 * Idempotent: per-user `last_review_push_on` stamp gates by local-date.
 * Only fires for users with at least one push subscription.
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

  const { data: allUsers } = await admin
    .from("users")
    .select("id, name, timezone, last_review_push_on")
    .eq("onboarding_done", true);

  if (!allUsers?.length) return NextResponse.json({ pushed: 0, eligible: 0 });

  const eligible = allUsers
    .map((u) => ({ user: u, ctx: getUserLocalContext(u.timezone, now) }))
    .filter(({ user, ctx }) =>
      ctx.dow === 0 &&
      isInLocalHourWindow(ctx, TARGET_LOCAL_HOUR_START, TARGET_LOCAL_HOUR_END) &&
      user.last_review_push_on !== ctx.dateIso,
    );

  if (eligible.length === 0) return NextResponse.json({ pushed: 0, eligible: 0 });

  let pushed = 0;
  let stamped = 0;

  for (const { user, ctx } of eligible) {
    try {
      const delivered = await sendPushToUser(user.id, {
        title: "Deine Woche in 60 Sekunden",
        body: `${user.name || "Hey"} — 7 Tage durch. Schreib in einer Minute, was lief und was nicht.`,
        url: "/review",
        tag: "weekly-review-push",
      });
      if (delivered > 0) pushed++;
    } catch (err) {
      console.warn("[weekly-review-push] failed", { userId: user.id, err });
    }

    await admin
      .from("users")
      .update({ last_review_push_on: ctx.dateIso })
      .eq("id", user.id);
    stamped++;
  }

  return NextResponse.json({ pushed, stamped, eligible: eligible.length });
}
