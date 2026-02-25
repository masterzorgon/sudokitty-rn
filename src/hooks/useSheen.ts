// Hook for sheen animation
// Provides a repeating sweep animation for glossy effect

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { SKEU_TIMINGS, SKEU_DIMENSIONS } from '../theme/skeuomorphic';

interface UseSheenOptions {
  /** Width of the sheen bar (default: 60) */
  width?: number;
  /** Duration of the sweep animation in ms (default: 400) */
  duration?: number;
  /** Interval between sweeps in ms (default: 3000) */
  interval?: number;
  /** Target X position to sweep to (default: 250) */
  targetX?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
}

interface UseSheenReturn {
  /** Animated style to apply to the sheen overlay */
  sheenStyle: ReturnType<typeof useAnimatedStyle>;
  /** Current X position shared value for additional control */
  sheenX: ReturnType<typeof useSharedValue>;
}

export function useSheen(options: UseSheenOptions = {}): UseSheenReturn {
  const {
    width = SKEU_DIMENSIONS.sheenWidth,
    duration = SKEU_TIMINGS.sheenDuration,
    interval = SKEU_TIMINGS.sheenInterval,
    targetX = 250,
    enabled = true,
  } = options;

  // Rest position well off-screen left so skew doesn't leave a visible sliver (skewX shifts the bar)
  const restX = -width - 40;
  const sheenX = useSharedValue(restX);

  useEffect(() => {
    if (!enabled) {
      sheenX.value = restX;
      return;
    }

    sheenX.value = withRepeat(
      withSequence(
        // Start fully off-screen left
        withTiming(restX, { duration: 0 }),
        // Wait before animating
        withDelay(
          interval - duration,
          // Sweep across
          withTiming(targetX, {
            duration,
            easing: Easing.inOut(Easing.ease),
          })
        )
      ),
      -1, // Repeat forever
      false
    );
  }, [sheenX, width, duration, interval, targetX, enabled]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { skewX: '-20deg' }],
  }));

  return {
    sheenStyle,
    sheenX,
  };
}
