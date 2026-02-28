// Hook for sheen animation
// Provides a repeating sweep animation for glossy effect
// Derives sheen width and animation range from the measured container width

import { useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { SKEU_TIMINGS } from '../theme/skeuomorphic';

interface UseSheenOptions {
  /** Measured parent width (0 = not yet measured, animation disabled) */
  containerWidth: number;
  /** Duration of the sweep animation in ms (default: sheenDuration) */
  duration?: number;
  /** Interval between sweeps in ms (default: sheenInterval) */
  interval?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
  /** Fraction of container width used for the sheen bar (default: 0.35) */
  sheenWidthRatio?: number;
}

interface UseSheenReturn {
  /** Animated style to apply to the sheen overlay */
  sheenStyle: ReturnType<typeof useAnimatedStyle>;
  /** Computed sheen bar width */
  sheenWidth: number;
}

const MIN_SHEEN_WIDTH = 30;
const MAX_SHEEN_WIDTH = 200;
const SKEW_BUFFER = 20;

export function useSheen(options: UseSheenOptions): UseSheenReturn {
  const {
    containerWidth,
    duration = SKEU_TIMINGS.sheenDuration,
    interval = SKEU_TIMINGS.sheenInterval,
    enabled = true,
    sheenWidthRatio = 0.35,
  } = options;

  const sheenWidth = useMemo(
    () => Math.max(MIN_SHEEN_WIDTH, Math.min(containerWidth * sheenWidthRatio, MAX_SHEEN_WIDTH)),
    [containerWidth, sheenWidthRatio],
  );

  const restX = -sheenWidth - SKEW_BUFFER;
  const endX = containerWidth + SKEW_BUFFER;

  const sheenX = useSharedValue(restX);

  const active = enabled && containerWidth > 0;

  useEffect(() => {
    if (!active) {
      sheenX.value = restX;
      return;
    }

    sheenX.value = withRepeat(
      withSequence(
        withTiming(restX, { duration: 0 }),
        withDelay(
          interval - duration,
          withTiming(endX, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
      ),
      -1,
      false,
    );
  }, [sheenX, active, restX, endX, duration, interval]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { skewX: '-20deg' }],
  }));

  return {
    sheenStyle,
    sheenWidth,
  };
}
