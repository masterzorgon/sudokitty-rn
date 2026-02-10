// Streak Sync Service
// Background sync of local streak state to/from Supabase user_streaks table.
// Local state is always the source of truth for the UI.
// Supabase sync is best-effort — failures are silent and don't affect the app.

import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/deviceId';

// ============================================
// Types
// ============================================

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  totalGamesWon: number;
}

interface UserStreaksRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date_local: string | null;
  total_games: number;
  updated_at: string;
}

// ============================================
// Dev Logging
// ============================================

function log(msg: string, ...args: unknown[]) {
  if (__DEV__) console.log(`[StreakSync] ${msg}`, ...args);
}

// ============================================
// Public API
// ============================================

/**
 * Push local streak state to Supabase.
 * Uses upsert so it creates or updates the row.
 * Fire-and-forget — call after every game win.
 */
export async function syncStreakToSupabase(state: StreakState): Promise<void> {
  try {
    const deviceId = await getDeviceId();

    const { error } = await supabase.from('user_streaks').upsert(
      {
        user_id: deviceId,
        current_streak: state.currentStreak,
        longest_streak: state.longestStreak,
        last_completed_date_local: state.lastCompletedDate,
        total_games: state.totalGamesWon,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      log('Upsert error:', error.message);
    } else {
      log('Synced to Supabase:', {
        streak: state.currentStreak,
        longest: state.longestStreak,
        totalGames: state.totalGamesWon,
      });
    }
  } catch (err) {
    log('Sync failed:', err);
    // Silently fail — local state is the source of truth
  }
}

/**
 * Pull streak state from Supabase on app launch.
 * Returns the remote state if it exists, or null if no row / error.
 * The caller decides whether to adopt the remote values.
 */
export async function pullStreakFromSupabase(): Promise<StreakState | null> {
  try {
    const deviceId = await getDeviceId();

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      // PGRST116 = no rows found (expected on first launch)
      if (error.code !== 'PGRST116') {
        log('Pull error:', error.message);
      }
      return null;
    }

    if (!data) return null;

    const row = data as UserStreaksRow;
    log('Pulled from Supabase:', {
      streak: row.current_streak,
      longest: row.longest_streak,
      totalGames: row.total_games,
    });

    return {
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastCompletedDate: row.last_completed_date_local,
      totalGamesWon: row.total_games ?? 0,
    };
  } catch (err) {
    log('Pull failed:', err);
    return null;
  }
}
