import React, { useCallback, useState } from 'react';
import { View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, SCREEN_PADDING } from '../../../theme';
import { useTotalMochiPoints, usePlayerStreakStore } from '../../../stores/playerStreakStore';
import { useTotalXP, usePlayerLevel } from '../../../stores/playerProgressStore';
import { xpForLevel, xpProgressFraction } from '../../../constants/xp';
import { HeaderPill } from '../../home/HeaderPill';
import { LevelProgressPill } from '../../home/LevelProgressPill';
import { playFeedback } from '../../../utils/feedback';
import { MochiPurchaseSheet } from '../../store/MochiPurchaseSheet';
import { StreakFreezePurchaseSheet } from '../../store/StreakFreezePurchaseSheet';

const FADE_ZONE_HEIGHT = 40;

interface ScreenHeaderProps {
  style?: ViewStyle;
  onHeightChange?: (height: number) => void;
}

export function ScreenHeader({ style, onHeightChange }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const totalMochis = useTotalMochiPoints();
  const freezeCount = usePlayerStreakStore((s) => s.streakFreezesCount);
  const totalXP = useTotalXP();
  const level = usePlayerLevel();

  const [mochiSheetVisible, setMochiSheetVisible] = useState(false);
  const [freezeSheetVisible, setFreezeSheetVisible] = useState(false);

  const goToStore = () => { playFeedback('tap'); router.push('/store'); };
  const goToStats = () => { playFeedback('tap'); router.push('/(tabs)/stats'); };
  const openMochiSheet = () => { playFeedback('tap'); setMochiSheetVisible(true); };
  const openFreezeSheet = () => { playFeedback('tap'); setFreezeSheetVisible(true); };

  const handleContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onHeightChange?.(e.nativeEvent.layout.height);
    },
    [onHeightChange],
  );

  return (
    <View style={[styles.outer, style]} pointerEvents="box-none">
      {/* Blur backdrop with gradient fade */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
      </MaskedView>

      {/* Pill content */}
      <View
        style={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        onLayout={handleContentLayout}
      >
        <View style={styles.pillRow}>
          <View style={styles.pillSlot}>
            <HeaderPill type="freezes" value={freezeCount ?? 0} onPress={openFreezeSheet} />
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
            <HeaderPill type="mochis" value={totalMochis} onPress={openMochiSheet} />
          </View>
        </View>
      </View>

      <MochiPurchaseSheet
        visible={mochiSheetVisible}
        onDismiss={() => setMochiSheetVisible(false)}
      />
      <StreakFreezePurchaseSheet
        visible={freezeSheetVisible}
        onDismiss={() => setFreezeSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: FADE_ZONE_HEIGHT,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.sm,
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
