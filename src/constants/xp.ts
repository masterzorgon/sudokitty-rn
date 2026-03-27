import { type Difficulty } from '../engine/types';

/** Flat base points per correct placement (difficulty-agnostic during play). */
export const POINTS_PER_PLACEMENT = 10;

export const UNIT_COMPLETION_BONUS = 250;

/** Applied to `xpEarnedThisGame` when the player wins (modest reward for harder puzzles). */
export const DIFFICULTY_XP_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
  expert: 2.0,
};

export function getStreakMultiplier(streak: number): number {
  if (streak >= 10) return 3.0;
  if (streak >= 6) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

/** Cumulative XP needed to reach a given level (cubic — quick early levels, steeper at high level). */
export function xpForLevel(level: number): number {
  return level * (15 * level * level + 150 * level + 5000);
}

/**
 * Highest level the player has legitimately reached for this `totalXP`.
 * Keeps persisted `level` in sync when level thresholds change or after restores.
 */
export function levelFromTotalXP(totalXP: number): number {
  const xp = Math.max(0, Math.floor(totalXP));
  let level = 0;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function xpToNextLevel(totalXP: number, currentLevel: number): number {
  return Math.max(0, xpForLevel(currentLevel + 1) - totalXP);
}

export function xpProgressFraction(totalXP: number, currentLevel: number): number {
  const prev = xpForLevel(currentLevel);
  const next = xpForLevel(currentLevel + 1);
  const range = next - prev;
  if (range <= 0) return 1;
  return Math.min(1, Math.max(0, (totalXP - prev) / range));
}
