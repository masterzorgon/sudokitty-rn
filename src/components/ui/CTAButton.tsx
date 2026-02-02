// CTAButton - Call-to-action button with skeuomorphic styling
// Uses SkeuButton for consistent 3D appearance and animations

import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { typography } from '@/src/theme/typography';
import { borderRadius } from '@/src/theme';
import { SkeuButton, SKEU_VARIANTS } from './Skeuomorphic';
import { SkeuVariant } from '@/src/theme/skeuomorphic';

type CTAVariant = 'primary' | 'secondary' | 'success' | 'disabled';

interface CTAButtonProps {
  onPress: () => void;
  label: string;
  variant?: CTAVariant;
  style?: ViewStyle;
  disabled?: boolean;
}

// Map CTAVariant to SkeuVariant
const variantMap: Record<CTAVariant, SkeuVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  disabled: 'disabled',
};

export function CTAButton({
  onPress,
  label,
  variant = 'primary',
  style,
  disabled = false,
}: CTAButtonProps) {
  const effectiveVariant = disabled ? 'disabled' : variant;
  const skeuVariant = variantMap[effectiveVariant];

  return (
    <SkeuButton
      onPress={onPress}
      variant={skeuVariant}
      borderRadius={borderRadius.lg}
      disabled={disabled}
      hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
      style={style}
      contentStyle={styles.face}
      accessibilityLabel={label}
      testID={`cta-button-${variant}`}
    >
      <Text style={[styles.label, { color: SKEU_VARIANTS[skeuVariant].textColor }]}>
        {label}
      </Text>
    </SkeuButton>
  );
}

const styles = StyleSheet.create({
  face: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    fontWeight: '600',
    fontSize: 17,
  },
});
