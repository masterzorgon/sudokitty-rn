// XP placement badge — floats above the cell on manual correct placement.
// Animates: entry (scale + opacity) → hold → exit (translate up + fade out).

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { CELL_SIZE } from './SudokuCell';

const BADGE_WIDTH = 56;
const BADGE_HEIGHT = 24;
const ENTRY_MS = 100;
const HOLD_MS = 800;
const EXIT_MS = 500;
const EXIT_TRANSLATE_Y = -16;

export interface XPBadgeProps {
  row: number;
  col: number;
  xp: number;
  /** Optional event key to force animation replay on same-cell consecutive placements */
  eventKey?: number;
}

export function XPBadge({ row, col, xp, eventKey }: XPBadgeProps) {
  const c = useColors();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Reset to initial values before replaying (avoids remount for same-cell placements)
    scale.value = 0.6;
    opacity.value = 0;
    translateY.value = 0;

    // Entry: snappy scale + opacity (timing, no spring overshoot)
    scale.value = withTiming(1, {
      duration: ENTRY_MS,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withSequence(
      withTiming(1, { duration: ENTRY_MS, easing: Easing.out(Easing.quad) }),
      withDelay(
        HOLD_MS,
        withTiming(0, {
          duration: EXIT_MS,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    // Exit (after hold): translate up
    translateY.value = withDelay(
      ENTRY_MS + HOLD_MS,
      withTiming(EXIT_TRANSLATE_Y, {
        duration: EXIT_MS,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [row, col, xp, eventKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const left = col * CELL_SIZE + (CELL_SIZE - BADGE_WIDTH) / 2;
  const top = row * CELL_SIZE - 8; // Slightly above cell top

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.badge,
        { left, top, backgroundColor: 'rgba(255,255,255,0.95)' },
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, { color: c.accent }]}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
});
