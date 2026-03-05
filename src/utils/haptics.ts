// Centralized haptics utility
// Respects user settings for haptic feedback
// Uses CoreHaptics module for tuned haptic patterns on iOS

import { play as playCoreHaptic, supportsHaptics } from '../../modules/core-haptics';
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
  if (!supportsHaptics) return;

  if (pattern === 'selection') {
    const now = Date.now();
    if (now - lastSelectionTime < SELECTION_THROTTLE_MS) return;
    lastSelectionTime = now;
  }

  playCoreHaptic(pattern);
}
