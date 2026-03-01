// Primary action 3D pill button (New Game / Resume)
// Uses SkeuButton with visibility animations

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { borderRadius } from '@/src/theme';
import { fontFamilies } from '@/src/theme/typography';

import { PrimaryActionPillProps, LAYOUT } from './types';
import { SkeuButton, SKEU_VARIANTS } from '@/src/components/ui/Skeuomorphic';
import { useVisibilityAnimation } from '@/src/hooks/useVisibilityAnimation';

export function PrimaryActionPill({ state, onPress, isHidden = false }: PrimaryActionPillProps) {
  const visibilityStyle = useVisibilityAnimation(!isHidden);

  const label = state === 'resume' ? 'resume game' : 'new game';
  const accessibilityLabel = state === 'resume' ? 'Resume Game' : 'Start New Game';

  return (
    <Animated.View style={visibilityStyle}>
      <SkeuButton
        onPress={onPress}
        variant="primary"
        borderRadius={borderRadius.xl}
        showHighlight={false}
        feedbackId="tapHeavy"
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
    width: LAYOUT.pillWidth,
    paddingVertical: LAYOUT.rightPillPaddingV,
    paddingHorizontal: LAYOUT.rightPillPaddingH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
    fontFamily: fontFamilies.bold,
  },
});
