"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

function sanitizeNextPath(next: string | null) {
  const candidate = next ?? "/dashboard";
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }
  return candidate;
}

function readAuthError(url: URL) {
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  return (
    hashParams.get("error_description") ||
    hashParams.get("error") ||
    url.searchParams.get("error_description") ||
    url.searchParams.get("error") ||
    "We couldn't confirm your email. Please try the link again."
  );
}

export default function AuthConfirmPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const finishConfirmation = async () => {
      const supabase = createClient();
      const currentUrl = new URL(window.location.href);
      const next = sanitizeNextPath(currentUrl.searchParams.get("next"));
      const inviteId = currentUrl.searchParams.get("invite");
      const code = currentUrl.searchParams.get("code");
      const tokenHash = currentUrl.searchParams.get("token_hash");
      const type = currentUrl.searchParams.get("type") as EmailOtpType | null;

      try {
        let {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session && code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          const {
            data: { session: exchangedSession },
          } = await supabase.auth.getSession();
          session = exchangedSession;
        }

        if (!session && tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (verifyError) throw verifyError;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error(readAuthError(currentUrl));

        const callbackUrl = new URL("/callback", `${getBrowserAppUrl()}/`);
        callbackUrl.searchParams.set("next", next);
        if (inviteId) callbackUrl.searchParams.set("invite", inviteId);

        window.location.replace(callbackUrl.toString());
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : readAuthError(currentUrl)
          );
        }
      }
    };

    void finishConfirmation();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-[28px] border border-axis-border bg-white/80 px-6 py-8 shadow-[0_20px_70px_rgba(11,11,15,0.08)] backdrop-blur">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-axis-accent/15">
          <div className="h-6 w-6 rounded-full border-2 border-axis-accent/30 border-t-axis-accent animate-spin" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {error ? "Confirmation failed" : "Confirming your email"}
        </h1>
        {error ? (
          <>
            <p className="text-sm text-axis-text2 max-w-sm mx-auto">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-axis-text1 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-axis-text1/90"
            >
              Back to login
            </Link>
          </>
        ) : (
          <p className="text-sm text-axis-text2 max-w-sm mx-auto">
            We are signing you in and preparing your lomoura setup.
          </p>
        )}
      </div>
    </div>
  );
}
