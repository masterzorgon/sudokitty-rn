// Economy Sync Service
// Pushes local Mochis and related fields to Supabase user_economy.
// Local state is source of truth; sync is best-effort and failures are silent.

import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/deviceId';
import { usePlayerStreakStore } from '../stores/playerStreakStore';

// ============================================
// Types
// ============================================

export interface EconomyState {
  totalMochiPoints: number;
  streakFreezesCount: number;
  lastDailyLoginDate: string | null;
  lastFirstPuzzleDate: string | null;
}

interface UserEconomyRow {
  user_id: string;
  total_fishy_points: number;
  total_mochi_points: number;
  streak_freeze_count: number;
  last_daily_login_date: string | null;
  last_first_puzzle_date: string | null;
  updated_at: string;
}

// ============================================
// Dev Logging
// ============================================

function log(msg: string, ...args: unknown[]) {
  if (__DEV__) console.log(`[EconomySync] ${msg}`, ...args);
}

// ============================================
// Public API
// ============================================

/**
 * Build current economy state from daily challenge store.
 */
export function getEconomyState(): EconomyState {
  const daily = usePlayerStreakStore.getState();
  return {
    totalMochiPoints: daily.totalMochiPoints,
    streakFreezesCount: daily.streakFreezesCount ?? 0,
    lastDailyLoginDate: daily.lastDailyLoginDate ?? null,
    lastFirstPuzzleDate: daily.lastFirstPuzzleDate ?? null,
  };
}

/**
 * Push current economy state to Supabase.
 * Call after any balance or economy-field change (Mochis, streak freezes, dates).
 * Fire-and-forget; errors are logged only in dev.
 */
export async function syncEconomyToSupabase(state?: EconomyState): Promise<void> {
  const s = state ?? getEconomyState();
  try {
    const deviceId = await getDeviceId();

    const { error } = await supabase.from('user_economy').upsert(
      {
        user_id: deviceId,
        total_fishy_points: 0,
        total_mochi_points: s.totalMochiPoints,
        streak_freeze_count: s.streakFreezesCount,
        last_daily_login_date: s.lastDailyLoginDate,
        last_first_puzzle_date: s.lastFirstPuzzleDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      log('Upsert error:', error.message);
    } else {
      log('Synced to Supabase:', { mochis: s.totalMochiPoints });
    }
  } catch (err) {
    log('Sync failed:', err);
  }
}

/**
 * Pull economy state from Supabase (e.g. on app launch).
 * Returns remote state or null if no row / error.
 * Caller can merge with local (e.g. take max by updated_at) or use local-first only.
 */
export async function pullEconomyFromSupabase(): Promise<EconomyState | null> {
  try {
    const deviceId = await getDeviceId();

    const { data, error } = await supabase
      .from('user_economy')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        log('Pull error:', error.message);
      }
      return null;
    }

    if (!data) return null;

    const row = data as UserEconomyRow;
    log('Pulled from Supabase:', { mochis: row.total_mochi_points });

    return {
      totalMochiPoints: row.total_mochi_points ?? 0,
      streakFreezesCount: row.streak_freeze_count ?? 0,
      lastDailyLoginDate: row.last_daily_login_date ?? null,
      lastFirstPuzzleDate: row.last_first_puzzle_date ?? null,
    };
  } catch (err) {
    log('Pull failed:', err);
    return null;
  }
}
