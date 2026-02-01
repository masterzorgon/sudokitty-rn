// Game stats row - displays difficulty, time, mistakes, and hints
// Positioned directly above the game grid as a "board header"
// Uses animated rolling numbers for visual feedback

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';
import { RollingNumber, RollingTime } from '../ui';

export const GameHeader = () => {
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  return (
    <View style={styles.container}>
      <Text style={styles.difficulty}>{difficulty}</Text>
      <View style={styles.separator} />
      <RollingTime
        seconds={timeElapsed}
        fontSize={14}
        color={colors.textSecondary}
        textStyle={typography.caption}
      />
      <View style={styles.separator} />
      <View style={styles.statRow}>
        <RollingNumber
          value={mistakeCount}
          fontSize={14}
          color={mistakeCount > 0 ? colors.errorText : colors.textSecondary}
          textStyle={typography.caption}
          maxDigits={1}
        />
        <Text style={[styles.stat, mistakeCount > 0 && styles.statError]}>/</Text>
        <Text style={[styles.stat, mistakeCount > 0 && styles.statError]}>{MAX_MISTAKES} mistakes</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.statRow}>
        <RollingNumber
          value={hintsUsed}
          fontSize={14}
          color={colors.textSecondary}
          textStyle={typography.caption}
          maxDigits={1}
        />
        <Text style={styles.stat}>/</Text>
        <Text style={styles.stat}>{MAX_HINTS} hints</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  difficulty: {
    ...typography.caption,
    color: colors.softOrange,
    letterSpacing: 1.5,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: colors.gridLine,
    marginHorizontal: spacing.md,
  },
  stat: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: Math.ceil(14 * 1.4), // Match RollingNumber height for baseline alignment
  },
  statError: {
    color: colors.errorText,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Math.ceil(14 * 1.4), // Fixed height to prevent layout shift during animation
    gap: 1,
  },
});
