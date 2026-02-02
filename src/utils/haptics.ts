// Centralized haptics utility
// Respects user settings for haptic feedback

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Trigger impact haptic feedback if enabled in settings
 * @param style - Impact feedback style (default: Light)
 */
export function triggerHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): void {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    Haptics.impactAsync(style);
  }
}

/**
 * Trigger notification haptic feedback if enabled in settings
 * @param type - Notification feedback type
 */
export function triggerNotificationHaptic(
  type: Haptics.NotificationFeedbackType
): void {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    Haptics.notificationAsync(type);
  }
}

/**
 * Trigger selection haptic feedback if enabled in settings
 */
export function triggerSelectionHaptic(): void {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    Haptics.selectionAsync();
  }
}

// Re-export haptic styles for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
