import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, useXPEarnedThisGame } from '../../stores/gameStore';
import { useTimerEnabled, useUnlimitedMistakes } from '../../stores/settingsStore';
import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
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
  const c = useColors();
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
          <Text style={[styles.infinityIcon, { color: colors.textSecondary }]}>∞</Text>
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

      {/* Section 3: XP earned — badge (theme primary) + rolling total */}
      <View style={styles.section}>
        <View style={styles.xpRow}>
          <RollingNumber
            value={xpEarned}
            fontSize={13}
            color={colors.textSecondary}
            textStyle={typography.caption}
            maxDigits={5}
            countUp
          />
          <View style={[styles.xpBadge, { backgroundColor: c.buttonPrimary }]}>
            <Text style={styles.xpBadgeLabel}>XP</Text>
            <Ionicons name="star" size={11} color={colors.white} />
          </View>
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
    fontSize: 24,
    lineHeight: 24,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpBadgeLabel: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.3,
    lineHeight: 12,
  },
});
