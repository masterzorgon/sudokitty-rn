// MochiCat - The adorable orange tabby mascot for Sudokitty
// Displays the mochi cat character with optional breathing animation

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { durations } from '../../theme/animations';

// SVG import - requires react-native-svg-transformer
import MochiCatSvg from '../../../assets/images/mochi/mochi-cat.svg';

// MARK: - Types

interface MochiCatProps {
  // Size of the cat image (width and height will be equal)
  size?: number;
  // Whether to animate a subtle breathing effect
  animate?: boolean;
}

// MARK: - Component

export function MochiCat({
  size = 180,
  animate = true,
}: MochiCatProps) {
  // Breathing animation scale value
  const breatheScale = useSharedValue(1);

  // MARK: - Breathing Animation
  // Creates a gentle, subtle breathing effect that makes mochi feel alive
  useEffect(() => {
    if (animate) {
      breatheScale.value = withRepeat(
        withSequence(
          // Inhale - gentle scale up
          withTiming(1.02, {
            duration: durations.mochiBreathing,
            easing: Easing.inOut(Easing.ease),
          }),
          // Exhale - back to normal
          withTiming(1, {
            duration: durations.mochiBreathing,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Repeat forever
        false // Don't reverse, we handle both directions in sequence
      );
    } else {
      // Cancel any running animation and reset to default scale
      cancelAnimation(breatheScale);
      breatheScale.value = 1;
    }
  }, [animate, breatheScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  // MARK: - Render

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        {/* SVG component - width/height props control size */}
        <MochiCatSvg width={size} height={size} />
      </Animated.View>
    </View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    // Wrapper for animation transforms
  },
  image: {
    // Image fills the container
  },
});
