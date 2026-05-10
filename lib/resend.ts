import { Resend } from "resend";
import { getAppUrl, getFromEmail, getResendApiKey } from "@/lib/env";

export const resend = getResendApiKey()
  ? new Resend(getResendApiKey())
  : null;

export const FROM_EMAIL = getFromEmail();
const APP_URL = getAppUrl();

/**
 * Send a custom email sign-in code.
 * We send this ourselves so the product can use OTP-only auth
 * without depending on Supabase's hosted magic-link template.
 */
export async function sendEmailOtpEmail(
  to: string,
  code: string,
  options?: {
    mode?: "login" | "signup" | "auto";
    locale?: "de" | "en";
  }
) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const mode = options?.mode ?? "auto";
  const locale = options?.locale === "en" ? "en" : "de";
  const copy = {
    de: {
      heading: mode === "login" ? "Dein Lomoura Login-Code" : "Dein Lomoura Code",
      body:
        mode === "login"
          ? "Gib diesen Code in Lomoura ein, um dich anzumelden."
          : "Gib diesen Code in Lomoura ein, um dein Konto zu bestaetigen und weiterzumachen.",
      label: "DEIN CODE",
      ignore: "Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    en: {
      heading: mode === "login" ? "Your Lomoura login code" : "Your Lomoura code",
      body:
        mode === "login"
          ? "Enter this code in Lomoura to sign in."
          : "Enter this code in Lomoura to confirm your account and continue.",
      label: "YOUR CODE",
      ignore: "If you did not request this, you can safely ignore this email.",
    },
  }[locale];

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${copy.heading}: ${code}`,
    tags: [
      { name: "category", value: "auth_otp" },
      { name: "mode", value: mode },
      { name: "locale", value: locale },
    ],
    text: `${copy.heading}\n\n${copy.body}\n\n${code}\n\n${copy.ignore}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 12px;">${copy.heading}</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          ${copy.body}
        </p>
        <div style="margin: 0 0 24px; padding: 20px; border-radius: 16px; border: 1px solid #E4E4E7; background: #FAFAFA; text-align: center;">
          <div style="font-size: 13px; letter-spacing: 0.12em; color: #71717A; margin-bottom: 10px;">${copy.label}</div>
          <div style="font-size: 36px; line-height: 1; font-weight: 800; letter-spacing: 0.24em; color: #0B0B0F; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
            ${code}
          </div>
        </div>
        <p style="color: #71717A; line-height: 1.6; font-size: 13px; margin-bottom: 0;">
          ${copy.ignore}
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "OTP email delivery failed");
  }

  return data;
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) {
    console.warn("[resend] sendWelcomeEmail skipped: RESEND_API_KEY not configured");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to lomoura | Your system is ready",
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome, ${name}.</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          Your lomoura system is ready. Start every morning knowing exactly what to do.
        </p>
        <div style="background: #FAFAFA; border: 1px solid #E4E4E7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #52525B; margin: 0;">
            <strong>Quick start:</strong><br>
            - Set your daily missions<br>
            - Track your habits<br>
            - Log your revenue<br>
            - Invite a partner
          </p>
        </div>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Open Dashboard
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #A1A1AA;">
          The lomoura Team
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Welcome email delivery failed");
  }
}

/**
 * Send streak warning email
 */
