import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { spacing } from '../../theme';
import { useTotalMochiPoints } from '../../stores/dailyChallengeStore';
import { PointsHeaderPill } from '../home/PointsHeaderPill';
import { ScreenTitle } from './ScreenTitle';
import { playFeedback } from '../../utils/feedback';

interface ScreenHeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showMochiPill?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({ title, left, right, showMochiPill, style }: ScreenHeaderProps) {
  const router = useRouter();
  const totalMochis = useTotalMochiPoints();

  const mochiPill = showMochiPill ? (
    <PointsHeaderPill
      type="mochis"
      value={totalMochis}
      onPress={() => { playFeedback('tap'); router.push('/store'); }}
    />
  ) : null;

  const resolvedRight = right ?? mochiPill;
  const hasSlots = left !== undefined || resolvedRight !== null;

  return (
    <View style={[styles.container, hasSlots && styles.row, style]}>
      {hasSlots && <View style={styles.side}>{left ?? null}</View>}
      <ScreenTitle style={hasSlots ? styles.titleWithSlots : styles.titleNoSlots}>
        {title}
      </ScreenTitle>
      {hasSlots && (
        <View style={[styles.side, styles.rightSide]}>{resolvedRight}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  titleNoSlots: {
    marginBottom: 0,
  },
  titleWithSlots: {
    flex: 0,
    marginBottom: 0,
  },
});
