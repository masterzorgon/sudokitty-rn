// Reusable stat card component for displaying rank and streak
// Lifted card aesthetic with icon, value, and label

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';

interface StatCardProps {
  label: string;
  value: string | number;
}

export const StatCard = memo(({
  label,
  value,
}: StatCardProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

StatCard.displayName = 'StatCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  value: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
