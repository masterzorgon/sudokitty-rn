import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface VisibilityAnimationConfig {
  durationIn?: number;
  durationOut?: number;
  easingIn?: typeof Easing.out;
  easingOut?: typeof Easing.out;
}

/**
 * Returns an animated style that scales and fades a component in/out.
 * Use to implement hide/show transitions consistently across the UI.
 */
export function useVisibilityAnimation(
  isVisible: boolean,
  config?: VisibilityAnimationConfig,
) {
  const {
    durationIn = 100,
    durationOut = 100,
    easingIn = Easing.out(Easing.cubic),
    easingOut = Easing.out(Easing.cubic),
  } = config ?? {};

  const scale = useSharedValue(isVisible ? 1 : 0);
  const opacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    const target = isVisible ? 1 : 0;
    const duration = isVisible ? durationIn : durationOut;
    const easing = isVisible ? easingIn : easingOut;

    scale.value = withTiming(target, { duration, easing });
    opacity.value = withTiming(target, { duration });
  }, [isVisible, durationIn, durationOut, easingIn, easingOut, scale, opacity]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
}
