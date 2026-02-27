import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { spacing } from '../../theme';
import { ScreenTitle } from './ScreenTitle';

interface ScreenHeaderProps {
  title: string;
  /**
   * Element pinned to the left of the title (e.g. a back button or invisible spacer).
   * When provided, both left and right sides get flex: 1 so the title stays centered.
   */
  left?: React.ReactNode;
  /**
   * Element pinned to the right of the title (e.g. a mochi pill).
   * When provided, both left and right sides get flex: 1 so the title stays centered.
   */
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, left, right, style }: ScreenHeaderProps) {
  const hasSlots = left !== undefined || right !== undefined;

  return (
    <View style={[styles.container, hasSlots && styles.row, style]}>
      {hasSlots && <View style={styles.side}>{left ?? null}</View>}
      <ScreenTitle style={hasSlots ? styles.titleWithSlots : undefined}>
        {title}
      </ScreenTitle>
      {hasSlots && (
        <View style={[styles.side, styles.rightSide]}>{right ?? null}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  // When slots are present the title sits between two flex: 1 views, so marginBottom
  // would push the whole row down — remove it; the container's layout handles spacing.
  titleWithSlots: {
    flex: 0,
    marginBottom: 0,
  },
});
