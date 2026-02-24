// Fishy points state management with Zustand
// Tracks the user's fishy point balance, persisted to AsyncStorage

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { storage, STORAGE_KEYS } from '../utils/storage';

interface FishyPersistedState {
  totalFishyPoints: number;
}

interface FishyStore extends FishyPersistedState {
  isLoaded: boolean;
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  addFishyPoints: (amount: number) => void;
}

export const useFishyStore = create<FishyStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      totalFishyPoints: 0,
      isLoaded: false,

      loadState: async () => {
        const stored = await storage.get<FishyPersistedState>(STORAGE_KEYS.FISHY_STATE);
        set((state) => {
          if (stored) {
            state.totalFishyPoints = stored.totalFishyPoints;
          }
          state.isLoaded = true;
        });
      },

      saveState: async () => {
        const { totalFishyPoints } = get();
        await storage.set<FishyPersistedState>(STORAGE_KEYS.FISHY_STATE, { totalFishyPoints });
      },

      addFishyPoints: (amount: number) => {
        set((state) => {
          state.totalFishyPoints += amount;
        });
        get().saveState();
      },
    }))
  )
);

// Selector for optimized subscriptions
export const useTotalFishyPoints = () =>
  useFishyStore((state) => state.totalFishyPoints);
