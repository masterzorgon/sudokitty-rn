import React from 'react';
import { View, StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { AnimatedStepDot } from './AnimatedStepDot';

interface StepIndicatorProps {
  stepCount: number;
  currentStep: number;
}

export function StepIndicator({ stepCount, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: stepCount }, (_, i) => (
        <AnimatedStepDot
          key={i}
          state={i === currentStep ? 'active' : i < currentStep ? 'completed' : 'pending'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
