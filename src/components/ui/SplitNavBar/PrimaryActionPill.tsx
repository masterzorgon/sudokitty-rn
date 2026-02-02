// Primary action 3D pill button (New Game / Resume)
// Uses SkeuButton with visibility animations

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { PrimaryActionPillProps, LAYOUT } from './types';
import { SkeuButton, SKEU_VARIANTS } from '../Skeuomorphic';

export function PrimaryActionPill({ state, onPress, isHidden = false }: PrimaryActionPillProps) {
  const visibilityScale = useSharedValue(1);
  const visibilityOpacity = useSharedValue(1);

  // Animate scale when hidden state changes
  useEffect(() => {
    const config = { duration: 100, easing: Easing.out(Easing.cubic) };
    visibilityScale.value = withTiming(isHidden ? 0 : 1, config);
    visibilityOpacity.value = withTiming(isHidden ? 0 : 1, { duration: 100 });
  }, [isHidden, visibilityScale, visibilityOpacity]);

  const visibilityAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: visibilityScale.value }],
    opacity: visibilityOpacity.value,
  }));

  const label = state === 'resume' ? 'resume game' : 'new game';
  const accessibilityLabel = state === 'resume' ? 'Resume Game' : 'Start New Game';

  return (
    <Animated.View style={visibilityAnimatedStyle}>
      <SkeuButton
        onPress={onPress}
        variant="primary"
        borderRadius={LAYOUT.rightPillRadius}
        showHighlight={false}
        hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
        contentStyle={styles.face}
        accessibilityLabel={accessibilityLabel}
        testID={`primary-action-pill-${state}`}
      >
        <Text style={[styles.label, { color: SKEU_VARIANTS.primary.textColor }]}>
          {label}
        </Text>
      </SkeuButton>
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
