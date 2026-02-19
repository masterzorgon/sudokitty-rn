// StreakPill - 3D pill button showing current day streak
// Uses SkeuButton for consistent skeuomorphic styling with built-in animation

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { fontFamilies } from '../../theme/typography';
import { spacing } from '../../theme';
import { SkeuButton } from '../ui/Skeuomorphic';
import FlameIcon from '../../../assets/images/icons/flame.svg';

// MARK: - Types

interface StreakPillProps {
  streakCount: number;
  onPress?: () => void;
}

// MARK: - Constants

const PILL_HEIGHT = 56;
const PILL_RADIUS = PILL_HEIGHT / 2;
const ICON_SIZE = 32;

// MARK: - Component

export function StreakPill({ streakCount, onPress }: StreakPillProps) {
  return (
    <SkeuButton
      onPress={onPress ?? (() => {})}
      variant="primary"
      borderRadius={PILL_RADIUS}
      sheen
      style={styles.container}
      contentStyle={styles.face}
      accessibilityLabel={`${streakCount} day streak`}
    >
      {/* Flame icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconGlow} />
        <FlameIcon width={ICON_SIZE} height={ICON_SIZE} fill="#FFFFFF" />
      </View>

      {/* Streak count and label - horizontal layout */}
      <View style={styles.textContainer}>
        <Text style={styles.countText}>{streakCount}</Text>
        <Text style={styles.labelText}>day streak</Text>
      </View>
    </SkeuButton>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
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
    backgroundColor: 'rgba(255, 150, 200, 0.4)',
    borderRadius: 18,
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
    textShadowColor: 'rgba(194, 12, 80, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  countText: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    color: '#FFFFFF',
    textShadowColor: 'rgba(194, 12, 80, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
