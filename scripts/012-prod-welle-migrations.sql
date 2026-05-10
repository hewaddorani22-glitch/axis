-- =============================================================
-- 012-prod-welle-migrations.sql
--
-- Schema-only deltas for Welle 1 / 2 / 3 that never landed on the
-- live Lomoura project (kqmbcqichrfxyxwaikln). The trigger fix and
-- auth-user backfill already shipped via scripts/011 — this file
-- only adds the missing columns/indexes so the deployed app code
-- (which already references these columns) stops throwing 42703.
--
-- Safe to re-run. Run in Supabase Studio (kqmbcqichrfxyxwaikln) →
-- SQL Editor → New query → paste → Run.
-- =============================================================

-- Welle 1: activation tracking ------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_mission_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_first_mission_completed_at
  ON public.users (first_mission_completed_at)
  WHERE first_mission_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_welcome_email_pending
  ON public.users (created_at)
  WHERE welcome_email_sent_at IS NULL;


-- Welle 2: achievement acknowledgement ----------------------------
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_achievements_unacknowledged
  ON public.achievements (user_id)
  WHERE acknowledged_at IS NULL;


-- Welle 3: per-user local-date stamps for tz-aware crons ----------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_morning_briefing_on DATE,
  ADD COLUMN IF NOT EXISTS last_streak_warning_on   DATE,
  ADD COLUMN IF NOT EXISTS last_weekly_digest_on    DATE,
  ADD COLUMN IF NOT EXISTS last_reengagement_on     DATE,
  ADD COLUMN IF NOT EXISTS last_review_push_on      DATE;

CREATE INDEX IF NOT EXISTS idx_users_tz_onboarded
  ON public.users (timezone)
  WHERE onboarding_done = true;


-- Sanity report ---------------------------------------------------
-- Now that the columns exist, this is the full activation-funnel
-- snapshot. Paste the row back to me.
SELECT
  (SELECT COUNT(*) FROM auth.users)                                                     AS auth_users,
  (SELECT COUNT(*) FROM public.users)                                                   AS lomoura_users,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= now() - interval '7 days')     AS users_7d,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= now() - interval '24 hours')   AS users_24h,
  (SELECT COUNT(*) FROM public.users WHERE onboarding_done)                             AS onboarded,
  (SELECT COUNT(*) FROM public.users WHERE first_mission_completed_at IS NOT NULL)      AS first_mission,
  (SELECT COUNT(*) FROM public.users WHERE welcome_email_sent_at IS NOT NULL)           AS welcome_sent,
  (SELECT COUNT(*) FROM public.users WHERE plan = 'pro')                                AS pro_users,
  (SELECT COUNT(*) FROM public.missions)                                                AS missions_total,
  (SELECT COUNT(*) FROM public.missions WHERE status = 'done')                          AS missions_done,
  (SELECT COUNT(*) FROM public.habits)                                                  AS habits_total,
  (SELECT COUNT(*) FROM public.habit_logs WHERE date >= current_date - 7)               AS habit_logs_7d,
  (SELECT COUNT(*) FROM public.partnerships WHERE status = 'active')                    AS active_partnerships,
  (SELECT COUNT(*) FROM public.push_subscriptions)                                      AS push_subs,
  (SELECT to_regclass('public.analytics_events') IS NOT NULL)                           AS has_analytics_table;
