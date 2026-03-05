// Player streak state management with Zustand
// Handles streaks, completions, and activity tracking

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  DailyChallengeState,
  ActivityDay,
  MochiHistoryEntry,
  ChartTimePeriod,
  PERIOD_MS,
  getTodayDateString,
  getYesterdayDateString,
  daysBetweenDates,
  addDaysToDate,
  createEmptyDailyChallengeState,
} from '../engine/types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { syncStreakToSupabase, pullStreakFromSupabase } from '../services/streakSyncService';
import { usePlayerProgressStore } from './playerProgressStore';
import { syncEconomyToSupabase } from '../services/economySyncService';
import { MOCHIS_COST } from '../constants/economy';

interface PlayerStreakStore extends DailyChallengeState {
  // Loading state
  isLoaded: boolean;

  // Mochi history for chart
  mochiHistory: MochiHistoryEntry[];

  // Actions
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  recordGameWin: () => void; // Called on ANY game win (regular or daily)
  recordGamePlayed: () => void; // Called on ANY game completion (win or loss)
  syncFromRemote: () => Promise<void>; // Pull remote streak on launch
  getActivityData: (weeks?: number) => ActivityDay[];

  // Mochi history methods
  getMochiHistory: (period: ChartTimePeriod) => MochiHistoryEntry[];
  getMochiEarnedToday: () => number;
  addMochiHistoryEntry: (amount: number, source: 'daily' | 'game' | 'bonus' | 'conversion' | 'iap') => void;
  spendMochis: (amount: number, reason: string) => boolean;
  recordFirstPuzzleOfDayIfNeeded: () => boolean;
  applyDailyLoginBonusIfNeeded: () => void;
  buyStreakFreeze: () => boolean;
  consumeStreakFreezeIfAvailable: () => boolean;
  reigniteStreak: () => boolean;
  clearStreakLostInfo: () => void;

  // For testing/debugging
  resetState: () => void;
}

function syncMochiBalance(state: PlayerStreakStore) {
  const totalXP = usePlayerProgressStore.getState().totalXP;
  syncStreakToSupabase({
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    lastCompletedDate: state.lastCompletedDate,
    totalGamesWon: state.totalGamesWon,
    totalMochiPoints: state.totalMochiPoints,
    totalXP,
  });
}

