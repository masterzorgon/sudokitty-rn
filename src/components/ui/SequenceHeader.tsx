import React from 'react';
import { View, StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { BackButton } from './BackButton';
import { StepIndicator } from './StepIndicator';

interface SequenceHeaderProps {
  onBack: () => void;
  stepCount?: number;
  currentStep?: number;
}

export function SequenceHeader({ onBack, stepCount, currentStep }: SequenceHeaderProps) {
  const showSteps = stepCount != null && currentStep != null;

  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      {showSteps && (
        <View style={styles.stepsContainer}>
          <StepIndicator stepCount={stepCount} currentStep={currentStep} />
        </View>
      )}
      {showSteps && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
    paddingVertical: spacing.sm,
  },
  spacer: {
    width: 40,
  },
  stepsContainer: {
    flex: 1,
  },
});
