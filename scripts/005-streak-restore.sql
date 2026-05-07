-- Streak Restore (Pro one-time benefit)
--
-- A user who upgrades to Pro after their streak broke can restore it once.
-- We don't reuse streak_freezes because that table has UNIQUE(user_id, month),
-- so it can't bridge a multi-day gap.
--
-- streak_restores stores the restored bridge as a half-open range
-- [bridge_from_date, bridge_to_date]. The streak hook treats every day in that
-- range as if both a mission AND a habit were completed.

CREATE TABLE IF NOT EXISTS streak_restores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bridge_from_date DATE NOT NULL,
  bridge_to_date DATE NOT NULL,
  peak_streak INTEGER NOT NULL CHECK (peak_streak >= 1 AND peak_streak <= 365),
  CONSTRAINT bridge_range_valid CHECK (bridge_from_date <= bridge_to_date),
  CONSTRAINT one_restore_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_streak_restores_user ON streak_restores(user_id);

ALTER TABLE streak_restores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Streak Restores: own data" ON streak_restores;
CREATE POLICY "Streak Restores: own data" ON streak_restores
  FOR ALL USING (auth.uid() = user_id);

-- Track the latest restore on the user for quick eligibility checks
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_restored_at TIMESTAMPTZ;
