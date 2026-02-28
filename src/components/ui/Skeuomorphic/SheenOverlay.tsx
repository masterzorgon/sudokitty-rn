// Animated sheen overlay
// A skewed white bar that sweeps across periodically
// Self-sizes by measuring its parent container via onLayout

import React, { useState, useCallback } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSheen } from '../../../hooks/useSheen';
import { SKEU_TIMINGS } from '../../../theme/skeuomorphic';

interface SheenOverlayProps {
  /** Duration of the sweep animation in ms */
  duration?: number;
  /** Interval between sweeps in ms */
  interval?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
  /** Opacity of the sheen (default: 0.3) */
  opacity?: number;
  /** Fraction of container width used for the sheen bar (default: 0.35) */
  sheenWidthRatio?: number;
}

export function SheenOverlay({
  duration = SKEU_TIMINGS.sheenDuration,
  interval = SKEU_TIMINGS.sheenInterval,
  enabled = true,
  opacity = 0.3,
  sheenWidthRatio = 0.35,
}: SheenOverlayProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) setContainerWidth(w);
  }, [containerWidth]);

  const { sheenStyle, sheenWidth } = useSheen({
    containerWidth,
    duration,
    interval,
    enabled,
    sheenWidthRatio,
  });

  return (
    <View style={containerStyle} onLayout={handleLayout} pointerEvents="none">
      {containerWidth > 0 && (
        <Animated.View
          style={[
            sheenBaseStyle,
            { width: sheenWidth, backgroundColor: `rgba(255, 255, 255, ${opacity})` },
            sheenStyle as any,
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const containerStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  overflow: 'hidden',
};

const sheenBaseStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
};
