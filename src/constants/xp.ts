import { type Difficulty } from '../engine/types';

export const GAME_BASE_XP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
};

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

/** Cumulative XP needed to reach a given level. */
export function xpForLevel(level: number): number {
  return 100 * level + 10 * level * level;
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
