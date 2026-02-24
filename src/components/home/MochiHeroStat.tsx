// Hero stat section displaying total mochis with animated counter
// Shows "Your Mochis" label, large animated number, and "+XX today" badge

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { RollingNumber } from '../ui/RollingNumber';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';

interface MochiHeroStatProps {
  totalMochis: number;
  earnedToday: number;
}

export const MochiHeroStat = memo(({
  totalMochis,
  earnedToday,
}: MochiHeroStatProps) => {
  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>your mochis</Text>

      {/* Main value row with emoji and rolling number */}
      <View style={styles.valueRow}>
        <RollingNumber
          value={totalMochis}
          fontSize={48}
          color={colors.textPrimary}
          textStyle={styles.valueTextStyle}
          maxDigits={6}
        />
      </View>

      {/* Today badge - only show if earned something today */}
      {earnedToday > 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.todayBadge}
        >
          <Text style={styles.todayText}>+{earnedToday} today</Text>
        </Animated.View>
      )}
    </View>
  );
});

MochiHeroStat.displayName = 'MochiHeroStat';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 36,
  },
  valueTextStyle: {
    fontFamily: 'Pally-Bold',
  },
  todayBadge: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(184, 230, 208, 0.3)', // mint with 30% opacity
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  todayText: {
    ...typography.caption,
    color: colors.mint,
    fontFamily: 'Pally-Bold',
  },
});
