// AsyncStorage wrapper utilities for typed persistence

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  DAILY_CHALLENGE_STATE: '@sudokitty/daily_challenge_state',
  USER_STATS: '@sudokitty/user_stats',
  GAME_STATE: '@sudokitty/game_state',
  MOCHI_HISTORY: '@sudokitty/mochi_history',
  PUZZLE_CACHE: '@sudokitty/puzzle_cache',
  GAME_PUZZLE_CACHE: '@sudokitty/game_puzzle_cache',
  DEVICE_ID: '@sudokitty/device_id',
  FISHY_STATE: '@sudokitty/fishy_state',
  ECONOMY_V2_APPLIED: '@sudokitty/economy_v2_applied',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Generic storage helpers
export const storage = {
  /**
   * Get a typed value from storage
   */
  get: async <T>(key: StorageKey): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] Error reading ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a typed value in storage
   */
  set: async <T>(key: StorageKey, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Error writing ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   */
  remove: async (key: StorageKey): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all app storage (use with caution)
   */
  clearAll: async (): Promise<boolean> => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing all:', error);
      return false;
    }
  },
};
