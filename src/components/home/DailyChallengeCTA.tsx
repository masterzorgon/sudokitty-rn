// Daily Challenge CTA card with 3D press effect
// Full-width card showing calendar icon, difficulty, participant count

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DailyChallenge, DIFFICULTY_CONFIG } from '../../engine/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';

const EDGE_HEIGHT = 4;
const PRESS_DEPTH = 3;

interface DailyChallengeCTAProps {
  challenge: DailyChallenge;
  isCompleted: boolean;
  participantCount: number;
  onPress: () => void;
}

const springConfig = {
  damping: 18,
  stiffness: 400,
  mass: 0.6,
};

// Difficulty badge colors
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: colors.mint,
  medium: colors.butter,
  hard: colors.peach,
  expert: colors.coral,
};

export const DailyChallengeCTA = memo(({
  challenge,
  isCompleted,
  participantCount,
  onPress,
}: DailyChallengeCTAProps) => {
  const pressProgress = useSharedValue(0);
  const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
  const difficultyColor = DIFFICULTY_COLORS[challenge.difficulty] || colors.softOrange;

  const handlePressIn = useCallback(() => {
    pressProgress.value = withSpring(1, springConfig);
  }, [pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withSpring(0, springConfig);
  }, [pressProgress]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressProgress.value, [0, 1], [0, PRESS_DEPTH]);
    return {
      transform: [{ translateY }],
    };
  });

  const animatedEdgeStyle = useAnimatedStyle(() => {
    const height = interpolate(
      pressProgress.value,
      [0, 1],
      [EDGE_HEIGHT, EDGE_HEIGHT - PRESS_DEPTH + 1]
    );
    return {
      height,
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressProgress.value, [0, 1], [0.1, 0.05]);
    const shadowRadius = interpolate(pressProgress.value, [0, 1], [8, 4]);
    return {
      shadowOpacity,
      shadowRadius,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedShadowStyle]}>
      {/* Card face */}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.face, animatedFaceStyle]}>
          {/* Left section - Icon and title */}
          <View style={styles.leftContent}>
            <View style={styles.iconContainer}>
              <Feather name="calendar" size={20} color={colors.softOrange} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Daily Challenge</Text>
              <View style={styles.metaRow}>
                <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}40` }]}>
                  <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                    {difficultyConfig.name}
                  </Text>
                </View>
                <Text style={styles.participants}>
                  {participantCount.toLocaleString()} playing today
                </Text>
              </View>
            </View>
          </View>

          {/* Right section - Status and chevron */}
          <View style={styles.rightContent}>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Feather name="check" size={12} color={colors.mint} />
                <Text style={styles.completedText}>Done!</Text>
              </View>
            )}
            <Feather name="chevron-right" size={24} color={colors.textLight} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

DailyChallengeCTA.displayName = 'DailyChallengeCTA';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 176, 133, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participants: {
    fontSize: 12,
    color: colors.textLight,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(184, 230, 208, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mint,
  },
});
