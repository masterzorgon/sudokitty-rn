// Settings store for user preferences
// Handles sounds, haptics, timer visibility, and mistake limit settings

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSettingChanged } from '../utils/analytics';
import type { ThemeName } from '../theme/palettes';

interface SettingsState {
  // Preferences with explicit defaults
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  timerEnabled: boolean;
  mistakeLimitEnabled: boolean;
  colorTheme: ThemeName;
}

interface SettingsActions {
  setSoundsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTimerEnabled: (enabled: boolean) => void;
  setMistakeLimitEnabled: (enabled: boolean) => void;
  setColorTheme: (theme: ThemeName) => void;
  resetSettings: () => void;
}

const initialState: SettingsState = {
  soundsEnabled: true,
  hapticsEnabled: true,
  timerEnabled: true,
  mistakeLimitEnabled: true,
  colorTheme: 'pink',
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

      setColorTheme: (theme: ThemeName) => {
        set({ colorTheme: theme });
        trackSettingChanged('colorTheme', theme);
      },

      resetSettings: () => {
        set(initialState);
      },
    }),
    {
      name: '@sudokitty/settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          state.colorTheme = 'pink';
        }
        return state as SettingsState & SettingsActions;
      },
    }
  )
);

// Selectors for optimized subscriptions
export const useSoundsEnabled = () => useSettingsStore((s) => s.soundsEnabled);
export const useHapticsEnabled = () => useSettingsStore((s) => s.hapticsEnabled);
export const useTimerEnabled = () => useSettingsStore((s) => s.timerEnabled);
export const useMistakeLimitEnabled = () => useSettingsStore((s) => s.mistakeLimitEnabled);
export const useColorTheme = () => useSettingsStore((s) => s.colorTheme);
