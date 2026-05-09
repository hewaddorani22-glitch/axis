-- Activation/onboarding instrumentation columns on users.
--
-- first_mission_completed_at: timestamp of the user's very first mission flip
--   to "done". Drives the activation funnel metric and unlocks future
--   "first win" celebrations / re-engagement triggers.
--
-- welcome_email_sent_at: idempotency marker for /api/email/welcome. Prevents
--   double-sends on retries / page reloads, and lets a follow-up cron resend
--   if delivery never happened on day 1.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_mission_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_first_mission_completed_at
  ON users (first_mission_completed_at)
  WHERE first_mission_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_welcome_email_pending
  ON users (created_at)
  WHERE welcome_email_sent_at IS NULL;
