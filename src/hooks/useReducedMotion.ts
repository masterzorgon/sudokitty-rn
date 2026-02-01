// Hook to check if reduced motion is enabled on the device
// Respects user's accessibility preferences for motion sensitivity

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useFeatureFlags } from '../stores/featureFlagStore';

/**
 * Hook that returns true if reduced motion is enabled
 * Checks both system setting and feature flag override
 */
export function useReducedMotion(): boolean {
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const { reducedMotion: featureFlagReducedMotion } = useFeatureFlags();

  useEffect(() => {
    // Check initial state
    const checkReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        setSystemReducedMotion(enabled);
      } catch (error) {
        console.warn('Failed to check reduced motion setting:', error);
        setSystemReducedMotion(false);
      }
    };

    checkReducedMotion();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setSystemReducedMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Return true if either system setting or feature flag is enabled
  return systemReducedMotion || featureFlagReducedMotion;
}

/**
 * Get animation duration respecting reduced motion
 * Returns 0 if reduced motion is enabled, otherwise returns the original duration
 */
export function useAnimationDuration(duration: number): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? 0 : duration;
}

/**
 * Check if animations should be enabled
 * Inverse of useReducedMotion for clearer conditional logic
 */
export function useAnimationsEnabled(): boolean {
  return !useReducedMotion();
}
