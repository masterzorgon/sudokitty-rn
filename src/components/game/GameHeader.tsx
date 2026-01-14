// Game stats row - displays difficulty, time, mistakes, and hints
// Positioned directly above the game grid as a "board header"

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const GameHeader = () => {
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  return (
    <View style={styles.container}>
      <Text style={styles.difficulty}>{difficulty}</Text>
      <View style={styles.separator} />
      <Text style={styles.stat}>{formatTime(timeElapsed)}</Text>
      <View style={styles.separator} />
      <Text style={[styles.stat, mistakeCount > 0 && styles.statError]}>
        {mistakeCount}/{MAX_MISTAKES} mistakes
      </Text>
      <View style={styles.separator} />
      <Text style={styles.stat}>{hintsUsed}/{MAX_HINTS} hints</Text>
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
    textTransform: 'uppercase',
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
  },
  statError: {
    color: colors.errorText,
  },
});
