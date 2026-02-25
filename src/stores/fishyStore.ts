// Fishy points state management with Zustand
// Tracks the user's fishy point balance and transaction history, persisted to AsyncStorage.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { storage, STORAGE_KEYS } from '../utils/storage';
import {
  type FishyTransactionSource,
  type FishyTransactionEntry,
  createFishyTransactionEntry,
  trimFishyHistory,
} from '../constants/economy';
import { syncEconomyToSupabase } from '../services/economySyncService';

// ============================================
// Persisted state
// ============================================

interface FishyPersistedState {
  totalFishyPoints: number;
  fishyHistory: FishyTransactionEntry[];
}

// ============================================
// Store interface
// ============================================

interface FishyStore extends FishyPersistedState {
  isLoaded: boolean;
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  addFishyPoints: (amount: number, source?: FishyTransactionSource) => void;
  spendFishies: (amount: number, source: FishyTransactionSource) => boolean;
}

// ============================================
// Store
// ============================================

export const useFishyStore = create<FishyStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      totalFishyPoints: 0,
      fishyHistory: [],
      isLoaded: false,

      loadState: async () => {
        const stored = await storage.get<FishyPersistedState>(STORAGE_KEYS.FISHY_STATE);
        set((state) => {
          if (stored) {
            state.totalFishyPoints = stored.totalFishyPoints ?? 0;
            state.fishyHistory = Array.isArray(stored.fishyHistory)
              ? stored.fishyHistory
              : [];
          }
          state.isLoaded = true;
        });
      },

      saveState: async () => {
        const { totalFishyPoints, fishyHistory } = get();
        const trimmed = trimFishyHistory(fishyHistory);
        await storage.set<FishyPersistedState>(STORAGE_KEYS.FISHY_STATE, {
          totalFishyPoints,
          fishyHistory: trimmed,
        });
      },

      addFishyPoints: (amount: number, source?: FishyTransactionSource) => {
        if (amount <= 0) return;
        set((state) => {
          state.totalFishyPoints += amount;
          if (source) {
            state.fishyHistory.push(
              createFishyTransactionEntry(amount, source)
            );
          }
        });
        get().saveState();
        void syncEconomyToSupabase();
      },

      spendFishies: (amount: number, source: FishyTransactionSource): boolean => {
        const { totalFishyPoints } = get();
        if (amount <= 0 || totalFishyPoints < amount) return false;
        set((state) => {
          state.totalFishyPoints -= amount;
          state.fishyHistory.push(
            createFishyTransactionEntry(-amount, source)
          );
        });
        get().saveState();
        void syncEconomyToSupabase();
        return true;
      },
    }))
  )
);

// ============================================
// Selectors
// ============================================

export const useTotalFishyPoints = () =>
  useFishyStore((state) => state.totalFishyPoints);
