// StreakPill - 3D pill button showing current day streak
// Features animated flame icon, gradient background, and press effects

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import FlameIcon from '../../../assets/images/icons/flame.svg';

// MARK: - Types

interface StreakPillProps {
  streakCount: number;
  onPress?: () => void;
}

// MARK: - Constants

const PILL_HEIGHT = 56;
const ICON_SIZE = 32;
const PRESS_DURATION = 100;

// 3D effect colors
const GRADIENT_COLORS = ['#FFB085', '#FF9B6A', '#FFA570'] as const;
const EDGE_COLOR = '#E8956A';
const EDGE_HEIGHT = 4;

// Sheen animation
const SHEEN_DURATION = 400;
const SHEEN_INTERVAL = 3000;
const SHEEN_WIDTH = 60;

// MARK: - Component

export function StreakPill({ streakCount, onPress }: StreakPillProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const sheenX = useSharedValue(-SHEEN_WIDTH);

  // Sheen animation - plays every 3 seconds
  useEffect(() => {
    sheenX.value = withRepeat(
      withSequence(
        // Start off-screen left
        withTiming(-SHEEN_WIDTH, { duration: 0 }),
        // Wait before animating
        withDelay(
          SHEEN_INTERVAL - SHEEN_DURATION,
          // Sweep across
          withTiming(250, {
            duration: SHEEN_DURATION,
            easing: Easing.inOut(Easing.ease),
          })
        )
      ),
      -1, // Repeat forever
      false
    );
  }, [sheenX]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: PRESS_DURATION });
    translateY.value = withTiming(2, { duration: PRESS_DURATION });
  }, [scale, translateY]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: PRESS_DURATION });
    translateY.value = withTiming(0, { duration: PRESS_DURATION });
  }, [scale, translateY]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const animatedSheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { skewX: '-20deg' }],
  }));

  // MARK: - Render

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* 3D edge (bottom shadow) */}
        <View style={styles.edge} />

        {/* Main pill face */}
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        >
          {/* Top highlight */}
          <View style={styles.highlight} />

          {/* Sheen animation */}
          <Animated.View style={[styles.sheen, animatedSheenStyle]} />

          {/* Flame icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow} />
            <FlameIcon width={ICON_SIZE} height={ICON_SIZE} fill="#FFFFFF" />
            {/* Sparkle */}
            {/* <View style={styles.sparkle} /> */}
          </View>

          {/* Streak count and label - horizontal layout */}
          <View style={styles.textContainer}>
            <Text style={styles.countText}>{streakCount}</Text>
            <Text style={styles.labelText}>day streak</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  edge: {
    position: 'absolute',
    bottom: -EDGE_HEIGHT,
    left: 0,
    right: 0,
    height: PILL_HEIGHT,
    backgroundColor: EDGE_COLOR,
    borderRadius: PILL_HEIGHT / 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: PILL_HEIGHT / 2,
    overflow: 'hidden',
    // Subtle border for definition
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(232, 149, 106, 0.2)',
    borderBottomColor: 'rgba(232, 149, 106, 0.3)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHEEN_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 220, 150, 0.4)',
    borderRadius: 18,
  },
  sparkle: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 200, 0.8)',
    borderRadius: 3,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  labelText: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(194, 65, 12, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  countText: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    color: '#FFFFFF',
    // Text shadow for depth
    textShadowColor: 'rgba(194, 65, 12, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
