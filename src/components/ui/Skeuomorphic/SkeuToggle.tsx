// Skeuomorphic toggle switch component
// Matches the app's 3D aesthetic with edge depth

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemedSkeuVariants } from '../../../theme/skeuomorphic';
import { triggerHaptic, ImpactFeedbackStyle } from '../../../utils/haptics';

// Toggle dimensions
const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const THUMB_MARGIN = 3;
const EDGE_HEIGHT = 3;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_RADIUS = THUMB_SIZE / 2;

const ANIMATION_DURATION = 200;

const OFF_TRACK = ['#E8E0E0', '#E0D8D8', '#E8E0E0'] as const;
const OFF_EDGE = '#C8C0C0';
const THUMB_GRADIENT = ['#FFFFFF', '#FAFAFA', '#FFFFFF'] as const;
const OFF_THUMB_EDGE = '#E0E0E0';
const ON_THUMB_EDGE = '#E8E8E8';

export interface SkeuToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function SkeuToggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: SkeuToggleProps) {
  const skeuVariants = useThemedSkeuVariants();
  const onEdge = skeuVariants.primary.edge;
  const onTrack = skeuVariants.primary.gradient;

  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerHaptic(ImpactFeedbackStyle.Light);
    onValueChange(!value);
  }, [disabled, value, onValueChange]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [THUMB_MARGIN, TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN]
    );
    return { transform: [{ translateX }] };
  });

  const trackEdgeAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [OFF_EDGE, onEdge]
    );
    return { backgroundColor };
  });

  const thumbEdgeAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [OFF_THUMB_EDGE, ON_THUMB_EDGE]
    );
    return { backgroundColor };
  });

  const trackGradientColors = value ? onTrack : OFF_TRACK;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, disabled && styles.disabled]}
    >
      {/* Track container */}
      <View style={styles.trackContainer}>
        {/* Track edge (3D depth) */}
        <Animated.View style={[styles.trackEdge, trackEdgeAnimatedStyle]} />
        
        {/* Track face */}
        <LinearGradient
          colors={trackGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trackFace}
        />
      </View>

      {/* Thumb */}
      <Animated.View style={[styles.thumbWrapper, thumbAnimatedStyle]}>
        {/* Thumb edge (3D depth) */}
        <Animated.View style={[styles.thumbEdge, thumbEdgeAnimatedStyle]} />
        
        {/* Thumb face */}
        <LinearGradient
          colors={THUMB_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumbFace}
        >
          {/* Highlight */}
          <View style={styles.thumbHighlight} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT + EDGE_HEIGHT,
  },
  disabled: {
    opacity: 0.5,
  },
  trackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT + EDGE_HEIGHT,
  },
  trackEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
  },
  trackFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  thumbWrapper: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE + EDGE_HEIGHT,
  },
  thumbEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
  },
  thumbFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  thumbHighlight: {
    position: 'absolute',
    top: 3,
    left: 4,
    right: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
