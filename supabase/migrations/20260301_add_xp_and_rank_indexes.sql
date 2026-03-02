ALTER TABLE user_streaks
  ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_streaks_total_xp ON user_streaks (total_xp);
CREATE INDEX IF NOT EXISTS idx_user_streaks_total_games ON user_streaks (total_games);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak ON user_streaks (current_streak);

CREATE INDEX IF NOT EXISTS idx_game_completions_difficulty_won
  ON game_completions (difficulty, won)
  WHERE won = true;
