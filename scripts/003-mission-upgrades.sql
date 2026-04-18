-- Migration: Mission Upgrades

-- Add estimated_time (in minutes) and energy_level to missions table
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER,
ADD COLUMN IF NOT EXISTS energy_level TEXT CHECK (energy_level IN ('high', 'med', 'low'));

