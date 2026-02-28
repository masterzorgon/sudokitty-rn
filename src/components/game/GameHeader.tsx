import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../stores/gameStore';
import { useTimerEnabled, useUnlimitedMistakes } from '../../stores/settingsStore';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';
import { RollingTime } from '../ui';

const BOX_WIDTH = 130;

interface IconIndicatorProps {
  used: number;
  total: number;
}

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

const HintsIndicator = ({ used, total, accentColor }: IconIndicatorProps & { accentColor: string }) => (
  <View style={styles.iconRow}>
    {Array.from({ length: total }, (_, i) => {
      const isRemaining = i < (total - used);
      return (
        <Ionicons
          key={i}
          name={isRemaining ? 'bulb' : 'bulb-outline'}
          size={16}
          color={isRemaining ? accentColor : colors.gridLine}
        />
      );
    })}
  </View>
);

export const GameHeader = () => {
  const c = useColors();
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  // Settings
  const timerEnabled = useTimerEnabled();
  const unlimitedMistakes = useUnlimitedMistakes();

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
        {!unlimitedMistakes && (
          <LivesIndicator used={mistakeCount} total={MAX_MISTAKES} />
        )}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Section 3: Hints */}
      <View style={styles.section}>
        <HintsIndicator used={hintsUsed} total={MAX_HINTS} accentColor="#F5C542" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'white',
    height: 30,
    borderWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.gridLineBold,
  },
  section: {
    width: BOX_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginLeft: 1.42,
  },
  separator: {
    width: 2,
    backgroundColor: colors.gridLineBold,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
