// Today's challenge overview card
// Shows difficulty, mochi points, and participant count

import React, { memo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { DailyChallenge, Difficulty, DIFFICULTY_CONFIG } from '../../engine/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';
import { springConfigs } from '../../theme/animations';

interface ChallengeCardProps {
  challenge: DailyChallenge;
  isCompleted: boolean;
  participantCount: number;
  onPress: () => void;
}

// Difficulty badge colors
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: colors.mint,
  medium: colors.butter,
  hard: colors.peach,
  expert: colors.coral,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ChallengeCard = memo(
  ({ challenge, isCompleted, participantCount, onPress }: ChallengeCardProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, springConfigs.quick);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, springConfigs.quick);
    };

    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const badgeColor = DIFFICULTY_COLORS[challenge.difficulty];

    return (
      <AnimatedPressable
        style={[styles.container, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isCompleted}
      >
        {/* Header with difficulty badge */}
        <View style={styles.header}>
          <Text style={styles.title}>today's challenge</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
          </View>
        </View>

        {/* Mochi comment */}
        <Text style={styles.mochiComment}>"{difficultyConfig.mochiComment}"</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>+{challenge.mochiPoints}</Text>
            <Text style={styles.statLabel}>mochi points</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>{participantCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>players today</Text>
          </View>
        </View>

        {/* Status indicator */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>completed today!</Text>
          </View>
        )}
      </AnimatedPressable>
    );
  }
);

ChallengeCard.displayName = 'ChallengeCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mochiComment: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.title,
    color: colors.softOrange,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.md,
  },
  completedBanner: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  completedText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
