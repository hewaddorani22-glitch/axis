-- AXIS Database Schema
-- Run this against your Supabase PostgreSQL database

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  onboarding_done BOOLEAN DEFAULT false,
  user_type TEXT, -- entrepreneur, student, creator, professional
  timezone TEXT DEFAULT 'UTC',
  stripe_customer_id TEXT,
  prove_it_username TEXT UNIQUE,
  prove_it_bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Objectives / Themes
CREATE TABLE objectives (
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

-- Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'med' CHECK (priority IN ('high', 'med', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
  estimated_time INTEGER, -- in minutes
  energy_level TEXT CHECK (energy_level IN ('high', 'med', 'low')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Streams
CREATE TABLE revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#CDFF4F',
  is_recurring BOOLEAN DEFAULT false,
  objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Entries
CREATE TABLE revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES revenue_streams(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '◆',
  objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
  target_value DECIMAL(12,2),
  unit TEXT,
  archived BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habit Logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value DECIMAL(12,2),
  skipped BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  UNIQUE(habit_id, date)
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  unit TEXT,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Reviews
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  wins TEXT,
  struggles TEXT,
  next_week_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Accountability Partners
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Nudges
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Scores (cached)
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_pct DECIMAL(5,2),
  habit_pct DECIMAL(5,2),
  streak_length INTEGER,
  focus_score INTEGER,
  grade TEXT,
  UNIQUE(user_id, date)
);

-- Streak Freezes (Pro)
CREATE TABLE streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  used_on DATE NOT NULL,
  month DATE NOT NULL,
  UNIQUE(user_id, month)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Objectives: own data" ON objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Missions: own data" ON missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Revenue Streams: own data" ON revenue_streams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Revenue Entries: own data" ON revenue_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Habits: own data" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Habit Logs: own data" ON habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Goals: own data" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Weekly Reviews: own data" ON weekly_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Achievements: own data" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Daily Scores: own data" ON daily_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Streak Freezes: own data" ON streak_freezes FOR ALL USING (auth.uid() = user_id);

-- Partnerships: both users can read
CREATE POLICY "Partnerships: read own" ON partnerships FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Partnerships: create own" ON partnerships FOR INSERT WITH CHECK (auth.uid() = user_a);
CREATE POLICY "Partnerships: update own" ON partnerships FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Nudges: sender and receiver can read
CREATE POLICY "Nudges: read own" ON nudges FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "Nudges: create own" ON nudges FOR INSERT WITH CHECK (auth.uid() = from_user);
