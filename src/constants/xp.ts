import { GAME_PAR_TIMES, type Difficulty } from '../engine/types';

export const GAME_BASE_XP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
};

export function calculateXPReward(difficulty: Difficulty, timeSeconds: number): number {
  const base = GAME_BASE_XP[difficulty];
  const par = GAME_PAR_TIMES[difficulty];
  const ratio = Math.min(2, Math.max(1, par / Math.max(timeSeconds, 1)));
  return Math.round(base * ratio);
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
