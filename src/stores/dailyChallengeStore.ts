// Daily challenge state management with Zustand
// Handles streaks, completions, and activity tracking

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  Difficulty,
  DailyChallenge,
  DailyChallengeState,
  ActivityDay,
  MochiHistoryEntry,
  ChartTimePeriod,
  DAILY_MOCHI_POINTS,
  DAILY_DIFFICULTY_SCHEDULE,
  CONTINUE_COST,
  PERIOD_MS,
  getTodayDateString,
  getYesterdayDateString,
  getDateSeed,
  createEmptyDailyChallengeState,
} from '../engine/types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { syncStreakToSupabase, pullStreakFromSupabase } from '../services/streakSyncService';

interface DailyChallengeStore extends DailyChallengeState {
  // Loading state
  isLoaded: boolean;

  // Mochi history for chart
  mochiHistory: MochiHistoryEntry[];

  // Actions
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  completeChallenge: () => void;
  recordGameWin: () => void; // Called on ANY game win (regular or daily)
  syncFromRemote: () => Promise<void>; // Pull remote streak on launch
  getTodayChallenge: () => DailyChallenge;
  getActivityData: (weeks?: number) => ActivityDay[];
  isTodayCompleted: () => boolean;
  getSimulatedParticipants: () => number;

  // Mochi history methods
  getMochiHistory: (period: ChartTimePeriod) => MochiHistoryEntry[];
  getMochiEarnedToday: () => number;
  addMochiHistoryEntry: (amount: number, source: 'daily' | 'game' | 'bonus') => void;
  spendMochis: (amount: number, reason: string) => boolean;

  // For testing/debugging
  resetState: () => void;
}

function syncMochiBalance(state: DailyChallengeStore) {
  syncStreakToSupabase({
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    lastCompletedDate: state.lastCompletedDate,
    totalGamesWon: state.totalGamesWon,
    totalMochiPoints: state.totalMochiPoints,
  });
}

