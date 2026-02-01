// Primary action 3D pill button (New Game / Resume)
// Uses skeuomorphic design system with visibility animations

import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { PrimaryActionPillProps, LAYOUT } from './types';
import { Pill3DContainer, Pill3DFace } from '../Skeuomorphic';
import { useSkeuomorphicPress } from '@/src/hooks/useSkeuomorphicPress';
import { useFeatureFlags } from '@/src/stores/featureFlagStore';
import { SKEU_VARIANTS } from '@/src/theme/skeuomorphic';
import { ACCESSIBILITY_ROLES } from '@/src/theme/accessibility';

export function PrimaryActionPill({ state, onPress, isHidden = false }: PrimaryActionPillProps) {
  const { skeuomorphicPrimaryPill } = useFeatureFlags();

  // Use legacy implementation if feature flag is disabled
  if (!skeuomorphicPrimaryPill) {
    return <PrimaryActionPillLegacy state={state} onPress={onPress} isHidden={isHidden} />;
  }

  const visibilityScale = useSharedValue(1);
  const visibilityOpacity = useSharedValue(1);

  // Animate scale when hidden state changes (preserve existing animation)
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

  const { animatedStyle: pressAnimatedStyle, pressHandlers } = useSkeuomorphicPress({
    onPress,
    hapticStyle: Haptics.ImpactFeedbackStyle.Medium,
  });

  // Combine press animation with visibility animation
  const combinedAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: visibilityScale.value },
      ],
      opacity: visibilityOpacity.value,
    };
  });

  const label = state === 'resume' ? 'resume game' : 'new game';
  const accessibilityLabel = state === 'resume' ? 'Resume Game' : 'Start New Game';

  return (
    <Pressable
      {...pressHandlers}
      accessibilityRole={ACCESSIBILITY_ROLES.button}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={state === 'resume' ? 'Continue your previous game' : 'Start a new game'}
      testID={`primary-action-pill-${state}`}
    >
      <Animated.View style={combinedAnimatedStyle}>
        <Animated.View style={pressAnimatedStyle}>
          <Pill3DContainer variant="primary" borderRadius={LAYOUT.rightPillRadius}>
            <Pill3DFace
              variant="primary"
              borderRadius={LAYOUT.rightPillRadius}
              style={styles.face}
              showHighlight={false}
            >
              <Text style={[styles.label, { color: SKEU_VARIANTS.primary.textColor }]}>
                {label}
              </Text>
            </Pill3DFace>
          </Pill3DContainer>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// Legacy implementation (will be removed after rollout)
function PrimaryActionPillLegacy({ state, onPress, isHidden = false }: PrimaryActionPillProps) {
  const React = require('react');
  const { useCallback, useEffect } = React;
  const { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Easing } = require('react-native-reanimated');
  const { View } = require('react-native');
  const { colors } = require('@/src/theme/colors');

  const springConfig = {
    damping: 18,
    stiffness: 400,
    mass: 0.6,
  };

  const pressProgress = useSharedValue(0);
  const visibilityScale = useSharedValue(1);
  const visibilityOpacity = useSharedValue(1);

  useEffect(() => {
    if (isHidden) {
      visibilityScale.value = withTiming(0, {
        duration: 100,
        easing: Easing.out(Easing.cubic),
      });
      visibilityOpacity.value = withTiming(0, { duration: 100 });
    } else {
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
    <Animated.View style={[legacyStyles.container, animatedContainerStyle]}>
      <Animated.View style={[legacyStyles.edge, animatedEdgeStyle]} />
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[legacyStyles.face, animatedFaceStyle]}>
          <View style={legacyStyles.highlight} />
          <Text style={legacyStyles.label}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: {
    paddingVertical: LAYOUT.rightPillPaddingV,
    paddingHorizontal: LAYOUT.rightPillPaddingH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});

// Legacy styles (will be removed after rollout)
const legacyStyles = StyleSheet.create({
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
  },
  face: {
    paddingVertical: LAYOUT.rightPillPaddingV,
    paddingHorizontal: LAYOUT.rightPillPaddingH,
    borderRadius: LAYOUT.rightPillRadius,
    backgroundColor: require('@/src/theme/colors').colors.ctaPrimaryFace,
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
    backgroundColor: require('@/src/theme/colors').colors.ctaPrimaryHighlight,
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: require('@/src/theme/colors').colors.cardBackground,
  },
});
