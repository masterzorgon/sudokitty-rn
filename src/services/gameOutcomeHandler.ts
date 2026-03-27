import { useGameStore } from '../stores/gameStore';
import { usePlayerStreakStore } from '../stores/playerStreakStore';
import { usePlayerProgressStore } from '../stores/playerProgressStore';
import { useUserStatsStore } from '../stores/userStatsStore';
import { calculateMochiReward } from '../engine/types';
import { DIFFICULTY_XP_MULTIPLIER } from '../constants/xp';

export function handleGameWon(): void {
  const { difficulty, timeElapsed, mistakeCount, hintsUsed, isDaily, continueCount, xpEarnedThisGame } =
    useGameStore.getState();

  // In-game points × modest difficulty multiplier (matches end-game screen)
  const xpReward = Math.round(xpEarnedThisGame * DIFFICULTY_XP_MULTIPLIER[difficulty]);
  usePlayerProgressStore.getState().addXP(xpReward);

  usePlayerStreakStore.getState().recordGameWin();
  usePlayerStreakStore.getState().recordGamePlayed();

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
  usePlayerStreakStore.getState().recordGamePlayed();
}
