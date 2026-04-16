import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = "AXIS <noreply@useaxis.com>";

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to AXIS — Your system is ready 🎯",
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">AXIS</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome, ${name}! 👋</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          Your AXIS system is ready. Start every morning knowing exactly what to do.
        </p>
        <div style="background: #FAFAFA; border: 1px solid #E4E4E7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #52525B; margin: 0;">
            <strong>Quick start:</strong><br>
            ✅ Set your daily missions<br>
            🔄 Track your habits<br>
            💰 Log your revenue<br>
            🤝 Invite a partner
          </p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Open Dashboard →
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #A1A1AA;">
          — The AXIS Team
        </p>
      </div>
    `,
  });
}

/**
 * Send streak warning email
 */
export async function sendStreakWarning(to: string, name: string, streakDays: number) {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⚠️ Your ${streakDays}-day streak is at risk!`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">AXIS</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Don't break the chain, ${name}! 🔥</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          Your <strong>${streakDays}-day streak</strong> is at risk. Complete at least one mission and one habit today to keep it alive.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Complete Now →
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
    subject: `📊 Your AXIS Weekly Digest — Grade: ${stats.grade}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">AXIS</strong>
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
              <p style="font-size: 20px; font-weight: 700; color: #F97316;">🔥${stats.streakDays}</p>
              <p style="font-size: 10px; color: rgba(255,255,255,0.4);">STREAK</p>
            </div>
          </div>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Full Dashboard →
        </a>
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
    subject: `👊 ${fromName} sent you a nudge!`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <strong style="font-size: 18px;">AXIS</strong>
        </div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Nudge from ${fromName} 👊</h1>
        <p style="color: #52525B; line-height: 1.6; margin-bottom: 24px;">
          ${fromName} noticed you've been quiet. Time to get back on track and complete your missions!
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #0B0B0F; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Complete Your Missions →
        </a>
      </div>
    `,
  });
}
