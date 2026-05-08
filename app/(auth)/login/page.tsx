"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppUrl } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";

function LoginForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "code" | "password">("email");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const sendLoginCode = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", redirect);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: callbackUrl.toString() },
    });
    setLoading(false);
    if (error) {
      setError(error.message || t("auth.error.generic"));
      return false;
    } else {
      setStage("code");
      setNotice("Check your inbox for the 6-digit code.");
      return true;
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendLoginCode();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });
    if (error) {
      setError(t("auth.error.invalid"));
      setLoading(false);
      return;
    }
    trackEvent("login_completed", { method: "email_otp" });
    router.push(redirect);
    router.refresh();
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    trackEvent("login_completed", { method: "password" });
    router.push(redirect);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    trackEvent("login_started", { method: "google" });
    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", redirect);

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
        <h1 className="text-2xl font-bold tracking-tight mb-2">{t("auth.welcome.back")}</h1>
        <p className="text-sm text-axis-text2">{t("auth.welcome.sub")}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {notice && !error && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-6">
          {notice}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-axis-border rounded-xl px-6 py-3 text-sm font-medium hover:border-axis-border2 hover:shadow-sm transition-all mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-axis-border" />
        <span className="text-xs font-mono text-axis-text3">{t("preview.save.or")}</span>
        <div className="flex-1 h-px bg-axis-border" />
      </div>

      {stage === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-axis-text2 mb-1.5">
              {t("auth.email.label")}
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("auth.email.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("auth.email.sending") : t("auth.email.cta")}
          </button>
          <button
            type="button"
            onClick={() => setStage("password")}
            className="w-full text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
          >
            Use password instead
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <h2 className="text-base font-semibold mb-1">{t("auth.code.title")}</h2>
            <p className="text-sm text-axis-text2 mb-3">
              {t("auth.code.sub", { email })}
            </p>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={t("auth.code.placeholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded-xl px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3/40 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? t("auth.code.verifying") : t("auth.code.cta")}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setOtp("");
              }}
              className="text-axis-text3 hover:text-axis-text1 transition-colors"
            >
              {t("auth.code.change")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setOtp("");
                await sendLoginCode();
              }}
              disabled={loading}
              className="text-axis-text3 hover:text-axis-text1 transition-colors"
            >
              {t("auth.code.resend")}
            </button>
          </div>
        </form>
      )}

      {stage === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="email-pw" className="block text-xs font-medium text-axis-text2 mb-1.5">
              {t("auth.email.label")}
            </label>
            <input
              id="email-pw"
              type="email"
              autoComplete="email"
              placeholder={t("auth.email.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs font-medium text-axis-text2">Password</label>
              <Link href="/forgot-password" className="text-xs text-axis-text3 hover:text-axis-text1 transition-colors">Forgot?</Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "..." : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => setStage("email")}
            className="w-full text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
          >
            ← Use email code instead
          </button>
        </form>
      )}

      <p className="text-center text-sm text-axis-text3 mt-6">
        {t("auth.no.account")}{" "}
        <Link href="/start" className="text-axis-text1 font-medium hover:underline">
          {t("auth.signup.link")}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-axis-text3">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