export async function sendStreakWarning(to: string, name: string, streakDays: number) {
  if (!resend) {
    console.warn("[resend] sendStreakWarning skipped: RESEND_API_KEY not configured");
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ${streakDays}-day streak is at risk`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Don't break the chain, ${name}.</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          Your <strong>${streakDays}-day streak</strong> is at risk. Complete at least one mission and one habit today to keep it alive.
        </p>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Complete Now
        </a>
      </div>
    `,
  });
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigest(
  to: string,
  name: string,
  stats: {
    missionsCompleted: number;
    missionsTotal: number;
    revenueEarned: number;
    habitsCompleted: number;
    streakDays: number;
    focusScore: number;
    grade: string;
  }
) {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your lomoura Weekly Digest | Grade: ${stats.grade}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 8px;">Weekly Digest</h1>
        <p style="color: #A1A1AA; font-size: 14px; margin-bottom: 24px;">Here's how your week went, ${name}.</p>
        
        <div style="background: #0B0B0F; color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px; font-weight: 800; color: #CDFF4F;">${stats.grade}</span>
            <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">WEEKLY GRADE</p>
          </div>
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <p style="font-size: 20px; font-weight: 700;">${stats.missionsCompleted}/${stats.missionsTotal}</p>
              <p style="font-size: 10px; color: rgba(255,255,255,0.4);">MISSIONS</p>
            </div>
            <div>
              <p style="font-size: 20px; font-weight: 700;">$${stats.revenueEarned.toLocaleString()}</p>
              <p style="font-size: 10px; color: rgba(255,255,255,0.4);">REVENUE</p>
            </div>
            <div>
              <p style="font-size: 20px; font-weight: 700; color: #F97316;">${stats.streakDays}</p>
              <p style="font-size: 10px; color: rgba(255,255,255,0.4);">STREAK</p>
            </div>
          </div>
        </div>
        
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Full Dashboard
        </a>
      </div>
    `,
  });
}

type ReengagementVariant = "day1" | "day3" | "day7" | "day14" | "day30";

const REENGAGEMENT_COPY: Record<
  ReengagementVariant,
  { subject: string; heading: (name: string) => string; body: string; cta: string }
> = {
  day1: {
    subject: "Dein System wartet auf dich",
    heading: (name) => `${name}, deine Streak hängt an einem Mission-Klick.`,
    body: "Du hast gestern angefangen — heute reicht eine erledigte Mission, um deinen Streak auf 2 zu ziehen. 60 Sekunden, mehr nicht.",
    cta: "Mission abhaken",
  },
  day3: {
    subject: "3 Tage rein. Jetzt wird's interessant.",
    heading: (name) => `${name}, ab Tag 3 wird's automatisch.`,
    body: "Studien sagen: 21 Tage zur Gewohnheit. Du bist bei Tag 3. Die nächsten 4 Missions sind die, die alles drehen — fang heute eine an.",
    cta: "Jetzt weitermachen",
  },
  day7: {
    subject: "Eine Woche. Stolz auf dich.",
    heading: (name) => `Eine Woche, ${name}. Wirklich.`,
    body: "Die meisten geben in der ersten Woche auf. Du nicht. Schau, was du in den nächsten 7 Tagen aufbauen kannst, wenn du dranbleibst.",
    cta: "Dashboard öffnen",
  },
  day14: {
    subject: "Zwei Wochen weg. Dein Setup steht noch.",
    heading: (name) => `${name}, dein Setup wartet noch auf dich.`,
    body: "Du hast vor 2 Wochen angefangen, dann wurde es ruhig. Kein Stress — alles ist noch da. Dein Plan, deine Habits, dein Profil. Eine Mission heute, und du bist wieder drin.",
    cta: "Da weitermachen, wo du warst",
  },
  day30: {
    subject: "Letzte Erinnerung — sollen wir es lassen?",
    heading: (name) => `${name}, ein Klick und du bist zurück.`,
    body: "Vor einem Monat warst du bereit, dein System zu bauen. Wenn du raus bist, ist das ok — antworte einfach mit \"Stop\" und wir hören auf. Wenn nicht: 1 Mission heute, und alles startet wieder.",
    cta: "1-Klick-Comeback",
  },
};

/**
 * Send a Day 1/3/7 re-engagement email to a user who has signed up but has
 * been quiet. Loss-aversion + identity reinforcement copy.
 */
export async function sendReengagementEmail(
  to: string,
  name: string,
  variant: ReengagementVariant
) {
  if (!resend) return;
  const copy = REENGAGEMENT_COPY[variant];
  const display = (name && name.trim()) || "Champion";

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: copy.subject,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px; line-height: 1.25;">${copy.heading(display)}</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">${copy.body}</p>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          ${copy.cta}
        </a>
        <p style="margin-top: 32px; font-size: 11px; color: #A1A1AA;">
          Wenn du das nicht mehr willst, antworte einfach mit "Stop".
        </p>
      </div>
    `,
  });
}

/**
 * Send nudge email from partner
 */
export async function sendNudgeEmail(to: string, fromName: string) {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${fromName} sent you a nudge`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">lomoura</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Nudge from ${fromName}</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          ${fromName} noticed you've been quiet. Time to get back on track and complete your missions!
        </p>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Complete Your Missions
        </a>
      </div>
    `,
  });
}
