import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRateLimitSalt } from "@/lib/env";

type RateLimitScope = "email_otp_email" | "email_otp_ip";

type RateLimitCheck = {
  scope: RateLimitScope;
  key: string;
  limit: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: RateLimitScope;
};

const WINDOW_MS = 10 * 60 * 1000;
const EMAIL_OTP_EMAIL_LIMIT = 3;
const EMAIL_OTP_IP_LIMIT = 12;

function bucketStart(now = Date.now()) {
  return new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS).toISOString();
}

function secondsUntilWindowReset(now = Date.now()) {
  const windowEnd = Math.ceil((now + 1) / WINDOW_MS) * WINDOW_MS;
  return Math.max(1, Math.ceil((windowEnd - now) / 1000));
}

function hashKey(scope: RateLimitScope, key: string) {
  const salt = getRateLimitSalt();
  return createHash("sha256")
    .update(`${scope}:${salt}:${key}`)
    .digest("hex");
}

function normalizeIp(ip: string | null) {
  return (ip || "unknown").split(",")[0]?.trim().toLowerCase() || "unknown";
}

export function getClientIp(request: Request) {
  return normalizeIp(
    request.headers.get("x-forwarded-for")
      || request.headers.get("x-real-ip")
      || request.headers.get("cf-connecting-ip"),
  );
}

async function readAttemptCount(
  admin: SupabaseClient,
  check: RateLimitCheck,
  windowStart: string,
) {
  const { data, error } = await admin
    .from("auth_rate_limits")
    .select("attempt_count")
    .eq("scope", check.scope)
    .eq("key_hash", hashKey(check.scope, check.key))
    .eq("window_start", windowStart)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.attempt_count ?? 0);
}

async function incrementAttempt(
  admin: SupabaseClient,
  check: RateLimitCheck,
  windowStart: string,
) {
  const keyHash = hashKey(check.scope, check.key);
  const { data, error } = await admin
    .from("auth_rate_limits")
    .select("attempt_count")
    .eq("scope", check.scope)
    .eq("key_hash", keyHash)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const { error: updateError } = await admin
      .from("auth_rate_limits")
      .update({
        attempt_count: Number(data.attempt_count ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("scope", check.scope)
      .eq("key_hash", keyHash)
      .eq("window_start", windowStart);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await admin
    .from("auth_rate_limits")
    .insert({
      scope: check.scope,
      key_hash: keyHash,
      window_start: windowStart,
      attempt_count: 1,
      last_attempt_at: new Date().toISOString(),
    });

  if (insertError) throw insertError;
}

export async function checkEmailOtpRateLimit(
  admin: SupabaseClient,
  input: { email: string; ip: string },
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = bucketStart(now);
  const checks: RateLimitCheck[] = [
    { scope: "email_otp_email", key: input.email.toLowerCase(), limit: EMAIL_OTP_EMAIL_LIMIT },
    { scope: "email_otp_ip", key: normalizeIp(input.ip), limit: EMAIL_OTP_IP_LIMIT },
  ];

  try {
    for (const check of checks) {
      const count = await readAttemptCount(admin, check, windowStart);
      if (count >= check.limit) {
        return {
          allowed: false,
          retryAfterSeconds: secondsUntilWindowReset(now),
          reason: check.scope,
        };
      }
    }

    await Promise.all(checks.map((check) => incrementAttempt(admin, check, windowStart)));
    return { allowed: true };
  } catch (error) {
    // Fail open so auth is not taken down if the migration has not landed yet.
    console.warn("[rate-limit] email OTP rate limit unavailable", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true };
  }
}
