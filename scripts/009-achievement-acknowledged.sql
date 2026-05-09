-- Achievement-Unlock-Modal "ack" tracking. The check-achievements cron writes
-- rows into achievements as users hit milestones. We expose those unlocks as a
-- one-shot full-screen celebration on next dashboard mount and gate it on
-- acknowledged_at to avoid re-prompting.

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_achievements_unacknowledged
  ON achievements (user_id)
  WHERE acknowledged_at IS NULL;
