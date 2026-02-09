// Supabase client initialization
//
// Keys are loaded from .env via Expo's built-in EXPO_PUBLIC_ env var support.
// The anon key is safe to ship in the app bundle — the puzzle_pool table
// has RLS enabled with a read-only policy for the anon role.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
