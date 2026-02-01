// Primary action 3D pill button (New Game / Resume)
// Follows Duolingo-style 3D press effect

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { PrimaryActionPillProps, LAYOUT } from './types';

const springConfig = {
  damping: 18,
  stiffness: 400,
  mass: 0.6,
};

export function PrimaryActionPill({ state, onPress, isHidden = false }: PrimaryActionPillProps) {
  const pressProgress = useSharedValue(0);
  const visibilityScale = useSharedValue(1);
  const visibilityOpacity = useSharedValue(1);

  // Animate scale when hidden state changes
  useEffect(() => {
    if (isHidden) {
      // Scale out: 100ms with cubic ease-out
      visibilityScale.value = withTiming(0, {
        duration: 100,
        easing: Easing.out(Easing.cubic),
      });
      visibilityOpacity.value = withTiming(0, { duration: 100 });
    } else {
      // Scale in: 100ms with cubic ease-out
      visibilityScale.value = withTiming(1, {
        duration: 100,
        easing: Easing.out(Easing.cubic),
      });
      visibilityOpacity.value = withTiming(1, { duration: 100 });
    }
  }, [isHidden, visibilityScale, visibilityOpacity]);

  const handlePressIn = useCallback(() => {
    pressProgress.value = withSpring(1, springConfig);
  }, [pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withSpring(0, springConfig);
  }, [pressProgress]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressProgress.value,
      [0, 1],
      [0, LAYOUT.pressDepth]
    );
    return {
      transform: [{ translateY }],
    };
  });

  const animatedEdgeStyle = useAnimatedStyle(() => {
    const height = interpolate(
      pressProgress.value,
      [0, 1],
      [LAYOUT.edgeHeight, LAYOUT.edgeHeight - LAYOUT.pressDepth + 1]
    );
    return {
      height,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressProgress.value, [0, 1], [0.15, 0.05]);
    const shadowRadius = interpolate(pressProgress.value, [0, 1], [8, 4]);
    return {
      shadowOpacity,
      shadowRadius,
      transform: [{ scale: visibilityScale.value }],
      opacity: visibilityOpacity.value,
    };
  });

  const label = state === 'resume' ? 'resume game' : 'new game';

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Bottom edge (the darker "base") */}
      <Animated.View style={[styles.edge, animatedEdgeStyle]} />

      {/* Button face (the pressable surface) */}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.face, animatedFaceStyle]}>
          {/* Top highlight for plastic sheen */}
          <View style={styles.highlight} />
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  edge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LAYOUT.edgeHeight,
    // backgroundColor: colors.ctaPrimaryEdge,
    // borderRadius: LAYOUT.rightPillRadius,
  },
  face: {
    paddingVertical: LAYOUT.rightPillPaddingV,
    paddingHorizontal: LAYOUT.rightPillPaddingH,
    borderRadius: LAYOUT.rightPillRadius,
    backgroundColor: colors.ctaPrimaryFace,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.ctaPrimaryHighlight,
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardBackground,
  },
});
