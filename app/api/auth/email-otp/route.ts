import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmailOtpEmail, resend as resendClient } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

type Mode = "login" | "signup" | "auto";
type OtpLocale = "de" | "en";

function isMode(value: unknown): value is Mode {
  return value === "login" || value === "signup" || value === "auto";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function normalizeLocale(value: unknown): OtpLocale {
  return value === "en" ? "en" : "de";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function friendlyError(message: string, mode: Mode) {
  if (/social login/i.test(message)) {
    return "Dieses Konto nutzt Google. Bitte melde dich mit Google an.";
  }

  return "Der Code konnte gerade nicht gesendet werden. Bitte versuch es gleich nochmal.";
}

function getEmailDomain(email: string) {
  return email.split("@").pop() || "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const name = normalizeName(body?.name);
    const mode: Mode = isMode(body?.mode) ? body.mode : "auto";
    const locale = normalizeLocale(body?.locale);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gueltige E-Mail-Adresse ein." },
        { status: 400 },
      );
    }

    // Hard fail if Resend is not configured. We send the OTP ourselves; we do
    // NOT fall back to Supabase's hosted email because that emits a magic-link
    // template, not an OTP code, which confuses users who expect a 6-digit code.
    if (!resendClient) {
      console.error("[email-otp] RESEND_API_KEY is not configured in this environment");
      return NextResponse.json(
        {
          error:
            "E-Mail-Versand ist gerade nicht konfiguriert. Bitte melde dich kurz mit Google an oder kontaktiere den Support.",
        },
        { status: 503 },
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

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: !accountExists && name ? { data: { full_name: name, name } } : undefined,
    });

    if (error || !data?.properties?.email_otp || !data.properties.verification_type) {
      console.error("[email-otp] generateLink failed", { message: error?.message });
      return NextResponse.json(
        { error: friendlyError(error?.message ?? "otp_failed", mode) },
        { status: 400 },
      );
    }

    try {
      const sentEmail = await sendEmailOtpEmail(email, data.properties.email_otp, { mode, locale });
      console.info("[email-otp] Resend sent", {
        emailId: sentEmail?.id,
        mode,
        locale,
        verificationType: data.properties.verification_type,
        accountExists,
        recipientDomain: getEmailDomain(email),
      });
    } catch (sendError) {
      console.error("[email-otp] Resend send failed", {
        mode,
        locale,
        verificationType: data.properties.verification_type,
        accountExists,
        recipientDomain: getEmailDomain(email),
        message: sendError instanceof Error ? sendError.message : "unknown",
      });
      return NextResponse.json(
        {
          error:
            "Der Code konnte gerade nicht per E-Mail gesendet werden. Bitte pruef deinen Spam-Ordner oder versuch es nochmal.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      verificationType: data.properties.verification_type as EmailOtpType,
    });
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
