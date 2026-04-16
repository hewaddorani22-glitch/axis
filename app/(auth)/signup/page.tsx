"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite"); // Partner invite
  const supabase = createClient();

  const acceptInvite = async () => {
    if (!inviteId) return;
    try {
      await fetch("/api/partners/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviterId: inviteId }),
      });
    } catch {
      // Non-fatal — user can connect manually
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // If email confirmation is disabled, redirect directly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email!,
          name: name,
        });
        await acceptInvite();
        router.push("/onboarding");
        router.refresh();
      }
    }
  };

  const handleGoogleSignup = async () => {
    const redirectTo = inviteId
      ? `${window.location.origin}/callback?next=/onboarding&invite=${inviteId}`
      : `${window.location.origin}/callback?next=/onboarding`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-axis-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Check your email</h1>
        <p className="text-sm text-axis-text2 max-w-xs mx-auto">
          We sent a confirmation link to{" "}
          <span className="font-medium text-axis-text1">{email}</span>.
          Click the link to activate your account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Create your account</h1>
        {inviteId ? (
          <p className="text-sm text-axis-text2">
            You were invited to AXIS.{" "}
            <span className="text-axis-accent font-medium">Sign up to connect with your partner.</span>
          </p>
        ) : (
          <p className="text-sm text-axis-text2">Start building your system in 90 seconds</p>
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
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-axis-border" />
        <span className="text-xs font-mono text-axis-text3">OR</span>
        <div className="flex-1 h-px bg-axis-border" />
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-axis-text2 mb-1.5">Full name</label>
          <input
            id="name"
            type="text"
            placeholder="King"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-axis-text2 mb-1.5">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-xs font-medium text-axis-text2 mb-1.5">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-xs text-center text-axis-text3 mt-4">
        By signing up, you agree to our{" "}
        <a href="#" className="underline hover:text-axis-text1">Terms</a> and{" "}
        <a href="#" className="underline hover:text-axis-text1">Privacy Policy</a>.
      </p>

      <p className="text-center text-sm text-axis-text3 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-axis-text1 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-axis-text3 text-sm">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
