-- Enable RLS on user_streaks and allow anon to read/write.
-- This is permissive since there's no auth yet.
-- When real auth is added, tighten to: auth.uid()::text = user_id

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_access" ON user_streaks
  FOR ALL TO anon USING (true) WITH CHECK (true);
