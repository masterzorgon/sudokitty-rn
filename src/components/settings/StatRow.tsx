import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { ROW_HEIGHT } from './constants';

interface StatRowProps {
  label: string;
  value: string;
  right?: ReactNode;
  isLast?: boolean;
}

export function StatRow({ label, value, right, isLast = false }: StatRowProps) {
  return (
    <View
      style={[styles.container, !isLast && styles.borderBottom]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.rightContent}>
        <Text style={styles.value}>{value}</Text>
        {right && <View style={styles.accessory}>{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
  },
  accessory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
