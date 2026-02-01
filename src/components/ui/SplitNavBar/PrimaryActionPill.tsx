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
import { SKEU_VARIANTS } from '@/src/theme/skeuomorphic';
import { ACCESSIBILITY_ROLES } from '@/src/theme/accessibility';

export function PrimaryActionPill({ state, onPress, isHidden = false }: PrimaryActionPillProps) {

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
