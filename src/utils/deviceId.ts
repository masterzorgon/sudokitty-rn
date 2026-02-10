// Anonymous device UUID generator + cache.
// Generates a random UUID on first launch, persists it in AsyncStorage.
// This becomes the user_id in Supabase user_streaks until real auth is added.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage';

let cachedDeviceId: string | null = null;

/** Simple UUID v4 generator (no external dependency). */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the anonymous device ID, creating one on first call.
 * Cached in memory after first load for synchronous-like access.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    let id = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = generateUUID();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (err) {
    // Fallback: generate a transient ID (won't persist across restarts)
    const fallback = generateUUID();
    cachedDeviceId = fallback;
    return fallback;
  }
}
