import { NextResponse } from "next/server";
import { getCronSecret, getResendApiKey, getStripeSecretKey, getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type HealthCheck = {
  name: string;
  ok: boolean;
  message?: string;
};

function isAuthorized(request: Request) {
  const secret = getCronSecret();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function checkSupabase(): Promise<HealthCheck> {
  try {
    const { error } = await createAdminClient()
      .from("users")
      .select("id", { count: "exact", head: true })
      .limit(1);

    return { name: "supabase", ok: !error, message: error?.message };
  } catch (error) {
    return {
      name: "supabase",
      ok: false,
      message: error instanceof Error ? error.message : "unknown",
    };
  }
}

export async function GET(request: Request) {
  const checks: HealthCheck[] = [
    { name: "env.supabase_url", ok: Boolean(getSupabaseUrl()) },
    { name: "env.supabase_anon", ok: Boolean(getSupabaseAnonKey()) },
    { name: "env.supabase_service_role", ok: Boolean(getSupabaseServiceRoleKey()) },
    { name: "env.resend", ok: Boolean(getResendApiKey()) },
    { name: "env.stripe", ok: Boolean(getStripeSecretKey()) },
    await checkSupabase(),
  ];

  const ok = checks.every((check) => check.ok);
  const detailed = isAuthorized(request);

  return NextResponse.json(
    detailed ? { ok, checks } : { ok },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
