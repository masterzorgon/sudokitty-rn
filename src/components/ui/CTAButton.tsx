import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { spacing, borderRadius } from '@/src/theme';

const EDGE_HEIGHT = 4;
const PRESS_DEPTH = 3;

type CTAVariant = 'primary' | 'secondary' | 'success' | 'disabled';

interface CTAButtonProps {
  onPress: () => void;
  label: string;
  variant?: CTAVariant;
  style?: ViewStyle;
  disabled?: boolean;
}

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

export function CTAButton({
  onPress,
  label,
  variant = 'primary',
  style,
  disabled = false,
}: CTAButtonProps) {
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
    <Animated.View style={[styles.container, animatedShadowStyle, style]}>
      {/* Bottom edge (the darker "base") - hidden for disabled */}
      {effectiveVariant !== 'disabled' && (
        <Animated.View
          style={[
            styles.edge,
            { backgroundColor: variantColors.edge },
            animatedEdgeStyle,
          ]}
        />
      )}

      {/* Button face (the pressable surface) */}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: variantColors.face },
            animatedFaceStyle,
          ]}
        >
          {/* Top highlight for plastic sheen */}
          {effectiveVariant !== 'disabled' && (
            <View
              style={[
                styles.highlight,
                { backgroundColor: variantColors.highlight },
              ]}
            />
          )}

          <Text style={[styles.label, { color: variantColors.text }]}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    height: EDGE_HEIGHT,
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
