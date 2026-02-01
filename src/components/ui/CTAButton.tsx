import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { typography } from '@/src/theme/typography';
import { borderRadius } from '@/src/theme';
import { Pill3DContainer, Pill3DFace } from './Skeuomorphic';
import { useSkeuomorphicPress } from '@/src/hooks/useSkeuomorphicPress';
import { useFeatureFlags } from '@/src/stores/featureFlagStore';
import { SKEU_VARIANTS, SkeuVariant } from '@/src/theme/skeuomorphic';
import { ACCESSIBILITY_ROLES, getAccessibilityState } from '@/src/theme/accessibility';

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
  const { skeuomorphicCTAButton } = useFeatureFlags();

  // Use legacy implementation if feature flag is disabled
  if (!skeuomorphicCTAButton) {
    return <CTAButtonLegacy onPress={onPress} label={label} variant={variant} style={style} disabled={disabled} />;
  }

  const effectiveVariant = disabled ? 'disabled' : variant;
  const skeuVariant = variantMap[effectiveVariant];
  const { animatedStyle, pressHandlers } = useSkeuomorphicPress({
    onPress,
    disabled,
    hapticStyle: Haptics.ImpactFeedbackStyle.Medium,
  });

  return (
    <Pressable
      {...pressHandlers}
      disabled={disabled}
      accessibilityRole={ACCESSIBILITY_ROLES.button}
      accessibilityLabel={label}
      accessibilityState={getAccessibilityState({ disabled })}
      testID={`cta-button-${variant}`}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        <Pill3DContainer variant={skeuVariant} borderRadius={borderRadius.lg}>
          <Pill3DFace variant={skeuVariant} borderRadius={borderRadius.lg} style={styles.face}>
            <Text style={[styles.label, { color: SKEU_VARIANTS[skeuVariant].textColor }]}>
              {label}
            </Text>
          </Pill3DFace>
        </Pill3DContainer>
      </Animated.View>
    </Pressable>
  );
}

// Legacy implementation (will be removed after rollout)
function CTAButtonLegacy({
  onPress,
  label,
  variant = 'primary',
  style,
  disabled = false,
}: CTAButtonProps) {
  const { colors } = require('@/src/theme/colors');
  const React = require('react');
  const { useCallback } = React;
  const { useSharedValue, useAnimatedStyle, withSpring, interpolate } = require('react-native-reanimated');
  const { View } = require('react-native');

  const EDGE_HEIGHT = 4;
  const PRESS_DEPTH = 3;

  interface VariantColors {
    face: string;
    edge: string;
    highlight: string;
    text: string;
  }

  const getVariantColors = (variant: CTAVariant): VariantColors => {
    switch (variant) {
      case 'primary':
        return {
          face: colors.ctaPrimaryFace,
          edge: colors.ctaPrimaryEdge,
          highlight: colors.ctaPrimaryHighlight,
          text: colors.cardBackground,
        };
      case 'secondary':
        return {
          face: colors.ctaSecondaryFace,
          edge: colors.ctaSecondaryEdge,
          highlight: colors.ctaSecondaryHighlight,
          text: colors.softOrange,
        };
      case 'success':
        return {
          face: colors.ctaSuccessFace,
          edge: colors.ctaSuccessEdge,
          highlight: colors.ctaSuccessHighlight,
          text: colors.ctaTextDark,
        };
      case 'disabled':
        return {
          face: colors.ctaDisabledFace,
          edge: colors.ctaDisabledEdge,
          highlight: colors.ctaDisabledFace,
          text: colors.textLight,
        };
    }
  };

  const springConfig = {
    damping: 18,
    stiffness: 400,
    mass: 0.6,
  };

  const pressProgress = useSharedValue(0);
  const effectiveVariant = disabled ? 'disabled' : variant;
  const variantColors = getVariantColors(effectiveVariant);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withSpring(1, springConfig);
  }, [disabled, pressProgress]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withSpring(0, springConfig);
  }, [disabled, pressProgress]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressProgress.value, [0, 1], [0, PRESS_DEPTH]);
    return {
      transform: [{ translateY }],
    };
  });

  const animatedEdgeStyle = useAnimatedStyle(() => {
    const height = interpolate(
      pressProgress.value,
      [0, 1],
      [EDGE_HEIGHT, EDGE_HEIGHT - PRESS_DEPTH + 1]
    );
    return {
      height,
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressProgress.value, [0, 1], [0.15, 0.05]);
    const shadowRadius = interpolate(pressProgress.value, [0, 1], [8, 4]);
    return {
      shadowOpacity,
      shadowRadius,
    };
  });

  return (
    <Animated.View style={[legacyStyles.container, animatedShadowStyle, style]}>
      {effectiveVariant !== 'disabled' && (
        <Animated.View
          style={[
            legacyStyles.edge,
            { backgroundColor: variantColors.edge },
            animatedEdgeStyle,
          ]}
        />
      )}

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            legacyStyles.face,
            { backgroundColor: variantColors.face },
            animatedFaceStyle,
          ]}
        >
          {effectiveVariant !== 'disabled' && (
            <View
              style={[
                legacyStyles.highlight,
                { backgroundColor: variantColors.highlight },
              ]}
            />
          )}

          <Text style={[legacyStyles.label, { color: variantColors.text }]}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
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
    height: 4,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  face: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: borderRadius.lg,
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
    opacity: 0.6,
  },
  label: {
    ...typography.button,
    fontWeight: '600',
    fontSize: 17,
  },
});
