import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, useXPEarnedThisGame } from '../../stores/gameStore';
import { useTimerEnabled, useUnlimitedMistakes } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { MAX_MISTAKES } from '../../engine/types';
import { RollingTime, RollingNumber } from '../ui';
import { CELL_SIZE } from '../board/SudokuCell';


interface IconIndicatorProps {
  used: number;
  total: number;
  filledIcon: keyof typeof Ionicons.glyphMap;
  emptyIcon: keyof typeof Ionicons.glyphMap;
  filledColor: string;
  emptyColor?: string;
}

const IconIndicator = ({
  used,
  total,
  filledIcon,
  emptyIcon,
  filledColor,
  emptyColor = colors.gridLine,
}: IconIndicatorProps) => (
  <View style={styles.iconRow}>
    {Array.from({ length: total }, (_, i) => {
      const isRemaining = i < (total - used);
      return (
        <Ionicons
          key={i}
          name={isRemaining ? filledIcon : emptyIcon}
          size={16}
          color={isRemaining ? filledColor : emptyColor}
        />
      );
    })}
  </View>
);

export const GameHeader = () => {
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const xpEarned = useXPEarnedThisGame();

  // Settings
  const timerEnabled = useTimerEnabled();
  const unlimitedMistakes = useUnlimitedMistakes();

  return (
    <View style={styles.container}>
      {/* Section 1: Time */}
      <View style={[styles.section, styles.sectionDivider]}>
        {timerEnabled && (
          <RollingTime
            seconds={timeElapsed}
            fontSize={14}
            color={colors.textSecondary}
            textStyle={typography.caption}
          />
        )}
      </View>

      {/* Section 2: Lives (Mistakes) */}
      <View style={[styles.section, styles.sectionDivider]}>
        {unlimitedMistakes ? (
          <Text style={[styles.infinityIcon, { color: colors.errorText }]}>∞</Text>
        ) : (
          <IconIndicator
            used={mistakeCount}
            total={MAX_MISTAKES}
            filledIcon="heart"
            emptyIcon="heart-outline"
            filledColor={colors.errorText}
          />
        )}
      </View>

      {/* Section 3: XP earned this game (in-game points; difficulty multiplier at win) */}
      <View style={styles.section}>
        <View style={styles.xpRow}>
          <Ionicons name="star" size={14} color={colors.hintGold} />
          <RollingNumber
            value={xpEarned}
            fontSize={13}
            color={colors.textSecondary}
            textStyle={typography.caption}
            maxDigits={5}
            countUp
          />
          <Text style={[styles.xpSuffix, { color: colors.textSecondary }]}>XP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'center',
    backgroundColor: colors.white,
    height: 30,
    width: CELL_SIZE * 9,
    borderWidth: 1,
    borderColor: colors.gridLineBold,
  },
  section: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sectionDivider: {
    borderRightWidth: 2,
    borderRightColor: colors.gridLineBold,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infinityIcon: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 18,
    lineHeight: 20,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpSuffix: {
    ...typography.caption,
    fontSize: 13,
    marginLeft: 2,
  },
});