export const useDailyChallengeStore = create<DailyChallengeStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      ...createEmptyDailyChallengeState(),
      isLoaded: false,
      mochiHistory: [],

      // Load state from AsyncStorage
      loadState: async () => {
        const stored = await storage.get<DailyChallengeState>(
          STORAGE_KEYS.DAILY_CHALLENGE_STATE
        );
        const storedHistory = await storage.get<MochiHistoryEntry[]>(
          STORAGE_KEYS.MOCHI_HISTORY
        );

        if (stored) {
          set((state) => {
            state.currentStreak = stored.currentStreak;
            state.longestStreak = stored.longestStreak;
            state.lastCompletedDate = stored.lastCompletedDate;
            state.completedDates = stored.completedDates;
            state.totalMochiPoints = stored.totalMochiPoints;
            state.totalGamesWon = stored.totalGamesWon ?? 0; // Backward-compatible
            state.mochiHistory = storedHistory || [];
            state.isLoaded = true;
          });

          // Check if streak needs to be reset (missed a day)
          const today = getTodayDateString();
          const yesterday = getYesterdayDateString();
          const { lastCompletedDate, currentStreak } = get();

          if (
            lastCompletedDate !== null &&
            lastCompletedDate !== today &&
            lastCompletedDate !== yesterday &&
            currentStreak > 0
          ) {
            // Missed more than one day, reset streak
            set((state) => {
              state.currentStreak = 0;
            });
            get().saveState();
          }
        } else {
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // Save state to AsyncStorage
      saveState: async () => {
        const { currentStreak, longestStreak, lastCompletedDate, completedDates, totalMochiPoints, totalGamesWon, mochiHistory } =
          get();
        await storage.set<DailyChallengeState>(STORAGE_KEYS.DAILY_CHALLENGE_STATE, {
          currentStreak,
          longestStreak,
          lastCompletedDate,
          completedDates,
          totalMochiPoints,
          totalGamesWon,
        });
        await storage.set<MochiHistoryEntry[]>(STORAGE_KEYS.MOCHI_HISTORY, mochiHistory);
      },

      // Complete today's challenge
      completeChallenge: () => {
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const { lastCompletedDate, currentStreak, longestStreak, completedDates, totalMochiPoints, mochiHistory } = get();

        // Already completed today
        if (lastCompletedDate === today) {
          return;
        }

        const challenge = get().getTodayChallenge();
        let newStreak: number;

        if (lastCompletedDate === yesterday) {
          // Continuing streak
          newStreak = currentStreak + 1;
        } else {
          // Starting new streak (first completion or missed a day)
          newStreak = 1;
        }

        // Create mochi history entry
        const historyEntry: MochiHistoryEntry = {
          date: today,
          timestamp: Date.now(),
          amount: challenge.mochiPoints,
          cumulativeTotal: totalMochiPoints + challenge.mochiPoints,
          source: 'daily',
        };

        set((state) => {
          state.currentStreak = newStreak;
          state.longestStreak = Math.max(longestStreak, newStreak);
          state.lastCompletedDate = today;
          state.completedDates = [...completedDates, today];
          state.totalMochiPoints += challenge.mochiPoints;
          state.mochiHistory = [...mochiHistory, historyEntry];
        });

        get().saveState();
      },

      // Record any game win (regular or daily) — updates streak + syncs to Supabase
      recordGameWin: () => {
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const { lastCompletedDate, currentStreak, longestStreak, completedDates, totalGamesWon } = get();

        let newStreak = currentStreak;
        let newLastCompleted = lastCompletedDate;

        // Only update streak once per day (first win of the day)
        if (lastCompletedDate !== today) {
          if (lastCompletedDate === yesterday) {
            newStreak = currentStreak + 1;
          } else {
            newStreak = 1;
          }
          newLastCompleted = today;
        }

        const newLongest = Math.max(longestStreak, newStreak);
        const newTotalGames = totalGamesWon + 1;

        set((state) => {
          state.currentStreak = newStreak;
          state.longestStreak = newLongest;
          state.lastCompletedDate = newLastCompleted;
          state.totalGamesWon = newTotalGames;
          // Add today to completedDates if not already there
          if (!completedDates.includes(today)) {
            state.completedDates = [...completedDates, today];
          }
        });

        get().saveState();

        // Background sync to Supabase (fire-and-forget)
        syncStreakToSupabase({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCompletedDate: newLastCompleted,
          totalGamesWon: newTotalGames,
          totalMochiPoints: get().totalMochiPoints,
        });
      },

      // Pull streak from Supabase and adopt if remote is higher
      syncFromRemote: async () => {
        const remote = await pullStreakFromSupabase();
        if (!remote) return;

        const local = get();

        // Adopt remote values if they're higher (e.g., after reinstall)
        let updated = false;
        if (remote.currentStreak > local.currentStreak) {
          set((state) => {
            state.currentStreak = remote.currentStreak;
          });
          updated = true;
        }
        if (remote.longestStreak > local.longestStreak) {
          set((state) => {
            state.longestStreak = remote.longestStreak;
          });
          updated = true;
        }
        if (remote.totalGamesWon > local.totalGamesWon) {
          set((state) => {
            state.totalGamesWon = remote.totalGamesWon;
          });
          updated = true;
        }
        if (remote.lastCompletedDate && (!local.lastCompletedDate || remote.lastCompletedDate > local.lastCompletedDate)) {
          set((state) => {
            state.lastCompletedDate = remote.lastCompletedDate;
          });
          updated = true;
        }
        if (remote.totalMochiPoints > local.totalMochiPoints) {
          set((state) => {
            state.totalMochiPoints = remote.totalMochiPoints;
          });
          updated = true;
        }

        if (updated) {
          get().saveState();
        }
      },

      // Get today's challenge configuration
      getTodayChallenge: (): DailyChallenge => {
        const today = getTodayDateString();
        const dayOfWeek = new Date().getDay(); // 0 = Sunday
        const difficulty = DAILY_DIFFICULTY_SCHEDULE[dayOfWeek];
        const seed = getDateSeed(today);
        const mochiPoints = DAILY_MOCHI_POINTS[difficulty];

        return {
          date: today,
          difficulty,
          seed,
          mochiPoints,
        };
      },

      // Get activity data for calendar (default 52 weeks)
      getActivityData: (weeks = 52): ActivityDay[] => {
        const { completedDates } = get();
        const completedSet = new Set(completedDates);
        const days: ActivityDay[] = [];

        const today = new Date();
        // Start from the beginning of the week (Sunday) for weeks * 7 days ago
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (weeks * 7) + 1);
        // Adjust to start on Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(today);

        const current = new Date(startDate);
        while (current <= endDate) {
          const dateString = current.toISOString().split('T')[0];
          days.push({
            date: dateString,
            completed: completedSet.has(dateString),
          });
          current.setDate(current.getDate() + 1);
        }

        return days;
      },

      // Check if today is already completed
      isTodayCompleted: (): boolean => {
        const today = getTodayDateString();
        return get().lastCompletedDate === today;
      },

      // Get simulated participant count (grows throughout the day)
      getSimulatedParticipants: (): number => {
        const today = getTodayDateString();
        const seed = getDateSeed(today);
        const now = new Date();
        const hoursElapsed = now.getHours() + now.getMinutes() / 60;

        // Base count varies by day (seeded random)
        const baseCount = 150 + (seed % 200);
        // Grows by 8-15 per hour based on seed
        const growthRate = 8 + (seed % 7);
        // Add some noise based on minutes
        const noise = (now.getMinutes() % 10) - 5;

        return Math.floor(baseCount + hoursElapsed * growthRate + noise);
      },

      // Get mochi history filtered by time period
      getMochiHistory: (period: ChartTimePeriod): MochiHistoryEntry[] => {
        const { mochiHistory } = get();
        const now = Date.now();
        const cutoff = now - PERIOD_MS[period];
        return mochiHistory.filter((entry) => entry.timestamp >= cutoff);
      },

      // Get mochis earned today
      getMochiEarnedToday: (): number => {
        const { mochiHistory } = get();
        const today = getTodayDateString();
        return mochiHistory
          .filter((entry) => entry.date === today)
          .reduce((sum, entry) => sum + entry.amount, 0);
      },

      // Add a mochi history entry (for regular games or bonuses)
      addMochiHistoryEntry: (amount: number, source: 'daily' | 'game' | 'bonus') => {
        const today = getTodayDateString();
        const { totalMochiPoints, mochiHistory } = get();

        const entry: MochiHistoryEntry = {
          date: today,
          timestamp: Date.now(),
          amount,
          cumulativeTotal: totalMochiPoints + amount,
          source,
        };

        set((state) => {
          state.mochiHistory = [...mochiHistory, entry];
          state.totalMochiPoints += amount;
        });

        get().saveState();
        syncMochiBalance(get());
      },

      spendMochis: (amount: number, _reason: string): boolean => {
        const { totalMochiPoints, mochiHistory } = get();
        if (totalMochiPoints < amount) return false;

        const today = getTodayDateString();
        const newTotal = totalMochiPoints - amount;

        const entry: MochiHistoryEntry = {
          date: today,
          timestamp: Date.now(),
          amount: -amount,
          cumulativeTotal: newTotal,
          source: 'spend',
        };

        set((state) => {
          state.totalMochiPoints = newTotal;
          state.mochiHistory = [...mochiHistory, entry];
        });

        get().saveState();
        syncMochiBalance(get());
        return true;
      },

      // Reset state (for testing)
      resetState: () => {
        set((state) => {
          state.currentStreak = 0;
          state.longestStreak = 0;
          state.lastCompletedDate = null;
          state.completedDates = [];
          state.totalMochiPoints = 0;
          state.mochiHistory = [];
        });
        get().saveState();
      },
    }))
  )
);

// Selectors for optimized subscriptions
export const useCurrentStreak = () =>
  useDailyChallengeStore((state) => state.currentStreak);

export const useLongestStreak = () =>
  useDailyChallengeStore((state) => state.longestStreak);

export const useTotalMochiPoints = () =>
  useDailyChallengeStore((state) => state.totalMochiPoints);

export const useIsLoaded = () =>
  useDailyChallengeStore((state) => state.isLoaded);

export const useCanAffordContinue = (difficulty: Difficulty) =>
  useDailyChallengeStore((state) => state.totalMochiPoints >= CONTINUE_COST[difficulty]);
