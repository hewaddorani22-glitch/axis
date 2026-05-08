"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppUrl } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";
import { LanguageSwitch } from "@/components/landing/language-switch";
import { TikTokPixel } from "@/components/tracking/tiktok-pixel";
import { trackTikTokEvent } from "@/lib/tiktok";
import {
  isQuizGoal,
  isQuizTimeWaster,
  type QuizGoal,
  type QuizTimeWaster,
  saveQuizAnswers,
  suggestFirstMission,
} from "@/lib/quiz";

type Stage = "intro" | "q1" | "q2" | "building" | "preview";

const SAVE_WINDOW_SECONDS = 10 * 60;

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60).toString().padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function StartFunnel() {
  const searchParams = useSearchParams();
  const { t, locale } = useLocale();
  const supabase = useMemo(() => createClient(), []);

  const presetApplied = useRef(false);
  const initialPreset = useMemo(() => {
    const goalParam = searchParams?.get("goal") ?? null;
    const ageParam = searchParams?.get("age") ?? null;
    const twParam = searchParams?.get("tw") ?? null;
    const stageParam = searchParams?.get("stage") ?? null;
    const slugParam = searchParams?.get("slug") ?? null;
    const fromParam = searchParams?.get("from") ?? null;
    const parsedAge = ageParam ? parseInt(ageParam, 10) : NaN;
    return {
      goal: isQuizGoal(goalParam) ? goalParam : null,
      age: Number.isFinite(parsedAge) && parsedAge >= 13 && parsedAge <= 65 ? parsedAge : null,
      timeWaster: isQuizTimeWaster(twParam) ? twParam : null,
      stage:
        stageParam === "q1" || stageParam === "q2" || stageParam === "preview"
          ? (stageParam as Stage)
          : null,
      slug: slugParam,
      fromTikTok: fromParam === "tt",
    };
  }, [searchParams]);

  const [stage, setStage] = useState<Stage>(initialPreset.stage ?? "intro");
  const [goal, setGoal] = useState<QuizGoal | null>(initialPreset.goal);
  const [age, setAge] = useState<number>(initialPreset.age ?? 22);
  const [timeWaster, setTimeWaster] = useState<QuizTimeWaster | null>(initialPreset.timeWaster);

  // Save modal state
  const [showSave, setShowSave] = useState(false);
  const [authMode, setAuthMode] = useState<"choose" | "email" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationType, setVerificationType] = useState<EmailOtpType>("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Loss-aversion countdown
  const startTimeRef = useRef<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SAVE_WINDOW_SECONDS);

  // Fire pixel ViewContent on mount
  useEffect(() => {
    if (presetApplied.current) return;
    presetApplied.current = true;
    trackTikTokEvent("ViewContent", {
      content_id: initialPreset.slug || "start-funnel",
      content_type: "product",
      content_name: initialPreset.fromTikTok ? `tt:${initialPreset.slug}` : "organic",
    });
  }, [initialPreset]);

  // Fire pixel on stage transitions (funnel progression)
  useEffect(() => {
    if (stage === "preview") {
      trackTikTokEvent("AddToCart", { content_id: initialPreset.slug || "start-funnel" });
    } else if (stage === "building") {
      trackTikTokEvent("InitiateCheckout", { content_id: initialPreset.slug || "start-funnel" });
    }
  }, [stage, initialPreset.slug]);

  useEffect(() => {
    if (stage !== "preview") return;
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
      setSecondsLeft(SAVE_WINDOW_SECONDS - elapsed);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  // Building animation: 1.6s then move to preview + persist quiz
  useEffect(() => {
    if (stage !== "building") return;
    if (!goal || !timeWaster) return;
    saveQuizAnswers({
      goal,
      age,
      timeWaster,
      completedAt: Date.now(),
    });
    const t = window.setTimeout(() => setStage("preview"), 1600);
    return () => window.clearTimeout(t);
  }, [stage, goal, age, timeWaster]);

  const expired = stage === "preview" && secondsLeft <= 0;

  const goBack = () => {
    if (stage === "q1") setStage("intro");
    else if (stage === "q2") setStage("q1");
  };

  const stepNumber = stage === "q1" ? 1 : stage === "q2" ? 2 : 0;
  const progress = stepNumber === 0 ? (stage === "preview" || stage === "building" ? 100 : 0) : (stepNumber / 2) * 100;

  const handleGoogleSave = async () => {
    setAuthError("");
    setAuthLoading(true);
    trackEvent("signup_started", { method: "google", source: "start_funnel" });
    trackTikTokEvent("ClickButton", {
      content_id: initialPreset.slug || "start-funnel",
      method: "google",
    });
    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", "/onboarding");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setAuthError(error.message || t("auth.error.generic"));
      setAuthLoading(false);
    }
    // On success the browser navigates away, so no further state changes needed.
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    trackEvent("signup_started", { method: "email_otp", source: "start_funnel" });
    const response = await fetch("/api/auth/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, mode: "auto", locale }),
    });
    const data = await response.json().catch(() => null);
    setAuthLoading(false);

    if (!response.ok) {
      setAuthError(data?.error || t("auth.error.generic"));
      return;
    }

    setVerificationType(data?.verificationType || "email");
    setCode("");
    setAuthMode("code");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: verificationType,
    });

    if (error) {
      setAuthError(
        /invalid|expired|token/i.test(error.message)
          ? t("auth.error.invalid")
          : error.message || t("auth.error.generic")
      );
      setAuthLoading(false);
      return;
    }

    const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
    callbackUrl.searchParams.set("next", "/onboarding");
    window.location.assign(callbackUrl.toString());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TikTokPixel />
      {/* Top bar */}
      <div className="px-4 sm:px-6 pt-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <line x1="4" y1="20" x2="36" y2="20" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="20" y1="4" x2="20" y2="36" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="3.5" fill="#0B0B0F"/>
          </svg>
          <span className="text-base font-bold tracking-tight">lomoura</span>
        </Link>
        <LanguageSwitch />
      </div>

      {/* Progress bar */}
      <div className="px-4 sm:px-6 mt-4">
        <div className="h-1 w-full bg-axis-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-axis-text1"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {stepNumber > 0 && (
          <p className="mt-2 text-[11px] font-mono text-axis-text3">
            {t("quiz.step")} {stepNumber} {t("quiz.of")} 2
          </p>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {stage === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 bg-white border border-axis-border rounded-full px-3 py-1 mb-6">
                  <span className="w-2 h-2 bg-axis-accent2 rounded-full animate-pulse-soft" />
                  <span className="text-[11px] font-mono text-axis-text2">
                    {t("hero.badge")}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3 text-balance">
                  {t("quiz.intro.title")}
                </h1>
                <p className="text-base text-axis-text2 mb-8">
                  {t("quiz.intro.sub")}
                </p>
                <button
                  onClick={() => setStage("q1")}
                  className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-text1 text-white px-6 py-4 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all shadow-lg shadow-axis-text1/10"
                >
                  {t("quiz.intro.cta")}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="text-xs text-axis-text3 mt-4 font-mono">{t("hero.trust")}</p>
              </motion.div>
            )}

            {stage === "q1" && (
              <motion.div
                key="q1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">{t("quiz.q1.title")}</h2>
                <p className="text-sm text-axis-text2 mb-6">{t("quiz.q1.sub")}</p>
                <div className="space-y-3">
                  {([
                    { v: "money" as const, emoji: "💰", title: t("quiz.q1.money"), desc: t("quiz.q1.money.desc") },
                    { v: "grades" as const, emoji: "📚", title: t("quiz.q1.grades"), desc: t("quiz.q1.grades.desc") },
                    { v: "discipline" as const, emoji: "💪", title: t("quiz.q1.discipline"), desc: t("quiz.q1.discipline.desc") },
                    { v: "start" as const, emoji: "🎯", title: t("quiz.q1.start"), desc: t("quiz.q1.start.desc") },
                  ]).map((opt) => {
                    const active = goal === opt.v;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => {
                          setGoal(opt.v);
                          window.setTimeout(() => setStage("q2"), 180);
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-xl border bg-white px-4 py-4 transition-all active:scale-[0.99] ${
                          active
                            ? "border-axis-text1 ring-2 ring-axis-text1/10"
                            : "border-axis-border hover:border-axis-border2"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{opt.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-axis-text1">{opt.title}</span>
                          <span className="block text-xs text-axis-text2">{opt.desc}</span>
                        </span>
                        <svg className="w-4 h-4 text-axis-text3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button onClick={goBack} className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">
                    ← {t("quiz.back")}
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "q2" && (
              <motion.div
                key="q2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">{t("quiz.q3.title")}</h2>
                <p className="text-sm text-axis-text2 mb-6">{t("quiz.q3.sub")}</p>
                <div className="space-y-3">
                  {([
                    { v: "phone" as const, emoji: "📱", title: t("quiz.q3.phone") },
                    { v: "procrast" as const, emoji: "🦥", title: t("quiz.q3.procrast") },
                    { v: "chaos" as const, emoji: "🌀", title: t("quiz.q3.chaos") },
                    { v: "motivation" as const, emoji: "🔋", title: t("quiz.q3.motivation") },
                  ]).map((opt) => {
                    const active = timeWaster === opt.v;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => {
                          setTimeWaster(opt.v);
                          window.setTimeout(() => setStage("building"), 180);
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-xl border bg-white px-4 py-4 transition-all active:scale-[0.99] ${
                          active
                            ? "border-axis-text1 ring-2 ring-axis-text1/10"
                            : "border-axis-border hover:border-axis-border2"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{opt.emoji}</span>
                        <span className="text-base font-semibold text-axis-text1 flex-1">{opt.title}</span>
                        <svg className="w-4 h-4 text-axis-text3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6">
                  <button onClick={goBack} className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">
                    ← {t("quiz.back")}
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "building" && (
              <motion.div
                key="building"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-axis-accent/30 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                    className="w-8 h-8 border-[3px] border-axis-text1/20 border-t-axis-text1 rounded-full"
                  />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-6">{t("quiz.building.title")}</h2>
                <ul className="text-sm text-axis-text2 space-y-2">
                  {[t("quiz.building.line1"), t("quiz.building.line2"), t("quiz.building.line3")].map((line, i) => (
                    <motion.li
                      key={line}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.35 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-axis-accent2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {line}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {stage === "preview" && goal && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <DashboardPreview
                  goal={goal}
                  locale={locale}
                  secondsLeft={secondsLeft}
                  onSave={() => {
                    setShowSave(true);
                    setAuthMode("choose");
                    setAuthError("");
                    setCode("");
                  }}
                  expired={expired}
                  onRestart={() => {
                    startTimeRef.current = null;
                    setSecondsLeft(SAVE_WINDOW_SECONDS);
                    setStage("intro");
                    setGoal(null);
                    setTimeWaster(null);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save modal */}
      <AnimatePresence>
        {showSave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-axis-text1/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => !authLoading && setShowSave(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-axis-bg rounded-t-3xl sm:rounded-3xl border border-axis-border p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold tracking-tight">{t("preview.save.title")}</h3>
                <button
                  onClick={() => !authLoading && setShowSave(false)}
                  className="text-axis-text3 hover:text-axis-text1 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs font-mono text-axis-text3 mb-4">
                {t("preview.save.timer")}: <span className="text-axis-text1">{formatCountdown(secondsLeft)}</span>
              </p>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-4">
                  {authError}
                </div>
              )}

              {authMode === "choose" && (
                <>
                  <p className="text-sm text-axis-text2 mb-5">{t("preview.save.sub")}</p>

                  <button
                    onClick={handleGoogleSave}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-axis-border rounded-xl px-6 py-3.5 text-sm font-semibold hover:border-axis-border2 hover:shadow-sm transition-all mb-3 disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t("preview.save.google")}
                  </button>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-axis-border" />
                    <span className="text-[10px] font-mono text-axis-text3">{t("preview.save.or")}</span>
                    <div className="flex-1 h-px bg-axis-border" />
                  </div>

                  <button
                    onClick={() => {
                      setAuthMode("email");
                      setAuthError("");
                    }}
                    className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3.5 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all"
                  >
                    {t("preview.save.email")}
                  </button>

                  <p className="text-[11px] text-center text-axis-text3 mt-4">
                    {t("preview.save.legal", { terms: "[T]", privacy: "[P]" })
                      .replace("[T]", "")
                      .replace("[P]", "")}{" "}
                    <Link href="/terms" className="underline hover:text-axis-text1">
                      {t("preview.save.terms")}
                    </Link>
                    {" · "}
                    <Link href="/privacy" className="underline hover:text-axis-text1">
                      {t("preview.save.privacy")}
                    </Link>
                  </p>
                </>
              )}

              {authMode === "email" && (
                <form onSubmit={handleSendCode}>
                  <label className="block text-xs font-medium text-axis-text2 mb-1.5">
                    {t("auth.email.label")}
                  </label>
                  <input
                    autoFocus
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t("auth.email.placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl px-4 py-3 text-base bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={authLoading || !email}
                    className="w-full mt-4 flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3.5 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {authLoading ? t("auth.email.sending") : t("auth.email.cta")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("choose")}
                    className="w-full mt-3 text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
                  >
                    ← {t("quiz.back")}
                  </button>
                </form>
              )}

              {authMode === "code" && (
                <form onSubmit={handleVerifyCode}>
                  <h4 className="text-base font-semibold mb-1">{t("auth.code.title")}</h4>
                  <p className="text-sm text-axis-text2 mb-4">
                    {t("auth.code.sub", { email })}
                  </p>
                  <p className="text-xs text-axis-text3 mb-4">
                    {t("auth.code.help")}
                  </p>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t("auth.code.placeholder")}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                    maxLength={8}
                    className="w-full rounded-xl px-4 py-3 text-center tracking-[0.4em] text-lg bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={authLoading || code.length < 6}
                    className="w-full mt-4 flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3.5 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {authLoading ? t("auth.code.verifying") : t("auth.code.cta")}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSendCode({ preventDefault() {} } as React.FormEvent);
                    }}
                    disabled={authLoading}
                    className="w-full mt-3 text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
                  >
                    {t("auth.code.resend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("email");
                      setAuthError("");
                      setCode("");
                    }}
                    className="w-full mt-2 text-xs text-axis-text3 hover:text-axis-text1 transition-colors"
                  >
                    {t("auth.code.change")}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardPreview({
  goal,
  locale,
  secondsLeft,
  expired,
  onSave,
  onRestart,
}: {
  goal: QuizGoal;
  locale: "de" | "en";
  secondsLeft: number;
  expired: boolean;
  onSave: () => void;
  onRestart: () => void;
}) {
  const { t } = useLocale();
  const mission = suggestFirstMission(goal, locale);
  const stats = [
    { label: locale === "de" ? "MTD UMSATZ" : "MTD REVENUE", value: "0 €", change: "—", color: "text-axis-accent" },
    { label: locale === "de" ? "MISSIONEN" : "MISSIONS", value: "0/1", change: "0%", color: "text-emerald-500" },
    { label: t("preview.streak"), value: `1 ${t("preview.streak.unit")}`, change: locale === "de" ? "Neu!" : "New!", color: "text-orange-500" },
    { label: t("preview.focus"), value: "—", change: locale === "de" ? "Bald" : "Soon", color: "text-axis-text2" },
  ];

  return (
    <div>
      <p className="text-[11px] font-mono text-axis-text3 mb-1 uppercase tracking-wider">
        {t("preview.briefing")}
      </p>
      <h2 className="text-2xl font-bold tracking-tight mb-4">{t("preview.welcome.guest")}</h2>

      {/* Mock dashboard card */}
      <div className="bg-axis-dark text-white rounded-2xl border border-white/[0.08] shadow-2xl shadow-axis-text1/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2.5">
                <p className="text-[9px] font-mono text-white/40 uppercase">{s.label}</p>
                <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-mono text-white/30">{s.change}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3">
            <p className="text-[9px] font-mono text-white/40 uppercase mb-2">{t("preview.mission.today")}</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-white/20 shrink-0" />
              <span className="text-sm text-white/80 flex-1">{mission}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                {t("preview.mission.priority.high")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save block */}
      {expired ? (
        <div className="mt-6 text-center bg-white border border-axis-border rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-1">{t("preview.save.expired")}</h3>
          <p className="text-sm text-axis-text2 mb-4">{t("preview.save.expired.sub")}</p>
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all"
          >
            {t("preview.save.restart")}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-axis-text3 uppercase">
              {t("preview.save.timer")}
            </span>
            <span className="text-[11px] font-mono text-axis-text1">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
          <button
            onClick={onSave}
            className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold bg-axis-text1 text-white px-6 py-4 rounded-xl hover:bg-axis-text1/90 active:scale-[0.98] transition-all shadow-lg shadow-axis-text1/10"
          >
            {t("preview.save.title")}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="text-[11px] text-center text-axis-text3 mt-3 font-mono">
            {t("hero.trust")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartFunnel />
    </Suspense>
  );
}
