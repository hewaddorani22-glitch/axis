-- Performance indexes for common query patterns
-- Run this migration in the Supabase SQL editor.
--
-- Without these indexes, queries over missions/habit_logs/daily_scores
-- become full table scans as user data grows.

-- missions: filter by user + date (date navigation, streak calc, dashboard)
CREATE INDEX IF NOT EXISTS idx_missions_user_date
  ON public.missions (user_id, date);

-- missions: filter by user + date + status (completed missions, streak calc)
CREATE INDEX IF NOT EXISTS idx_missions_user_date_status
  ON public.missions (user_id, date, status);

-- habit_logs: filter by habit + date (per-habit streak, heatmap)
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
  ON public.habit_logs (habit_id, date);

-- habit_logs: filter by user + date (daily completion, streak calc)
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON public.habit_logs (user_id, date);

-- daily_scores: most recent scores first per user
CREATE INDEX IF NOT EXISTS idx_daily_scores_user_date_desc
  ON public.daily_scores (user_id, date DESC);

-- revenue_entries: filter by user + date range (MTD, charts)
CREATE INDEX IF NOT EXISTS idx_revenue_entries_user_date
  ON public.revenue_entries (user_id, date);

-- revenue_entries: filter by stream (breakdown calc)
CREATE INDEX IF NOT EXISTS idx_revenue_entries_stream_date
  ON public.revenue_entries (stream_id, date);

-- partnerships: find all partners for a user (both directions)
CREATE INDEX IF NOT EXISTS idx_partnerships_user_a
  ON public.partnerships (user_a, status);

CREATE INDEX IF NOT EXISTS idx_partnerships_user_b
  ON public.partnerships (user_b, status);

-- achievements: fast lookup to avoid duplicate grants
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_user_type_unique
  ON public.achievements (user_id, type);

-- streak_freezes: lookup by user for freeze validation
CREATE INDEX IF NOT EXISTS idx_streak_freezes_user
  ON public.streak_freezes (user_id);
