"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconCheck } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";

const COPY = {
  de: {
    mismatch: "Die Passwörter stimmen nicht überein.",
    short: "Das Passwort muss mindestens 8 Zeichen haben.",
    done: "Passwort aktualisiert",
    redirect: "Wir leiten dich zum Dashboard weiter...",
    title: "Neues Passwort setzen",
    sub: "Wähle ein neues Passwort für dein Konto.",
    password: "Neues Passwort",
    passwordPlaceholder: "Mind. 8 Zeichen",
    confirm: "Passwort bestätigen",
    confirmPlaceholder: "Wie oben",
    update: "Passwort aktualisieren",
  },
  en: {
    mismatch: "Passwords don't match.",
    short: "Password must be at least 8 characters.",
    done: "Password updated",
    redirect: "Redirecting to your dashboard...",
    title: "Set a new password",
    sub: "Choose a new password for your account.",
    password: "New password",
    passwordPlaceholder: "Min. 8 characters",
    confirm: "Confirm password",
    confirmPlaceholder: "Same as above",
    update: "Update Password",
  },
};

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const copy = COPY[locale === "en" ? "en" : "de"];
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Supabase sends the access token as a hash fragment: exchange it for a session
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      supabase.auth.getSession(); // triggers session from URL hash automatically
    }
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(copy.mismatch);
      return;
    }
    if (password.length < 8) {
      setError(copy.short);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-axis-accent/10 border border-axis-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IconCheck size={24} className="text-axis-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{copy.done}</h1>
        <p className="text-sm text-axis-text2">{copy.redirect}</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">{copy.title}</h1>
        <p className="text-sm text-axis-text2">{copy.sub}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-axis-text2 mb-1.5">
            {copy.password}
          </label>
          <input
            id="password"
            type="password"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            minLength={8}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-xs font-medium text-axis-text2 mb-1.5">
            {copy.confirm}
          </label>
          <input
            id="confirm"
            type="password"
            placeholder={copy.confirmPlaceholder}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            minLength={8}
            required
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
            copy.update
          )}
        </button>
      </form>
    </>
  );
}
