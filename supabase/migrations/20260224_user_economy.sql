-- user_economy: Fishies/Mochis balances and economy-related fields for cross-device sync.
-- Local state is source of truth; this table is best-effort sync.

CREATE TABLE IF NOT EXISTS user_economy (
  user_id text PRIMARY KEY,
  total_fishy_points integer NOT NULL DEFAULT 0,
  total_mochi_points integer NOT NULL DEFAULT 0,
  streak_freeze_count integer NOT NULL DEFAULT 0,
  last_daily_login_date text,
  last_first_puzzle_date text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_economy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_access" ON user_economy
  FOR ALL TO anon USING (true) WITH CHECK (true);
