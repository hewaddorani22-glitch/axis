"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppUrl } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";

function SignupForm() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [verificationType, setVerificationType] = useState<EmailOtpType>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite"); // Partner invite
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    trackEvent("signup_started", { method: "email_otp", source: "signup_page" });

    const response = await fetch("/api/auth/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        mode: "signup",
      }),
    });
    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error || t("signup.error.send"));
      return;
    }

    setVerificationType(data?.verificationType || "email");
    setCode("");
    setStage("code");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: verificationType,
    });

    if (error) {
      setError(
        /invalid|expired|token/i.test(error.message)
          ? t("signup.error.invalid")
          : error.message
      );
      setLoading(false);
      return;
    }

    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", "/onboarding");
    if (inviteId) callbackUrl.searchParams.set("invite", inviteId);
    window.location.assign(callbackUrl.toString());
  };

  const handleGoogleSignup = async () => {
    trackEvent("signup_started", { method: "google", source: "signup_page" });
    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", "/onboarding");
    if (inviteId) callbackUrl.searchParams.set("invite", inviteId);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { prompt: "select_account" },
      },
    });
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">{t("signup.title")}</h1>
        {inviteId ? (
          <p className="text-sm text-axis-text2">
            {t("signup.invite.text")}{" "}
            <span className="text-axis-accent font-medium">{t("signup.invite.cta")}</span>
          </p>
        ) : (
          <p className="text-sm text-axis-text2">{t("signup.sub")}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 bg-white border border-axis-border rounded-xl px-6 py-3 text-sm font-medium hover:border-axis-border2 hover:shadow-sm transition-all mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {t("signup.google")}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-axis-border" />
        <span className="text-xs font-mono text-axis-text3">{t("signup.divider")}</span>
        <div className="flex-1 h-px bg-axis-border" />
      </div>

      {stage === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-axis-text2 mb-1.5">{t("signup.name.label")}</label>
            <input
              id="name"
              type="text"
              placeholder={t("signup.name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-axis-text2 mb-1.5">{t("auth.email.label")}</label>
            <input
              id="signup-email"
              type="email"
              placeholder={t("auth.email.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email}
            className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("signup.cta.send")
            )}
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <p className="text-sm text-axis-text2">
              {t("signup.code.sent", { email })}
            </p>
            <p className="mt-2 text-xs text-axis-text3">
              {t("auth.code.help")}
            </p>
          </div>
          <div>
            <label htmlFor="signup-code" className="block text-xs font-medium text-axis-text2 mb-1.5">{t("signup.code.label")}</label>
            <input
              id="signup-code"
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="12345678"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full rounded-xl px-4 py-3 text-center tracking-[0.4em] text-lg bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
              required
              maxLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("signup.cta.create")
            )}
          </button>
          <button
            type="button"
            onClick={async () => {
              await handleSendCode({ preventDefault() {} } as React.FormEvent);
            }}
            disabled={loading}
            className="w-full text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
          >
            {t("signup.code.resend")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
              setError("");
            }}
            className="w-full text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
          >
            {t("signup.code.change")}
          </button>
        </form>
      )}

      <p className="text-xs text-center text-axis-text3 mt-4">
        {t("signup.terms")}{" "}
        <Link href="/terms" className="underline hover:text-axis-text1">{t("signup.terms.terms")}</Link> {t("signup.terms.and")}{" "}
        <Link href="/privacy" className="underline hover:text-axis-text1">{t("signup.terms.privacy")}</Link>.
      </p>

      <p className="text-center text-sm text-axis-text3 mt-6">
        {t("signup.have.account")}{" "}
        <Link href="/login" className="text-axis-text1 font-medium hover:underline">
          {t("signup.login")}
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-axis-text3 text-sm">…</div>}>
      <SignupForm />
    </Suspense>
  );
}
