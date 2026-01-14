// Streak display component with animated rolling number
// Shows current streak prominently with flame indicator

import React, { memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { RollingNumber } from '../ui/RollingNumber';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakDisplay = memo(({ currentStreak, longestStreak }: StreakDisplayProps) => {
  const hasStreak = currentStreak > 0;

  return (
    <View style={styles.container}>
      <View style={styles.mainStreak}>
        <Text style={styles.flameEmoji}>{hasStreak ? '🔥' : '✨'}</Text>
        <View style={styles.streakValue}>
          <RollingNumber
            value={currentStreak}
            fontSize={48}
            color={colors.softOrange}
            maxDigits={3}
          />
        </View>
        <Text style={styles.streakLabel}>
          {currentStreak === 1 ? 'day streak' : 'day streak'}
        </Text>
      </View>

      {longestStreak > 0 && (
        <Text style={styles.longestStreak}>
          longest: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
        </Text>
      )}
    </View>
  );
});

StreakDisplay.displayName = 'StreakDisplay';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  mainStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flameEmoji: {
    fontSize: 36,
  },
  streakValue: {
    minWidth: 60,
    alignItems: 'center',
  },
  streakLabel: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  longestStreak: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
});
