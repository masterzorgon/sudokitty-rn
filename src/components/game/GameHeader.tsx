// Game stats bar - displays time, mistakes, and hints
// Thin bar positioned between mascot and game grid
// Uses animated rolling numbers for visual feedback

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { useTimerEnabled, useMistakeLimitEnabled } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';
import { RollingNumber, RollingTime } from '../ui';
import { CELL_SIZE } from '../board/SudokuCell';

// Width of a 3x3 box (matches the sudoku board's box width)
const BOX_WIDTH = CELL_SIZE * 3;

export const GameHeader = () => {
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  // Settings
  const timerEnabled = useTimerEnabled();
  const mistakeLimitEnabled = useMistakeLimitEnabled();

  return (
    <View style={styles.container}>
      {/* Section 1: Time */}
      <View style={styles.section}>
        {timerEnabled && (
          <RollingTime
            seconds={timeElapsed}
            fontSize={14}
            color={colors.textSecondary}
            textStyle={typography.caption}
          />
        )}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Section 2: Mistakes */}
      <View style={styles.section}>
        {mistakeLimitEnabled && (
          <View style={styles.statRow}>
            <RollingNumber
              value={mistakeCount}
              fontSize={14}
              color={colors.textSecondary}
              textStyle={typography.caption}
              maxDigits={1}
            />
            <Text style={styles.stat}>/</Text>
            <Text style={styles.stat}>{MAX_MISTAKES} mistakes</Text>
          </View>
        )}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Section 3: Hints */}
      <View style={styles.section}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.gridLine,
  },
  section: {
    width: BOX_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  separator: {
    width: 1,
    backgroundColor: colors.gridLine,
  },
  stat: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: Math.ceil(14 * 1.4), // Match RollingNumber height for baseline alignment
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Math.ceil(14 * 1.4), // Fixed height to prevent layout shift during animation
    gap: 1,
  },
});
