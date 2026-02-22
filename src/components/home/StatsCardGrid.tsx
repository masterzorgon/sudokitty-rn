// Stats card grid showing Global Rank and Streak side by side

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import { StatCard } from './StatCard';
import { colors, useColors } from '../../theme/colors';
import { spacing } from '../../theme';

interface StatsCardGridProps {
  streak: number;
  globalRank: number;
}

export const StatsCardGrid = memo(({
  streak,
  globalRank,
}: StatsCardGridProps) => {
  const c = useColors();
  return (
    <View style={styles.grid}>
      <StatCard
        icon="🏆"
        label="global rank"
        value={`#${globalRank.toLocaleString()}`}
        valueColor={colors.textPrimary}
      />
      <StatCard
        icon="🔥"
        label="streak"
        value={streak > 0 ? `${streak} days` : '0 days'}
        valueColor={c.accent}
      />
    </View>
  );
});

StatsCardGrid.displayName = 'StatsCardGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
