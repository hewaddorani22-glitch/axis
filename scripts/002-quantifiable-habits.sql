-- Migration: Quantifiable Habits and Skip Mechanics

-- Add quantifiable fields to habits
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS target_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Add tracking fields to habit_logs
ALTER TABLE habit_logs 
ADD COLUMN IF NOT EXISTS value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

-- Add recurring flag to revenue streams for MRR calculations
ALTER TABLE revenue_streams
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Because we added a new 'skipped' state, we need to update our logic for streaks.
-- If skipped is true, the habit won't count against the streak.
