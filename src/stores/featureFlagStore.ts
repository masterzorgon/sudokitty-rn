// Feature flag store for gradual rollout of skeuomorphic design system
// Allows per-component control with instant rollback capability

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FeatureFlagState {
  // Component migration flags
  skeuomorphicCTAButton: boolean;
  skeuomorphicPrimaryPill: boolean;
  skeuomorphicGameButton: boolean;
  skeuomorphicCards: boolean;

  // Accessibility flag
  reducedMotion: boolean;

  // Actions
  toggleFlag: (flag: keyof Omit<FeatureFlagState, 'toggleFlag' | 'setFlag' | 'resetFlags'>) => void;
  setFlag: (flag: keyof Omit<FeatureFlagState, 'toggleFlag' | 'setFlag' | 'resetFlags'>, value: boolean) => void;
  resetFlags: () => void;
}

const initialState = {
  skeuomorphicCTAButton: true,  // ✅ Enabled - Using new 3D implementation
  skeuomorphicPrimaryPill: true, // ✅ Enabled - Using new 3D implementation
  skeuomorphicGameButton: true,  // ✅ Enabled - Using new 3D implementation
  skeuomorphicCards: false,      // Not yet implemented (Phase 2)
  reducedMotion: false,          // System setting takes precedence
};

export const useFeatureFlags = create<FeatureFlagState>()(
  persist(
    (set) => ({
      ...initialState,

      toggleFlag: (flag) =>
        set((state) => ({
          [flag]: !state[flag],
        })),

      setFlag: (flag, value) =>
        set({
          [flag]: value,
        }),

      resetFlags: () => set(initialState),
    }),
    {
      name: 'feature-flags-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Helper to check if any skeuomorphic feature is enabled
 */
export const useHasSkeuomorphicFeatures = () => {
  const flags = useFeatureFlags();
  return (
    flags.skeuomorphicCTAButton ||
    flags.skeuomorphicPrimaryPill ||
    flags.skeuomorphicGameButton ||
    flags.skeuomorphicCards
  );
};

/**
 * DevMenu component for toggling feature flags
 * Use this in development to test different feature combinations
 */
export const getFeatureFlagDebugInfo = () => {
  const state = useFeatureFlags.getState();
  return {
    skeuomorphicCTAButton: state.skeuomorphicCTAButton,
    skeuomorphicPrimaryPill: state.skeuomorphicPrimaryPill,
    skeuomorphicGameButton: state.skeuomorphicGameButton,
    skeuomorphicCards: state.skeuomorphicCards,
    reducedMotion: state.reducedMotion,
  };
};
