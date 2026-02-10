// Game Completion Service
// Logs every game result (win or loss) to Supabase for durable analytics.
// Fire-and-forget — failures are silent, local state is source of truth.

import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/deviceId';
import { Difficulty } from '../engine/types';

function log(msg: string, ...args: unknown[]) {
  if (__DEV__) console.log(`[GameCompletion] ${msg}`, ...args);
}

/**
 * Log a game completion to Supabase. Fire-and-forget.
 * Called via subscription when gameStatus transitions to 'won' or 'lost'.
 */
export async function recordGameCompletion(params: {
  difficulty: Difficulty;
  timeSeconds: number;
  won: boolean;
  mistakeCount: number;
  hintsUsed: number;
}): Promise<void> {
  try {
    const deviceId = await getDeviceId();

    const { error } = await supabase.from('game_completions').insert({
      user_id: deviceId,
      difficulty: params.difficulty,
      time_seconds: params.won ? params.timeSeconds : null,
      won: params.won,
      mistake_count: params.mistakeCount,
      hints_used: params.hintsUsed,
    });

    if (error) {
      log('Insert error:', error.message);
    } else {
      log('Recorded:', params);
    }
  } catch (err) {
    log('Failed:', err);
  }
}
