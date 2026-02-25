// One-time economy v2 migration: reset Fishies and Mochis balances and set flag.
// Run before loading stores so that loadState() reads the reset values.

import { storage, STORAGE_KEYS } from '../utils/storage';

const FLAG_VALUE = true;

export async function runEconomyV2Migration(): Promise<void> {
  const applied = await storage.get<boolean>(STORAGE_KEYS.ECONOMY_V2_APPLIED);
  if (applied === FLAG_VALUE) return;

  await storage.set<{ totalFishyPoints: number }>(STORAGE_KEYS.FISHY_STATE, {
    totalFishyPoints: 0,
  });

  const dailyStored = await storage.get<{
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
    completedDates: string[];
    totalMochiPoints: number;
    totalGamesWon?: number;
  }>(STORAGE_KEYS.DAILY_CHALLENGE_STATE);

  if (dailyStored) {
    await storage.set(STORAGE_KEYS.DAILY_CHALLENGE_STATE, {
      ...dailyStored,
      totalMochiPoints: 0,
    });
  }

  await storage.set(STORAGE_KEYS.MOCHI_HISTORY, []);

  await storage.set(STORAGE_KEYS.ECONOMY_V2_APPLIED, FLAG_VALUE);
}
