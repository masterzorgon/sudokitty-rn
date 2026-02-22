-- Add mochi points balance to user_streaks for cross-device sync
ALTER TABLE user_streaks
  ADD COLUMN IF NOT EXISTS total_mochi_points integer NOT NULL DEFAULT 0;
