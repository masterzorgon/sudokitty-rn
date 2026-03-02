import { useGameStore } from '../stores/gameStore';
import { usePlayerStreakStore } from '../stores/playerStreakStore';
import { usePlayerProgressStore } from '../stores/playerProgressStore';
import { useUserStatsStore } from '../stores/userStatsStore';
import { calculateMochiReward } from '../engine/types';
import { calculateXPReward } from '../constants/xp';

export function handleGameWon(): void {
  const { difficulty, timeElapsed, mistakeCount, hintsUsed, isDaily, continueCount } =
    useGameStore.getState();

  // Add XP before recordGameWin so streak sync includes updated totalXP
  const xpReward = calculateXPReward(difficulty, timeElapsed);
  usePlayerProgressStore.getState().addXP(xpReward);

  usePlayerStreakStore.getState().recordGameWin();

  if (!isDaily) {
    const mochiReward = calculateMochiReward(difficulty, timeElapsed);
    usePlayerStreakStore.getState().addMochiHistoryEntry(mochiReward, 'game');
  }

  useUserStatsStore.getState().recordWin(difficulty, timeElapsed, mistakeCount, hintsUsed, continueCount);

  const isFirstPuzzleOfDay = usePlayerStreakStore.getState().recordFirstPuzzleOfDayIfNeeded();
  if (isFirstPuzzleOfDay) {
    usePlayerStreakStore.getState().addMochiHistoryEntry(15, 'bonus');
  }
}

export function handleGameLost(): void {
  useUserStatsStore.getState().recordLoss();
}
