import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { spacing, SCREEN_PADDING } from '../../../theme';
import { useTotalMochiPoints, useDailyChallengeStore } from '../../../stores/dailyChallengeStore';
import { useTotalXP, usePlayerLevel } from '../../../stores/playerProgressStore';
import { HeaderPill } from '../../home/HeaderPill';
import { playFeedback } from '../../../utils/feedback';

interface ScreenHeaderProps {
  style?: ViewStyle;
}

export function ScreenHeader({ style }: ScreenHeaderProps) {
  const router = useRouter();
  const totalMochis = useTotalMochiPoints();
  const freezeCount = useDailyChallengeStore((s) => s.streakFreezesCount);
  const totalXP = useTotalXP();
  const level = usePlayerLevel();

  const goToStore = () => { playFeedback('tap'); router.push('/store'); };
  const goToProfile = () => { playFeedback('tap'); router.push('/(tabs)/profile'); };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pillRow}>
        <View style={styles.pillSlot}>
          <HeaderPill type="freezes" value={freezeCount ?? 0} onPress={goToStore} />
        </View>
        <View style={styles.pillSlot}>
          <HeaderPill type="xp" value={totalXP} onPress={goToProfile} />
        </View>
        <View style={styles.pillSlot}>
          <HeaderPill type="level" value={level} onPress={goToProfile} />
        </View>
        <View style={styles.pillSlot}>
          <HeaderPill type="mochis" value={totalMochis} onPress={goToStore} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillSlot: {
    flex: 1,
  },
});
