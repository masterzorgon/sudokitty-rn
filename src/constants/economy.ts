// Dual-currency economy constants and helpers
// Fishies: earn (game, daily login, first puzzle), IAP, spend. Mochis: convert from Fishies only, spend.

import type { Difficulty } from '../engine/types';

// ============================================
// Fishies earn (puzzle completion - win only)
// ============================================

/** Base Fishies per difficulty (awarded on win) */
export const FISHIES_BASE: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
  expert: 35,
};

/** Max time bonus Fishies (earned when under par time) */
export const FISHIES_TIME_BONUS_MAX: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
  expert: 20,
};

/** Par time in seconds; under this grants time bonus (Easy 4min, Medium 7min, Hard 12min, Expert 18min) */
export const FISHIES_PAR_TIMES: Record<Difficulty, number> = {
  easy: 4 * 60,    // 240
  medium: 7 * 60,  // 420
  hard: 12 * 60,   // 720
  expert: 18 * 60, // 1080
};

/** Daily login bonus (once per calendar day on app open) */
export const DAILY_LOGIN_FISHIES = 5;

/** First puzzle of the day bonus (once per calendar day on first win) */
export const FIRST_PUZZLE_FISHIES = 15;

// ============================================
// Fishies spend (consumables)
// ============================================

export const FISHIES_COST = {
  hint: 10,
  hint_pack_5: 40,
  life: 25,
  life_refill: 60,
  streak_freeze: 100,
  continue: 25,
} as const;

// ============================================
// Conversion
// ============================================

export const FISHIES_PER_MOCHI = 50;

// ============================================
// Mochis spend (premium)
// ============================================

export const MOCHIS_COST = {
  common_box: 10,
  rare_box: 40,
  legendary_box: 100,
  backing_track: 15,
} as const;

// ============================================
// RevenueCat product IDs (Fishies packs)
// ============================================

export const FISHIES_PACK_PRODUCT_IDS = [
  'fishies_150',   // $0.99
  'fishies_350',   // $1.99
  'fishies_1000',  // $4.99
  'fishies_2200',  // $9.99
  'fishies_5000',  // $19.99
] as const;

export const FISHIES_PACK_AMOUNTS: Record<string, number> = {
  fishies_150: 150,
  fishies_350: 350,
  fishies_1000: 1000,
  fishies_2200: 2200,
  fishies_5000: 5000,
};

// ============================================
// Transaction types
// ============================================

export type FishyTransactionSource =
  | 'game'
  | 'daily_login'
  | 'first_puzzle'
  | 'iap'
  | 'conversion_to_mochis'
  | 'hint'
  | 'hint_pack'
  | 'life'
  | 'life_refill'
  | 'streak_freeze'
  | 'continue';

export interface FishyTransactionEntry {
  id: string;
  timestamp: number;
  amount: number;
  source: FishyTransactionSource;
  metadata?: Record<string, unknown>;
}

const MAX_HISTORY_LENGTH = 500;

export function createFishyTransactionEntry(
  amount: number,
  source: FishyTransactionSource,
  metadata?: Record<string, unknown>
): FishyTransactionEntry {
  return {
    id: `ft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    amount,
    source,
    metadata,
  };
}

// ============================================
// Reward calculation
// ============================================

/**
 * Compute Fishies earned for a completed puzzle (win only).
 * Base + time bonus (0 to max) when under par time.
 */
export function calculateFishyReward(difficulty: Difficulty, timeSeconds: number): number {
  const base = FISHIES_BASE[difficulty];
  const maxBonus = FISHIES_TIME_BONUS_MAX[difficulty];
  const parSeconds = FISHIES_PAR_TIMES[difficulty];

  if (timeSeconds >= parSeconds) {
    return base;
  }

  const ratio = 1 - timeSeconds / parSeconds;
  const bonus = Math.round(maxBonus * ratio);
  return base + bonus;
}

export function trimFishyHistory(history: FishyTransactionEntry[]): FishyTransactionEntry[] {
  if (history.length <= MAX_HISTORY_LENGTH) return history;
  return history.slice(-MAX_HISTORY_LENGTH);
}
