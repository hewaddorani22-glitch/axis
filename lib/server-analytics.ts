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

export async function recordServerEvent(input: ServerAnalyticsInput) {
  try {
    await createAdminClient().from("analytics_events").insert({
      event_name: input.event,
      user_id: input.userId ?? null,
      anon_id: input.anonId ?? null,
      session_id: input.sessionId ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      props: input.props ?? {},
    });
  } catch (error) {
    console.warn("Analytics event skipped:", error);
  }
}
