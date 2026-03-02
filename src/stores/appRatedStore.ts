// Tracks whether the user has been prompted to rate the app.
// Persisted so we don't show the rate CTA again after they've acted on it.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppRatedState {
  hasRated: boolean;
}

interface AppRatedActions {
  setRated: (value: boolean) => void;
}

export const useAppRatedStore = create<AppRatedState & AppRatedActions>()(
  persist(
    (set) => ({
      hasRated: false,
      setRated: (value) => set({ hasRated: value }),
    }),
    {
      name: '@sudokitty/has_rated',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useHasRated = () => useAppRatedStore((s) => s.hasRated);
