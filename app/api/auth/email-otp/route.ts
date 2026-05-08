import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmailOtpEmail, resend as resendClient } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

type Mode = "login" | "signup" | "auto";

function isMode(value: unknown): value is Mode {
  return value === "login" || value === "signup" || value === "auto";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function friendlyError(message: string, mode: Mode) {
  if (/social login/i.test(message)) {
    return "Dieses Konto nutzt Google. Bitte melde dich mit Google an.";
  }

  if (mode === "login") {
    return "Fuer diese E-Mail wurde kein Konto gefunden.";
  }

  return "Der Code konnte gerade nicht gesendet werden. Bitte versuch es gleich nochmal.";
}

/**
 * Send the OTP using our own Resend template. Returns true on success.
 * Logs server-side on failure so triage shows up in Vercel logs.
 */
async function trySendViaResend(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  mode: Mode,
  name: string,
  accountExists: boolean,
): Promise<{ ok: boolean; verificationType?: EmailOtpType }> {
  if (!resendClient) {
    console.warn("[email-otp] Resend not configured — falling back to Supabase native");
    return { ok: false };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: !accountExists && name ? { data: { full_name: name, name } } : undefined,
  });

  if (error || !data?.properties?.email_otp || !data.properties.verification_type) {
    console.error("[email-otp] generateLink failed", { error: error?.message });
    return { ok: false };
  }

  try {
    await sendEmailOtpEmail(email, data.properties.email_otp, { mode });
    return {
      ok: true,
      verificationType: data.properties.verification_type as EmailOtpType,
    };
  } catch (err) {
    console.error("[email-otp] Resend send failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false };
  }
}

/**
 * Fallback: ask Supabase to send the OTP from its own email pipeline.
 * Requires SMTP to be configured in the Supabase Auth dashboard (or relies on
 * the Supabase hosted email service for low-volume / dev). Either way, this
 * keeps auth working when our custom Resend setup is misconfigured.
 */
async function trySendViaSupabase(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  accountExists: boolean,
  name: string,
): Promise<{ ok: boolean; verificationType?: EmailOtpType; error?: string }> {
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: !accountExists,
      data: !accountExists && name ? { full_name: name, name } : undefined,
    },
  });
  if (error) {
    console.error("[email-otp] Supabase fallback failed", { message: error.message });
    return { ok: false, error: error.message };
  }
  return { ok: true, verificationType: "email" as EmailOtpType };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const name = normalizeName(body?.name);
    const mode: Mode = isMode(body?.mode) ? body.mode : "auto";

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gueltige E-Mail-Adresse ein." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: existingProfile, error: profileError } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("[email-otp] users lookup failed", { message: profileError.message });
      return NextResponse.json(
        { error: "Die Anmeldung konnte gerade nicht vorbereitet werden." },
        { status: 500 },
      );
    }

    const accountExists = Boolean(existingProfile);

    if (mode === "login" && !accountExists) {
      return NextResponse.json({ error: friendlyError("not_found", mode) }, { status: 404 });
    }

    // Path 1: try Resend with our custom template
    const resendResult = await trySendViaResend(admin, email, mode, name, accountExists);
    if (resendResult.ok) {
      return NextResponse.json({
        ok: true,
        verificationType: resendResult.verificationType ?? "email",
        accountExists,
        channel: "resend",
      });
    }

    // Path 2: fall back to Supabase's email pipeline
    const supabaseResult = await trySendViaSupabase(admin, email, accountExists, name);
    if (supabaseResult.ok) {
      return NextResponse.json({
        ok: true,
        verificationType: supabaseResult.verificationType ?? "email",
        accountExists,
        channel: "supabase",
      });
    }

    return NextResponse.json(
      {
        error:
          "Der Code konnte gerade nicht gesendet werden. Bitte versuch es gleich nochmal oder nutze Google-Login.",
      },
      { status: 502 },
    );
  } catch (err) {
    console.error("[email-otp] unhandled", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Die Anmeldung konnte gerade nicht vorbereitet werden." },
      { status: 500 },
    );
  }
}
