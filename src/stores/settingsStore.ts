// Settings store for user preferences
// Handles sounds, haptics, timer visibility, unlimited mistakes/hints, and theme

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSettingChanged } from '../utils/analytics';
import type { ThemeName } from '../theme/palettes';

interface SettingsState {
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  timerEnabled: boolean;
  unlimitedMistakes: boolean;
  unlimitedHints: boolean;
  colorTheme: ThemeName;
}

interface SettingsActions {
  setSoundsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTimerEnabled: (enabled: boolean) => void;
  setUnlimitedMistakes: (enabled: boolean) => void;
  setUnlimitedHints: (enabled: boolean) => void;
  setColorTheme: (theme: ThemeName) => void;
  resetSettings: () => void;
}

const initialState: SettingsState = {
  soundsEnabled: true,
  hapticsEnabled: true,
  timerEnabled: true,
  unlimitedMistakes: false,
  unlimitedHints: false,
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

      setUnlimitedMistakes: (enabled: boolean) => {
        set({ unlimitedMistakes: enabled });
        trackSettingChanged('unlimitedMistakes', enabled);
      },

      setUnlimitedHints: (enabled: boolean) => {
        set({ unlimitedHints: enabled });
        trackSettingChanged('unlimitedHints', enabled);
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
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          state.colorTheme = 'pink';
        }
        if (version < 3) {
          const oldMistakeLimit = state.mistakeLimitEnabled as boolean | undefined;
          state.unlimitedMistakes = oldMistakeLimit === false;
          state.unlimitedHints = false;
          delete state.mistakeLimitEnabled;
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
export const useUnlimitedMistakes = () => useSettingsStore((s) => s.unlimitedMistakes);
export const useUnlimitedHints = () => useSettingsStore((s) => s.unlimitedHints);
export const useColorTheme = () => useSettingsStore((s) => s.colorTheme);
