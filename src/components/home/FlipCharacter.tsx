// FlipCharacter - Individual character with split-flap animation
// Creates an old-school airport departure board effect

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';

// MARK: - Types

interface FlipCharacterProps {
  // The character to display before flip
  frontChar: string;
  // The character to display after flip
  backChar: string;
  // Delay before this character starts flipping (ms)
  delay?: number;
  // Duration of the flip animation (ms)
  duration?: number;
  // Whether to trigger the flip animation
  shouldFlip: boolean;
  // Character width for consistent sizing
  charWidth?: number;
  // Font size for the character
  fontSize?: number;
}

// MARK: - Component

export function FlipCharacter({
  frontChar,
  backChar,
  delay = 0,
  duration = 400,
  shouldFlip,
  charWidth = 24,
  fontSize = 22,
}: FlipCharacterProps) {
  // Rotation value: 0 = showing front, 180 = showing back
  const rotation = useSharedValue(0);

  // MARK: - Trigger flip animation when shouldFlip changes
  useEffect(() => {
    if (shouldFlip) {
      rotation.value = withDelay(
        delay,
        withTiming(180, {
          duration,
          easing: Easing.inOut(Easing.cubic),
        })
      );
    } else {
      // Reset to front if shouldFlip becomes false
      rotation.value = withTiming(0, { duration: 0 });
    }
  }, [shouldFlip, delay, duration, rotation]);

  // MARK: - Animated Styles

  // Front face - visible from 0 to 90 degrees
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 180], [0, 180]);
    // Hide when rotated past 90 degrees
    const opacity = interpolate(rotation.value, [0, 89, 90, 180], [1, 1, 0, 0]);

    return {
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX}deg` },
      ],
      opacity,
    };
  });

  // Back face - visible from 90 to 180 degrees
  // Starts at -180 (flipped) and rotates to 0 (visible)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 180], [-180, 0]);
    // Show when rotation is past 90 degrees
    const opacity = interpolate(rotation.value, [0, 89, 90, 180], [0, 0, 1, 1]);

    return {
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX}deg` },
      ],
      opacity,
    };
  });

  // MARK: - Render

  return (
    <View style={[styles.container, { width: charWidth, height: fontSize * 1.5 }]}>
      {/* Front face (initial character) */}
      <Animated.View
        style={[
          styles.face,
          styles.frontFace,
          frontAnimatedStyle,
          { width: charWidth, height: fontSize * 1.5 },
        ]}
      >
        <Text style={[styles.charText, { fontSize }]}>{frontChar}</Text>
      </Animated.View>

      {/* Back face (final character) */}
      <Animated.View
        style={[
          styles.face,
          styles.backFace,
          backAnimatedStyle,
          { width: charWidth, height: fontSize * 1.5 },
        ]}
      >
        <Text style={[styles.charText, { fontSize }]}>{backChar}</Text>
      </Animated.View>
    </View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  face: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    // Prevents the back of the element from being visible during rotation
    backfaceVisibility: 'hidden',
  },
  frontFace: {
    // Front face styling
  },
  backFace: {
    // Back face is pre-flipped so it appears correctly when rotated
  },
  charText: {
    fontFamily: fontFamilies.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    // Ensure consistent character width for monospace-like behavior
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
