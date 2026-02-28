import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../theme/colors';
import { borderRadius as br } from '../../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface DemoPlayButtonProps {
  isPlaying: boolean;
  progress: number;
  onPress: () => void;
  size?: number;
}

const STROKE_WIDTH = 3;
const CORNER_RADIUS = br.md;

export function DemoPlayButton({
  isPlaying,
  progress,
  onPress,
  size = 48,
}: DemoPlayButtonProps) {
  const c = useColors();
  const inset = STROKE_WIDTH / 2;
  const rectSize = size - STROKE_WIDTH;
  const perimeter = 2 * (rectSize + rectSize) - 8 * CORNER_RADIUS + 2 * Math.PI * CORNER_RADIUS;

  const animatedProgress = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = progress;
    if (isPlaying && progress > 0) {
      ringOpacity.value = 1;
    } else if (!isPlaying) {
      ringOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [progress, isPlaying]);

  const animatedRectProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - animatedProgress.value),
  }));

  const animatedSvgStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.background, { borderRadius: CORNER_RADIUS, backgroundColor: c.accentLight + '40' }]} />

      <AnimatedSvg
        width={size}
        height={size}
        style={[styles.ring, animatedSvgStyle]}
      >
        <AnimatedRect
          x={inset}
          y={inset}
          width={rectSize}
          height={rectSize}
          rx={CORNER_RADIUS}
          ry={CORNER_RADIUS}
          stroke={c.accent}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${perimeter}`}
          animatedProps={animatedRectProps}
        />
      </AnimatedSvg>

      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={size * 0.4}
        color={c.accent}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: 'absolute',
  },
  icon: {
    marginLeft: 2,
  },
});
