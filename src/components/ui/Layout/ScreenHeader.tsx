import React, { useState, useCallback } from 'react';
import { View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
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

  const [leftPillWidth, setLeftPillWidth] = useState(0);
  const [rightPillWidth, setRightPillWidth] = useState(0);
  const syncedWidth = Math.max(leftPillWidth, rightPillWidth) || undefined;

  const onLeftLayout = useCallback((e: LayoutChangeEvent) => {
    setLeftPillWidth(e.nativeEvent.layout.width);
  }, []);
  const onRightLayout = useCallback((e: LayoutChangeEvent) => {
    setRightPillWidth(e.nativeEvent.layout.width);
  }, []);

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
      {hasSlots && (
        <View style={styles.side}>
          <View onLayout={onLeftLayout} style={syncedWidth ? { width: syncedWidth } : undefined}>
            {resolvedLeft}
          </View>
        </View>
      )}
      <ScreenTitle style={hasSlots ? styles.titleWithSlots : styles.titleNoSlots}>
        {title}
      </ScreenTitle>
      {hasSlots && (
        <View style={[styles.side, styles.rightSide]}>
          <View onLayout={onRightLayout} style={syncedWidth ? { width: syncedWidth } : undefined}>
            {resolvedRight}
          </View>
        </View>
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
    alignItems: 'flex-start',
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
