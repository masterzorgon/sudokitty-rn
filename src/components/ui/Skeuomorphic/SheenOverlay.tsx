// Animated sheen overlay
// A skewed white bar that sweeps across periodically

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSheen } from '../../../hooks/useSheen';
import { SKEU_DIMENSIONS, SKEU_TIMINGS } from '../../../theme/skeuomorphic';

interface SheenOverlayProps {
  /** Width of the sheen bar (default: 60) */
  width?: number;
  /** Duration of the sweep animation in ms (default: 400) */
  duration?: number;
  /** Interval between sweeps in ms (default: 3000) */
  interval?: number;
  /** Target X position to sweep to (default: 250) */
  targetX?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
  /** Opacity of the sheen (default: 0.3) */
  opacity?: number;
}

export function SheenOverlay({
  width = SKEU_DIMENSIONS.sheenWidth,
  duration = SKEU_TIMINGS.sheenDuration,
  interval = SKEU_TIMINGS.sheenInterval,
  targetX = 250,
  enabled = true,
  opacity = 0.3,
}: SheenOverlayProps) {
  const { sheenStyle } = useSheen({
    width,
    duration,
    interval,
    targetX,
    enabled,
  });

  return (
    <Animated.View
      style={[
        styles.sheen,
        { width, backgroundColor: `rgba(255, 255, 255, ${opacity})` },
        sheenStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
