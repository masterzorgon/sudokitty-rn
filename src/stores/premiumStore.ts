// Premium entitlement store
// Persists isPremium to AsyncStorage for instant UI on cold start,
// then syncs with RevenueCat for ground-truth entitlement status.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkPremiumStatus,
  isPremiumFromInfo,
  addCustomerInfoListener,
} from '../lib/revenueCat';
import type { CustomerInfo } from 'react-native-purchases';

// ============================================
// Types
// ============================================

interface PremiumState {
  isPremium: boolean;
  isLoaded: boolean;
}

interface PremiumActions {
  /** Fetch entitlement status from RevenueCat and update the store. */
  syncStatus: () => Promise<void>;
  /** Directly set the premium flag (used by the RC listener). */
  setPremium: (value: boolean) => void;
}

// ============================================
// Store
// ============================================

export const usePremiumStore = create<PremiumState & PremiumActions>()(
  persist(
    (set) => ({
      isPremium: false,
      isLoaded: false,

      syncStatus: async () => {
        const isPremium = await checkPremiumStatus();
        set({ isPremium, isLoaded: true });
      },

      setPremium: (value: boolean) => set({ isPremium: value }),
    }),
    {
      name: '@sudokitty/premium',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ============================================
// Selectors
// ============================================

export const useIsPremium = () => usePremiumStore((s) => s.isPremium);

// ============================================
// Real-time listener
// ============================================

/**
 * Start listening to real-time CustomerInfo changes from RevenueCat.
 * Keeps isPremium in sync if the user purchases on another device,
 * or their subscription renews/cancels.
 *
 * Call once after initRevenueCat(). Returns a cleanup function.
 */
export function startPremiumListener(): () => void {
  return addCustomerInfoListener((info: CustomerInfo) => {
    usePremiumStore.getState().setPremium(isPremiumFromInfo(info));
  });
}
