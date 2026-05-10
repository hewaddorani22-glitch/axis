-- Per-user idempotency stamps for the timezone-aware cron rework.
-- Each cron job uses local-date stamping so we never double-send to the same
-- user on the same local day even though Vercel's cron is UTC-based and now
-- runs hourly.
--
-- DATE (not TIMESTAMPTZ) is the right type — we compare against the user's
-- local-date string, which is naturally aligned to a calendar day.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_morning_briefing_on DATE,
  ADD COLUMN IF NOT EXISTS last_streak_warning_on DATE,
  ADD COLUMN IF NOT EXISTS last_weekly_digest_on DATE,
  ADD COLUMN IF NOT EXISTS last_reengagement_on DATE,
  ADD COLUMN IF NOT EXISTS last_review_push_on DATE;

CREATE INDEX IF NOT EXISTS idx_users_tz_onboarded
  ON users (timezone)
  WHERE onboarding_done = true;
