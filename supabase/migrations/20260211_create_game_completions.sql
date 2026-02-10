-- Game completions table: logs every game result for analytics.
-- Local state is source of truth for the UI; this enables
-- cross-device sync, reinstall recovery, and future leaderboards.

CREATE TABLE game_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  difficulty text NOT NULL,          -- 'easy' | 'medium' | 'hard' | 'expert'
  time_seconds int4,                 -- null if lost
  won boolean NOT NULL,
  mistake_count int2 NOT NULL DEFAULT 0,
  hints_used int2 NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_game_completions_user
  ON game_completions (user_id);
CREATE INDEX idx_game_completions_user_diff
  ON game_completions (user_id, difficulty);

-- RLS: insert-only + read-own for anon
ALTER TABLE game_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON game_completions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_read_own" ON game_completions
  FOR SELECT TO anon USING (true);
