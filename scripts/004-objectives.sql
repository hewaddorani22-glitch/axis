-- Wave 2: Objectives / Themes
-- Introduces a shared objective model so tasks, habits, and revenue streams can roll up into one operating layer.

CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rollup_type TEXT NOT NULL DEFAULT 'missions' CHECK (rollup_type IN ('missions', 'revenue', 'habits')),
  target_value DECIMAL(12,2),
  unit TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE,
  color TEXT DEFAULT '#CDFF4F',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Objectives: own data" ON objectives FOR ALL USING (auth.uid() = user_id);

ALTER TABLE missions ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_objectives_user_id ON objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_objective_id ON missions(objective_id);
CREATE INDEX IF NOT EXISTS idx_habits_objective_id ON habits(objective_id);
CREATE INDEX IF NOT EXISTS idx_revenue_streams_objective_id ON revenue_streams(objective_id);
