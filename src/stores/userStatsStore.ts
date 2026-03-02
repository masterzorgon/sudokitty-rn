import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import { Difficulty } from '../engine/types';

export interface BestTimeRecord {
  timeSeconds: number;
  mistakeCount: number;
  hintsUsed: number;
}

export interface DifficultyStats {
  gamesWon: number;
  bestTime: BestTimeRecord | null;
  totalTimeSeconds: number;
  hintFreeWins: number;
  perfectWins: number;
}

interface UserStatsState {
  byDifficulty: Record<Difficulty, DifficultyStats>;
  currentWinStreak: number;
  longestWinStreak: number;
}

interface UserStatsActions {
  recordWin: (difficulty: Difficulty, timeSeconds: number, mistakeCount: number, hintsUsed: number, continueCount: number) => void;
  recordLoss: () => void;
  resetStats: () => void;
}

const createEmptyDifficultyStats = (): DifficultyStats => ({
  gamesWon: 0,
  bestTime: null,
  totalTimeSeconds: 0,
  hintFreeWins: 0,
  perfectWins: 0,
});

const INITIAL_STATE: UserStatsState = {
  byDifficulty: {
    easy: createEmptyDifficultyStats(),
    medium: createEmptyDifficultyStats(),
    hard: createEmptyDifficultyStats(),
    expert: createEmptyDifficultyStats(),
  },
  currentWinStreak: 0,
  longestWinStreak: 0,
};

export const useUserStatsStore = create<UserStatsState & UserStatsActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      recordWin: (difficulty, timeSeconds, mistakeCount, hintsUsed, continueCount) => {
        const state = get();
        const diffStats = { ...state.byDifficulty[difficulty] };

        diffStats.gamesWon += 1;
        diffStats.totalTimeSeconds += timeSeconds;

        if (diffStats.bestTime === null || timeSeconds < diffStats.bestTime.timeSeconds) {
          diffStats.bestTime = { timeSeconds, mistakeCount, hintsUsed };
        }
        if (hintsUsed === 0) diffStats.hintFreeWins += 1;
        if (mistakeCount === 0 && continueCount === 0) diffStats.perfectWins += 1;

        const newWinStreak = state.currentWinStreak + 1;

        set({
          byDifficulty: { ...state.byDifficulty, [difficulty]: diffStats },
          currentWinStreak: newWinStreak,
          longestWinStreak: Math.max(newWinStreak, state.longestWinStreak),
        });
      },

      recordLoss: () => {
        set({ currentWinStreak: 0 });
      },

      resetStats: () => {
        set(INITIAL_STATE);
      },
    }),
    {
      name: '@sudokitty/user_stats',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useUserStats = () => useUserStatsStore((s) => s.byDifficulty);
export const useLongestWinStreak = () => useUserStatsStore((s) => s.longestWinStreak);
export const useTotalGamesWon = () =>
  useUserStatsStore(
    useShallow((s) =>
      Object.values(s.byDifficulty).reduce((sum, d) => sum + d.gamesWon, 0)
    )
  );
export const useTotalHintFreeWins = () =>
  useUserStatsStore(
    useShallow((s) =>
      Object.values(s.byDifficulty).reduce((sum, d) => sum + d.hintFreeWins, 0)
    )
  );
export const useTotalPerfectWins = () =>
  useUserStatsStore(
    useShallow((s) =>
      Object.values(s.byDifficulty).reduce((sum, d) => sum + d.perfectWins, 0)
    )
  );
