// Centralized haptics utility
// Respects user settings for haptic feedback

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

// ============================================
// Pattern API
// ============================================

export type HapticPattern =
  | 'selection'
  | 'tap'
  | 'tapHeavy'
  | 'correct'
  | 'unitComplete'
  | 'mistake'
  | 'gameWon'
  | 'gameLost';

let lastSelectionTime = 0;
const SELECTION_THROTTLE_MS = 80;

/**
 * Play a semantic haptic pattern. Respects hapticsEnabled setting.
 */
export function playHaptic(pattern: HapticPattern): void {
  if (!useSettingsStore.getState().hapticsEnabled) return;

  if (pattern === 'selection') {
    const now = Date.now();
    if (now - lastSelectionTime < SELECTION_THROTTLE_MS) return;
    lastSelectionTime = now;
  }

  switch (pattern) {
    case 'selection':
      Haptics.selectionAsync();
      break;
    case 'tap':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'tapHeavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'correct':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'unitComplete':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'mistake':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'gameWon':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'gameLost':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
  }
}