export const usePlayerStreakStore = create<PlayerStreakStore>()(
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
            state.lastFirstPuzzleDate = stored.lastFirstPuzzleDate ?? null;
            state.lastDailyLoginDate = stored.lastDailyLoginDate ?? null;
            state.streakFreezesCount = stored.streakFreezesCount ?? 0;
            state.frozenDates = stored.frozenDates ?? [];
            state.streakLostInfo = stored.streakLostInfo ?? null;
            state.gamesPlayedByDate = stored.gamesPlayedByDate ?? {};
            state.mochiHistory = storedHistory || [];
            state.isLoaded = true;
          });

          // Check if streak needs to be reset (missed one or more days)
          const today = getTodayDateString();
          const yesterday = getYesterdayDateString();
          const { lastCompletedDate, currentStreak, streakFreezesCount } = get();

          if (
            lastCompletedDate !== null &&
            lastCompletedDate !== today &&
            lastCompletedDate !== yesterday &&
            currentStreak > 0
          ) {
            const missedDays = daysBetweenDates(lastCompletedDate, yesterday);
            const freezesToUse = Math.min(missedDays, streakFreezesCount ?? 0);
            const previousStreak = currentStreak;

            const newFrozenDates: string[] = [];
            for (let i = 0; i < freezesToUse; i++) {
              newFrozenDates.push(addDaysToDate(lastCompletedDate, i + 1));
            }

            const cutoff = addDaysToDate(today, -90);

            set((state) => {
              state.streakFreezesCount = Math.max(0, (state.streakFreezesCount ?? 0) - freezesToUse);
              state.frozenDates = [...state.frozenDates, ...newFrozenDates].filter((d) => d >= cutoff);

              if (freezesToUse < missedDays) {
                state.currentStreak = 0;
                state.streakLostInfo = {
                  previousStreak,
                  reigniteCost: MOCHIS_COST.streak_reignite,
                };
              }
            });

            get().saveState();
            void syncEconomyToSupabase();
          }
        } else {
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // Save state to AsyncStorage
      saveState: async () => {
        const { currentStreak, longestStreak, lastCompletedDate, completedDates, totalMochiPoints, totalGamesWon, lastFirstPuzzleDate, lastDailyLoginDate, streakFreezesCount, frozenDates, streakLostInfo, gamesPlayedByDate, mochiHistory } =
          get();
        await storage.set<DailyChallengeState>(STORAGE_KEYS.DAILY_CHALLENGE_STATE, {
          currentStreak,
          longestStreak,
          lastCompletedDate,
          completedDates,
          totalMochiPoints,
          totalGamesWon,
          lastFirstPuzzleDate: lastFirstPuzzleDate ?? null,
          lastDailyLoginDate: lastDailyLoginDate ?? null,
          streakFreezesCount,
          frozenDates,
          streakLostInfo,
          gamesPlayedByDate,
        });
        await storage.set<MochiHistoryEntry[]>(STORAGE_KEYS.MOCHI_HISTORY, mochiHistory);
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
          totalXP: usePlayerProgressStore.getState().totalXP,
        });
      },

      // Record any game completion (win or loss) for the activity heatmap
      recordGamePlayed: () => {
        const today = getTodayDateString();
        set((state) => {
          state.gamesPlayedByDate[today] = (state.gamesPlayedByDate[today] ?? 0) + 1;
        });
        get().saveState();
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

      // Get activity data for calendar (default 52 weeks)
      getActivityData: (weeks = 52): ActivityDay[] => {
        const { completedDates, frozenDates } = get();
        const completedSet = new Set(completedDates);
        const frozenSet = new Set(frozenDates);
        const days: ActivityDay[] = [];

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (weeks * 7) + 1);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(today);

        const current = new Date(startDate);
        while (current <= endDate) {
          const dateString = current.toISOString().split('T')[0];
          days.push({
            date: dateString,
            completed: completedSet.has(dateString),
            frozen: frozenSet.has(dateString),
          });
          current.setDate(current.getDate() + 1);
        }

        return days;
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
      addMochiHistoryEntry: (amount: number, source: 'daily' | 'game' | 'bonus' | 'conversion' | 'iap') => {
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
        void syncEconomyToSupabase();
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
        void syncEconomyToSupabase();
        return true;
      },

      recordFirstPuzzleOfDayIfNeeded: (): boolean => {
        const today = getTodayDateString();
        const { lastFirstPuzzleDate } = get();
        if (lastFirstPuzzleDate === today) return false;
        set((state) => {
          state.lastFirstPuzzleDate = today;
        });
        get().saveState();
        void syncEconomyToSupabase();
        return true;
      },

      applyDailyLoginBonusIfNeeded: () => {
        const today = getTodayDateString();
        const { lastDailyLoginDate } = get();
        if (lastDailyLoginDate === today) return;
        get().addMochiHistoryEntry(5, 'bonus');
        set((state) => {
          state.lastDailyLoginDate = today;
        });
        get().saveState();
        void syncEconomyToSupabase();
      },

      buyStreakFreeze: (): boolean => {
        const spent = get().spendMochis(MOCHIS_COST.streak_freeze, 'streak_freeze');
        if (!spent) return false;
        set((state) => {
          state.streakFreezesCount = (state.streakFreezesCount ?? 0) + 1;
        });
        get().saveState();
        void syncEconomyToSupabase();
        return true;
      },

      consumeStreakFreezeIfAvailable: (): boolean => {
        const { streakFreezesCount } = get();
        if ((streakFreezesCount ?? 0) <= 0) return false;
        set((state) => {
          state.streakFreezesCount = Math.max(0, (state.streakFreezesCount ?? 0) - 1);
        });
        get().saveState();
        void syncEconomyToSupabase();
        return true;
      },

      reigniteStreak: (): boolean => {
        const { streakLostInfo, totalMochiPoints } = get();
        if (!streakLostInfo) return false;
        if (totalMochiPoints < streakLostInfo.reigniteCost) return false;

        const cost = streakLostInfo.reigniteCost;
        const restored = streakLostInfo.previousStreak;

        set((state) => {
          state.totalMochiPoints -= cost;
          state.currentStreak = restored;
          state.streakLostInfo = null;
        });

        const today = getTodayDateString();
        const { mochiHistory } = get();
        const entry: MochiHistoryEntry = {
          date: today,
          timestamp: Date.now(),
          amount: -cost,
          cumulativeTotal: get().totalMochiPoints,
          source: 'spend',
        };
        set((state) => {
          state.mochiHistory = [...mochiHistory, entry];
        });

        get().saveState();
        syncMochiBalance(get());
        void syncEconomyToSupabase();
        return true;
      },

      clearStreakLostInfo: () => {
        set((state) => {
          state.streakLostInfo = null;
        });
        get().saveState();
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
          state.lastFirstPuzzleDate = null;
          state.lastDailyLoginDate = null;
          state.streakFreezesCount = 0;
          state.frozenDates = [];
          state.streakLostInfo = null;
          state.gamesPlayedByDate = {};
        });
        get().saveState();
      },
    }))
  )
);

// Selectors for optimized subscriptions
export const useCurrentStreak = () =>
  usePlayerStreakStore((state) => state.currentStreak);

export const useLongestStreak = () =>
  usePlayerStreakStore((state) => state.longestStreak);

export const useTotalMochiPoints = () =>
  usePlayerStreakStore((state) => state.totalMochiPoints);

export const useIsLoaded = () =>
  usePlayerStreakStore((state) => state.isLoaded);
