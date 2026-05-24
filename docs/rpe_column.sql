-- RPE (Rate of Perceived Exertion) - vapaaehtoinen 1-10 per sarja
-- Aja tämä Supabase Dashboardissa: SQL Editor → New query → liitä → Run

ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS rpe smallint CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));
