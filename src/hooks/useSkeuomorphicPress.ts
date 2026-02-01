// Hook for skeuomorphic press animation
// Provides scale + translateY animation with haptic feedback

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SKEU_TIMINGS, SKEU_DIMENSIONS } from '../theme/skeuomorphic';

interface UseSkeuomorphicPressOptions {
  /** Scale factor when pressed (default: 0.96) */
  scale?: number;
  /** Vertical translation when pressed (default: 2) */
  depth?: number;
  /** Animation duration in ms (default: 100) */
  duration?: number;
  /** Whether to trigger haptic feedback (default: true) */
  haptic?: boolean;
  /** Haptic feedback style (default: Light) */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Callback when pressed */
  onPress?: () => void;
}


export function useSkeuomorphicPress(options: UseSkeuomorphicPressOptions = {}) {
  const {
    scale = SKEU_DIMENSIONS.pressScale,
    depth = SKEU_DIMENSIONS.pressDepth,
    duration = SKEU_TIMINGS.pressDuration,
    haptic = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    onPress,
  } = options;

  const pressProgress = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressProgress.value = withTiming(1, { duration });
  }, [pressProgress, duration]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withTiming(0, { duration });
  }, [pressProgress, duration]);

  const handlePress = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(hapticStyle);
    }
    onPress?.();
  }, [haptic, hapticStyle, onPress]);

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
