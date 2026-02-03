// Game stats bar - displays time, mistakes, and hints
// Thin bar positioned between mascot and game grid
// Uses visual dot indicators for mistakes/hints

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../stores/gameStore';
import { useTimerEnabled, useMistakeLimitEnabled } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';
import { RollingTime } from '../ui';
import { CELL_SIZE } from '../board/SudokuCell';

// Width of a 3x3 box (matches the sudoku board's box width)
const BOX_WIDTH = CELL_SIZE * 3;

// Icon indicator props
interface IconIndicatorProps {
  used: number;
  total: number;
}

// Lives indicator - hearts representing remaining lives
// Filled hearts = lives remaining, outline hearts = lives lost
const LivesIndicator = ({ used, total }: IconIndicatorProps) => (
  <View style={styles.iconRow}>
    {Array.from({ length: total }, (_, i) => {
      const isRemaining = i < (total - used);
      return (
        <Ionicons
          key={i}
          name={isRemaining ? 'heart' : 'heart-outline'}
          size={16}
          color={isRemaining ? colors.errorText : colors.gridLine}
        />
      );
    })}
  </View>
);

// Hints indicator - lightbulbs representing available hints
// Filled bulbs = hints available, outline bulbs = hints used
const HintsIndicator = ({ used, total }: IconIndicatorProps) => (
  <View style={styles.iconRow}>
    {Array.from({ length: total }, (_, i) => {
      const isRemaining = i < (total - used);
      return (
        <Ionicons
          key={i}
          name={isRemaining ? 'bulb' : 'bulb-outline'}
          size={16}
          color={isRemaining ? colors.softOrange : colors.gridLine}
        />
      );
    })}
  </View>
);

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

      {/* Section 2: Lives (Mistakes) */}
      <View style={styles.section}>
        {mistakeLimitEnabled && (
          <LivesIndicator used={mistakeCount} total={MAX_MISTAKES} />
        )}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Section 3: Hints */}
      <View style={styles.section}>
        <HintsIndicator used={hintsUsed} total={MAX_HINTS} />
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
