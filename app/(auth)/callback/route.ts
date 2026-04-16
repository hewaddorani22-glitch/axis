import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const inviteId = searchParams.get("invite");

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const response = NextResponse.redirect(`${origin}${next}`);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_done")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.onboarding_done) {
          const onboardingUrl = inviteId
            ? `${origin}/onboarding?invite=${inviteId}`
            : `${origin}/onboarding`;
          return NextResponse.redirect(onboardingUrl);
        }

        // If coming from invite link and already onboarded, create partnership
        if (inviteId) {
          try {
            await fetch(`${origin}/api/partners/invite`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inviterId: inviteId }),
            });
          } catch { /* non-fatal */ }
        }
      }

      return response;
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
