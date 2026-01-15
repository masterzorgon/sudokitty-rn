// Stats card grid showing Global Rank and Streak side by side

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import { StatCard } from './StatCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';

interface StatsCardGridProps {
  streak: number;
  globalRank: number;
}

export const StatsCardGrid = memo(({
  streak,
  globalRank,
}: StatsCardGridProps) => {
  return (
    <View style={styles.grid}>
      <StatCard
        icon="🏆"
        label="Global Rank"
        value={`#${globalRank.toLocaleString()}`}
        valueColor={colors.textPrimary}
      />
      <StatCard
        icon="🔥"
        label="Streak"
        value={streak > 0 ? `${streak} days` : '0 days'}
        valueColor={colors.softOrange}
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
