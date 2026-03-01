import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

import { useColors } from '../../../theme/colors';

const STEP_DOT_TIMING = { duration: 250, easing: Easing.inOut(Easing.ease) };
const STEP_DOT_SIZE = 8;
const STEP_DOT_ACTIVE_WIDTH = 20;

export type StepDotState = 'pending' | 'active' | 'completed';

export function AnimatedStepDot({ state }: { state: StepDotState }) {
  const c = useColors();
  const progress = useSharedValue(state === 'active' ? 1 : state === 'completed' ? 2 : 0);

  useEffect(() => {
    const target = state === 'active' ? 1 : state === 'completed' ? 2 : 0;
    progress.value = withTiming(target, STEP_DOT_TIMING);
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => {
    // Width: 8px for pending/completed, 20px for active
    const width = progress.value <= 1
      ? STEP_DOT_SIZE + (STEP_DOT_ACTIVE_WIDTH - STEP_DOT_SIZE) * progress.value
      : STEP_DOT_ACTIVE_WIDTH - (STEP_DOT_ACTIVE_WIDTH - STEP_DOT_SIZE) * (progress.value - 1);

    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1, 2],
      [c.gridLine, c.accent, c.accent],
    );

    return { width, backgroundColor };
  });

  return (
    <Animated.View style={[stepDotBaseStyle, animatedStyle]} />
  );
}

const stepDotBaseStyle = {
  height: STEP_DOT_SIZE,
  borderRadius: STEP_DOT_SIZE / 2,
} as const;
