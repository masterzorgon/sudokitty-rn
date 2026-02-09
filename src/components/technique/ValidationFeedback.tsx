import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { AppButton } from '../ui/AppButton';
import type { ValidationResult } from '../../engine/validation';

// ============================================
// Types
// ============================================

interface ValidationFeedbackProps {
  validationResult: ValidationResult;
  onTryAgain: () => void;
  onTryAnother: () => void;
}

// ============================================
// Component
// ============================================

export function ValidationFeedback({
  validationResult,
  onTryAgain,
  onTryAnother,
}: ValidationFeedbackProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      {/* Validation feedback */}
      <View style={[
        styles.feedbackCard,
        validationResult.correct ? styles.feedbackCorrect : styles.feedbackIncorrect,
      ]}>
        <Feather
          name={validationResult.correct ? 'check-circle' : 'x-circle'}
          size={24}
          color={validationResult.correct ? '#4CAF50' : colors.coral}
        />
        <Text style={styles.feedbackText}>{validationResult.feedback}</Text>
      </View>

      <View style={styles.feedbackActions}>
        {validationResult.correct ? (
          <AppButton onPress={onTryAnother} label="try another" />
        ) : (
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <AppButton onPress={onTryAgain} label="try again" variant="secondary" />
            </View>
            <View style={styles.buttonWrapper}>
              <AppButton onPress={onTryAnother} label="new puzzle" />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  feedbackIncorrect: {
    backgroundColor: 'rgba(255, 92, 80, 0.1)',
  },
  feedbackText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  feedbackActions: {
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
