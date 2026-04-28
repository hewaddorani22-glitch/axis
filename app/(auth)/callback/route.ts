import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getAppUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { activatePartnership } from "@/lib/partners";

function sanitizeNextPath(next: string | null) {
  const candidate = next ?? "/dashboard";
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }
  return candidate;
}

function renderClientConfirmationBridge(appUrl: string) {
  const confirmUrl = new URL("/auth/confirm", `${appUrl}/`).toString();
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirming your email...</title>
    <meta name="robots" content="noindex,nofollow" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f1e9;
        color: #0b0b0f;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .card {
        width: min(420px, calc(100vw - 32px));
        padding: 32px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.86);
        box-shadow: 0 18px 60px rgba(11, 11, 15, 0.08);
        text-align: center;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 24px;
      }
      p {
        margin: 0;
        color: rgba(11, 11, 15, 0.68);
        line-height: 1.5;
      }
      a {
        color: #0b0b0f;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Confirming your email...</h1>
      <p>We are finishing your sign-in and sending you back to lomoura.</p>
      <noscript>
        <p style="margin-top: 12px;">
          JavaScript is required for this step. Please
          <a href="/login">open the login page</a>
          if nothing happens.
        </p>
      </noscript>
    </div>
    <script>
      window.location.replace(${JSON.stringify(confirmUrl)} + window.location.search + window.location.hash);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNextPath(searchParams.get("next"));
  const inviteId = searchParams.get("invite");
  const appUrl = getAppUrl(origin);

  const response = NextResponse.redirect(new URL(next, `${appUrl}/`));
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.headers
            .get("cookie")
            ?.split(";")
            .map((c) => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (!code && tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return renderClientConfirmationBridge(appUrl);
  }

  const admin = createAdminClient();
  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split("@")[0] ||
    null;

  const { data: profile } = await admin
    .from("users")
    .select("onboarding_done")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await admin.from("users").insert({
      id: user.id,
      email,
      name,
    });
  } else {
    await admin.from("users").update({ email }).eq("id", user.id);
  }

  if (inviteId) {
    await activatePartnership(admin, inviteId, user.id);
  }

  if (!profile || !profile.onboarding_done) {
    const onboardingUrl = new URL("/onboarding", `${appUrl}/`);
    if (inviteId) onboardingUrl.searchParams.set("invite", inviteId);
    response.headers.set("Location", onboardingUrl.toString());
  }

  return response;
}
