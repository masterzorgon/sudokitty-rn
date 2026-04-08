import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import { useColors } from "../../theme/colors";
import { borderRadius as br } from "../../theme";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const STROKE_WIDTH = 3;
const CORNER_RADIUS = br.md;

/** ~1% of perimeter is hard to see; floor while playing so the ring reads. */
const MIN_VISIBLE_PROGRESS = 0.02;

interface DemoPlayButtonProps {
  isPlaying: boolean;
  /** Demo length in ms (drives a linear frame-based ring; should match audio preview). */
  durationMs: number;
  onPress: () => void;
  size?: number;
  /** Override accent color (e.g. for disabled state) */
  color?: string;
}

function computePerimeter(size: number): number {
  const rectSize = size - 2 * STROKE_WIDTH;
  return 2 * (rectSize + rectSize) - 8 * CORNER_RADIUS + 2 * Math.PI * CORNER_RADIUS;
}

export function DemoPlayButton({
  isPlaying,
  durationMs,
  onPress,
  size = 48,
  color: colorOverride,
}: DemoPlayButtonProps) {
  const c = useColors();
  const color = colorOverride ?? c.accent;
  const inset = STROKE_WIDTH;
  const rectSize = size - 2 * STROKE_WIDTH;
  const perimeter = useMemo(() => computePerimeter(size), [size]);

  const progressSV = useSharedValue(0);
  const isPlayingSV = useSharedValue(false);
  const durationMsSV = useSharedValue(durationMs);
  const originReadySV = useSharedValue(false);
  const startTimestampSV = useSharedValue(0);

  const frameCallback = useFrameCallback((frameInfo) => {
    "worklet";
    if (!isPlayingSV.value) {
      return;
    }
    if (!originReadySV.value) {
      startTimestampSV.value = frameInfo.timestamp;
      originReadySV.value = true;
    }
    const elapsed = frameInfo.timestamp - startTimestampSV.value;
    const dur = durationMsSV.value;
    if (dur <= 0) {
      return;
    }
    progressSV.value = Math.min(1, elapsed / dur);
  }, false);

  useEffect(() => {
    durationMsSV.value = durationMs;
    if (isPlaying) {
      isPlayingSV.value = true;
      originReadySV.value = false;
      progressSV.value = 0;
      frameCallback.setActive(true);
    } else {
      isPlayingSV.value = false;
      originReadySV.value = false;
      progressSV.value = 0;
      frameCallback.setActive(false);
    }
  }, [isPlaying, durationMs, frameCallback, durationMsSV, isPlayingSV, originReadySV, progressSV]);

  const animatedRectProps = useAnimatedProps(() => {
    "worklet";
    const p = progressSV.value;
    const playing = isPlayingSV.value;
    let draw = 0;
    if (playing) {
      if (p <= 0) {
        draw = MIN_VISIBLE_PROGRESS;
      } else {
        draw = Math.max(p, MIN_VISIBLE_PROGRESS);
      }
    }
    draw = Math.min(1, draw);
    return { strokeDashoffset: perimeter * (1 - draw) };
  });

  const animatedSvgStyle = useAnimatedStyle(() => ({
    opacity: isPlayingSV.value ? 1 : 0,
  }));

  return (
    <Pressable onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.background,
          { borderRadius: CORNER_RADIUS, backgroundColor: (colorOverride ?? c.accentLight) + "40" },
        ]}
      />

      <Animated.View
        style={[styles.ring, { width: size, height: size }, animatedSvgStyle]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} style={{ overflow: "visible" }}>
          <AnimatedRect
            x={inset}
            y={inset}
            width={rectSize}
            height={rectSize}
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${perimeter}`}
            animatedProps={animatedRectProps}
          />
        </Svg>
      </Animated.View>

      <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={size * 0.4}
        color={color}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: "absolute",
  },
  icon: {
    marginLeft: 2,
  },
});
