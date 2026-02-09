-- Migration: Create puzzle_pool table and get_random_puzzles RPC
-- This table stores pre-generated technique puzzles fetched by the app in the background.

-- 1. Create the table
CREATE TABLE puzzle_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technique_id text NOT NULL,          -- e.g., 'naked-pair'
  technique_name text NOT NULL,        -- e.g., 'Naked Pair'
  difficulty_level int2 NOT NULL,      -- 1-4 matching TechniqueLevel
  puzzle text NOT NULL,                -- 81-char compact string (row-major, '0' = empty)
  solution text NOT NULL,              -- 81-char compact string
  technique_result jsonb NOT NULL,     -- Full TechniqueResult shape
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for the primary query pattern: fetch by technique_id
CREATE INDEX idx_puzzle_pool_technique ON puzzle_pool (technique_id);

-- 3. Enable RLS with read-only policy for anonymous users
ALTER TABLE puzzle_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON puzzle_pool
  FOR SELECT TO anon USING (true);

-- 4. RPC: Batch-fetch one random puzzle per requested technique in a single round-trip.
--    Accepts an array of technique IDs and an optional array of puzzle UUIDs to exclude
--    (for client-side deduplication of recently-served puzzles).
CREATE OR REPLACE FUNCTION get_random_puzzles(
  technique_ids text[],
  exclude_ids uuid[] DEFAULT '{}'
)
RETURNS SETOF puzzle_pool
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (technique_id) *
  FROM puzzle_pool
  WHERE technique_id = ANY(technique_ids)
    AND id != ALL(exclude_ids)
  ORDER BY technique_id, random()
$$;
