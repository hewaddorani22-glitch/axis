import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

type AnalyticsPayload = {
  event?: string;
  props?: Record<string, unknown>;
  path?: string | null;
  referrer?: string | null;
  anonId?: string | null;
  sessionId?: string | null;
};

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const payload = JSON.parse(raw || "{}") as AnalyticsPayload;
    const event = payload.event?.trim();

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await createAdminClient().from("analytics_events").insert({
      event_name: event.slice(0, 120),
      user_id: user?.id ?? null,
      anon_id: payload.anonId ?? null,
      session_id: payload.sessionId ?? null,
      path: payload.path ?? null,
      referrer: payload.referrer ?? null,
      props: payload.props ?? {},
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("Analytics ingest skipped:", error);
    return NextResponse.json({ ok: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
}
