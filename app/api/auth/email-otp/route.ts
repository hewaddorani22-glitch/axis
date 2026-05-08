import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmailOtpEmail } from "@/lib/resend";
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const name = normalizeName(body?.name);
    const mode: Mode = isMode(body?.mode) ? body.mode : "auto";

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gueltige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: existingProfile, error: profileError } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Die Anmeldung konnte gerade nicht vorbereitet werden." },
        { status: 500 }
      );
    }

    const accountExists = Boolean(existingProfile);

    if (mode === "login" && !accountExists) {
      return NextResponse.json(
        { error: friendlyError("not_found", mode) },
        { status: 404 }
      );
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: !accountExists && name ? { data: { full_name: name, name } } : undefined,
    });

    if (error || !data?.properties?.email_otp || !data.properties.verification_type) {
      return NextResponse.json(
        { error: friendlyError(error?.message ?? "otp_failed", mode) },
        { status: 400 }
      );
    }

    await sendEmailOtpEmail(email, data.properties.email_otp, { mode });

    return NextResponse.json({
      ok: true,
      verificationType: data.properties.verification_type as EmailOtpType,
      accountExists,
    });
  } catch {
    return NextResponse.json(
      { error: "Die Anmeldung konnte gerade nicht vorbereitet werden." },
      { status: 500 }
    );
  }
}
