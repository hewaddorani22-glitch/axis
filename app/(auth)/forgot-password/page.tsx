"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconMail } from "@/components/icons";
import { getBrowserAppUrl } from "@/lib/env";
import { useLocale } from "@/lib/i18n/provider";

const COPY = {
  de: {
    check: "Prüfe deine E-Mails",
    sent: (email: string) => `Wir haben einen Passwort-Reset-Link an ${email} geschickt. Prüfe deinen Posteingang.`,
    back: "← Zurück zum Login",
    title: "Passwort zurücksetzen",
    sub: "Gib deine E-Mail ein und wir senden dir einen Reset-Link.",
    email: "E-Mail",
    placeholder: "du@beispiel.de",
    send: "Reset-Link senden",
    remember: "Wieder eingefallen?",
    login: "Anmelden",
  },
  en: {
    check: "Check your email",
    sent: (email: string) => `We sent a password reset link to ${email}. Check your inbox.`,
    back: "← Back to login",
    title: "Reset your password",
    sub: "Enter your email and we'll send you a reset link.",
    email: "Email",
    placeholder: "you@example.com",
    send: "Send Reset Link",
    remember: "Remember it?",
    login: "Log in",
  },
};

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const copy = COPY[locale === "en" ? "en" : "de"];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBrowserAppUrl()}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-axis-accent/10 border border-axis-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IconMail size={24} className="text-axis-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{copy.check}</h1>
        <p className="text-sm text-axis-text2 max-w-xs mx-auto mb-6">
          {copy.sent(email)}
        </p>
        <Link href="/login" className="text-sm text-axis-text1 font-medium hover:underline">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">{copy.title}</h1>
        <p className="text-sm text-axis-text2">
          {copy.sub}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-axis-text2 mb-1.5">
            {copy.email}
          </label>
          <input
            id="email"
            type="email"
            placeholder={copy.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center text-sm font-semibold bg-axis-text1 text-white px-6 py-3 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            copy.send
          )}
        </button>
      </form>

      <p className="text-center text-sm text-axis-text3 mt-6">
        {copy.remember}{" "}
        <Link href="/login" className="text-axis-text1 font-medium hover:underline">
          {copy.login}
        </Link>
      </p>
    </>
  );
}
