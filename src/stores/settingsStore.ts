// Settings store for user preferences
// Handles sounds, haptics, timer visibility, and mistake limit settings

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSettingChanged } from '../utils/analytics';

interface SettingsState {
  // Preferences with explicit defaults
  soundsEnabled: boolean; // default: true (placeholder until expo-av added)
  hapticsEnabled: boolean; // default: true
  timerEnabled: boolean; // default: true (show/hide timer during gameplay)
  mistakeLimitEnabled: boolean; // default: true (enable/disable mistake tracking)
}

interface SettingsActions {
  setSoundsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTimerEnabled: (enabled: boolean) => void;
  setMistakeLimitEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const initialState: SettingsState = {
  soundsEnabled: true,
  hapticsEnabled: true,
  timerEnabled: true,
  mistakeLimitEnabled: true,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSoundsEnabled: (enabled: boolean) => {
        set({ soundsEnabled: enabled });
        trackSettingChanged('sounds', enabled);
      },

      setHapticsEnabled: (enabled: boolean) => {
        set({ hapticsEnabled: enabled });
        trackSettingChanged('haptics', enabled);
      },

      setTimerEnabled: (enabled: boolean) => {
        set({ timerEnabled: enabled });
        trackSettingChanged('timer', enabled);
      },

      setMistakeLimitEnabled: (enabled: boolean) => {
        set({ mistakeLimitEnabled: enabled });
        trackSettingChanged('mistakeLimit', enabled);
      },

      resetSettings: () => {
        set(initialState);
      },
    }),
    {
      name: '@sudokitty/settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Migration for future schema changes
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Future migrations can be added here
          return persistedState as SettingsState & SettingsActions;
        }
        return persistedState as SettingsState & SettingsActions;
      },
    }
  )
);

// Selectors for optimized subscriptions
export const useSoundsEnabled = () => useSettingsStore((s) => s.soundsEnabled);
export const useHapticsEnabled = () => useSettingsStore((s) => s.hapticsEnabled);
export const useTimerEnabled = () => useSettingsStore((s) => s.timerEnabled);
export const useMistakeLimitEnabled = () => useSettingsStore((s) => s.mistakeLimitEnabled);
