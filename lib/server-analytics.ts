import { createAdminClient } from "@/lib/supabase/admin";

type ServerAnalyticsInput = {
  event: string;
  userId?: string | null;
  anonId?: string | null;
  sessionId?: string | null;
  path?: string | null;
  referrer?: string | null;
  props?: Record<string, unknown>;
};

/**
 * Persist a single analytics event to public.analytics_events.
 *
 * Why this is more defensive than a one-shot insert: the analytics_events
 * table has a foreign-key on user_id → public.users. Before the prod fix on
 * 2026-05-10 the wrong handle_new_user() trigger never created the
 * public.users row, so every server-side signup_completed call landed on a
 * dangling FK and got silently swallowed (1 of 36 reached the table). After
 * the fix, the trigger creates the row first, but in the rare race where the
 * trigger lags the callback call, we still want the event recorded — so on
 * FK violation we retry once without user_id rather than dropping the event.
 */
export async function recordServerEvent(input: ServerAnalyticsInput) {
  const admin = createAdminClient();
  const payload = {
    event_name: input.event,
    user_id: input.userId ?? null,
    anon_id: input.anonId ?? null,
    session_id: input.sessionId ?? null,
    path: input.path ?? null,
    referrer: input.referrer ?? null,
    props: input.props ?? {},
  } as const;

  const { error } = await admin.from("analytics_events").insert(payload);
  if (!error) return;

  // 23503 = foreign_key_violation. Most likely cause: user.id is not yet in
  // public.users when this fires (race with the auth-user-created trigger).
  // Retry without user_id so the event is still captured for funnel analysis.
  const isFkViolation =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23503";

  if (isFkViolation && payload.user_id) {
    const { error: retryError } = await admin.from("analytics_events").insert({
      ...payload,
      user_id: null,
      props: { ...payload.props, fk_orphan_user_id: payload.user_id },
    });
    if (retryError) {
      console.warn("Analytics event lost (retry failed):", input.event, retryError);
    } else {
      console.warn("Analytics event recorded as anon (FK orphan):", input.event);
    }
    return;
  }

  console.warn("Analytics event skipped:", input.event, error);
}
