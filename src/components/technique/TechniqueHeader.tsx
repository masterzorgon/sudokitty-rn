import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { StepIndicator } from './StepIndicator';
import type { TechniqueMetadata } from '../../data/techniqueMetadata';

interface TechniqueHeaderProps {
  metadata: TechniqueMetadata;
  onBack: () => void;
  stepCount?: number;
  currentStep?: number;
}

export function TechniqueHeader({ metadata, onBack, stepCount, currentStep }: TechniqueHeaderProps) {
  const showSteps = stepCount != null && currentStep != null;

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Feather name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>
      {showSteps && (
        <View style={styles.stepsContainer}>
          <StepIndicator stepCount={stepCount} currentStep={currentStep} />
        </View>
      )}
      {showSteps && <View style={styles.backButton} />}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    flex: 1,
  },
});
