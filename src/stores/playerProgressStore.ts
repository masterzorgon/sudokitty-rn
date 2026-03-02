import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xpForLevel } from '../constants/xp';
import { useDailyChallengeStore } from './dailyChallengeStore';

interface PlayerProgressState {
  totalXP: number;
  level: number;
}

interface PlayerProgressActions {
  addXP: (amount: number) => void;
}

export const usePlayerProgressStore = create<PlayerProgressState & PlayerProgressActions>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      level: 0,

      addXP: (amount: number) => {
        let { totalXP, level } = get();
        totalXP += amount;

        while (totalXP >= xpForLevel(level + 1)) {
          level += 1;
          const mochiReward = 10 + level * 5;
          useDailyChallengeStore.getState().addMochiHistoryEntry(mochiReward, 'bonus');
        }

        set({ totalXP, level });
      },
    }),
    {
      name: '@sudokitty/player_progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const usePlayerLevel = () => usePlayerProgressStore((s) => s.level);
export const useTotalXP = () => usePlayerProgressStore((s) => s.totalXP);
