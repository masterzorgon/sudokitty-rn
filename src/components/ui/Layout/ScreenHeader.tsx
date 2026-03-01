import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { spacing } from '../../../theme';
import { useTotalMochiPoints, useDailyChallengeStore } from '../../../stores/dailyChallengeStore';
import { HeaderPill } from '../../home/HeaderPill';
import { ScreenTitle } from '../Typography/ScreenTitle';
import { playFeedback } from '../../../utils/feedback';

interface ScreenHeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showMochiPill?: boolean;
  showFreezePill?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({ title, left, right, showMochiPill, showFreezePill, style }: ScreenHeaderProps) {
  const router = useRouter();
  const totalMochis = useTotalMochiPoints();
  const freezeCount = useDailyChallengeStore((s) => s.streakFreezesCount);

  const mochiPill = showMochiPill ? (
    <HeaderPill
      type="mochis"
      value={totalMochis}
      onPress={() => { playFeedback('tap'); router.push('/store'); }}
    />
  ) : null;

  const freezePill = showFreezePill ? (
    <HeaderPill
      type="freezes"
      value={freezeCount ?? 0}
      onPress={() => { playFeedback('tap'); router.push('/store'); }}
    />
  ) : null;

  const resolvedLeft = left ?? freezePill;
  const resolvedRight = right ?? mochiPill;
  const hasSlots = resolvedLeft !== null || resolvedRight !== null;

  return (
    <View style={[styles.container, hasSlots && styles.row, style]}>
      {hasSlots && <View style={styles.side}>{resolvedLeft}</View>}
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
    paddingBottom: spacing.xl + 10, // extra visual breathing room below header text
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
