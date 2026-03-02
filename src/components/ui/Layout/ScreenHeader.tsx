import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { spacing, SCREEN_PADDING } from '../../../theme';
import { useTotalMochiPoints, usePlayerStreakStore } from '../../../stores/playerStreakStore';
import { useTotalXP, usePlayerLevel } from '../../../stores/playerProgressStore';
import { xpForLevel, xpProgressFraction } from '../../../constants/xp';
import { HeaderPill } from '../../home/HeaderPill';
import { LevelProgressPill } from '../../home/LevelProgressPill';
import { playFeedback } from '../../../utils/feedback';

interface ScreenHeaderProps {
  style?: ViewStyle;
}

export function ScreenHeader({ style }: ScreenHeaderProps) {
  const router = useRouter();
  const totalMochis = useTotalMochiPoints();
  const freezeCount = usePlayerStreakStore((s) => s.streakFreezesCount);
  const totalXP = useTotalXP();
  const level = usePlayerLevel();

  const goToStore = () => { playFeedback('tap'); router.push('/store'); };
  const goToStats = () => { playFeedback('tap'); router.push('/(tabs)/stats'); };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pillRow}>
        <View style={styles.pillSlot}>
          <HeaderPill type="freezes" value={freezeCount ?? 0} onPress={goToStore} />
        </View>
        <View style={styles.doublePillSlot}>
          <LevelProgressPill
            level={level}
            currentXP={totalXP - xpForLevel(level)}
            xpThreshold={xpForLevel(level + 1) - xpForLevel(level)}
            progressFraction={xpProgressFraction(totalXP, level)}
            onPress={goToStats}
          />
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
  doublePillSlot: {
    flex: 2,
  },
});
