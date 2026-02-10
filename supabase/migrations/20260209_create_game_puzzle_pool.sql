-- Migration: Create game_puzzle_pool table and get_random_game_puzzle RPC
-- Pre-generated game puzzles with guaranteed difficulty validation.

-- 1. Create the table
CREATE TABLE game_puzzle_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty text NOT NULL,            -- 'easy' | 'medium' | 'hard' | 'expert'
  clue_count int2 NOT NULL,            -- Number of given clues
  max_technique_level int2 NOT NULL,   -- Highest technique level required to solve
  puzzle text NOT NULL,                -- 81-char compact string (row-major, '0' = empty)
  solution text NOT NULL,              -- 81-char compact string
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for the primary query pattern: fetch by difficulty
CREATE INDEX idx_game_puzzle_pool_difficulty ON game_puzzle_pool (difficulty);

-- 3. Enable RLS with read-only policy for anonymous users
ALTER TABLE game_puzzle_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON game_puzzle_pool
  FOR SELECT TO anon USING (true);

-- 4. RPC: Fetch one random game puzzle for a given difficulty.
--    Accepts an optional array of puzzle UUIDs to exclude (for dedup).
CREATE OR REPLACE FUNCTION get_random_game_puzzle(
  target_difficulty text,
  exclude_ids uuid[] DEFAULT '{}'
)
RETURNS SETOF game_puzzle_pool
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM game_puzzle_pool
  WHERE difficulty = target_difficulty
    AND id != ALL(exclude_ids)
  ORDER BY random()
  LIMIT 1
$$;
