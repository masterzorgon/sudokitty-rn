// Hook for skeuomorphic press animation
// Provides scale + translateY animation with haptic feedback
// Respects reduced motion accessibility preference

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { SKEU_TIMINGS, SKEU_DIMENSIONS } from '../theme/skeuomorphic';
import { useReducedMotion } from './useReducedMotion';
import { playFeedback, type FeedbackId } from '../utils/feedback';

interface UseSkeuomorphicPressOptions {
  /** Scale factor when pressed (default: 0.96) */
  scale?: number;
  /** Vertical translation when pressed (default: 2) */
  depth?: number;
  /** Animation duration in ms (default: 100) */
  duration?: number;
  /** Whether to trigger haptic feedback (default: true) */
  haptic?: boolean;
  /** Feedback ID (default: 'tap'). Use 'tapHeavy' for primary actions. */
  feedbackId?: FeedbackId;
  /** Callback when pressed */
  onPress?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}


export function useSkeuomorphicPress(options: UseSkeuomorphicPressOptions = {}) {
  const {
    scale = SKEU_DIMENSIONS.pressScale,
    depth = SKEU_DIMENSIONS.pressDepth,
    duration = SKEU_TIMINGS.pressDuration,
    haptic = true,
    feedbackId = 'tap',
    onPress,
    disabled = false,
  } = options;

  const reducedMotion = useReducedMotion();
  const pressProgress = useSharedValue(0);

  // Use 0 duration when reduced motion is enabled for instant state changes
  const effectiveDuration = reducedMotion ? 0 : duration;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(1, { duration: effectiveDuration });
  }, [pressProgress, effectiveDuration, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(0, { duration: effectiveDuration });
  }, [pressProgress, effectiveDuration, disabled]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (haptic) playFeedback(feedbackId);
    onPress?.();
  }, [haptic, feedbackId, onPress, disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentScale = 1 - (1 - scale) * pressProgress.value;
    const translateY = depth * pressProgress.value;

    return {
      transform: [{ scale: currentScale }, { translateY }],
    };
  });

  return {
    animatedStyle,
    pressHandlers: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      onPress: handlePress,
    },
    pressProgress,
  };
}
