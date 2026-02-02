// Interactive skeuomorphic card
// Similar to SkeuButton but optimized for larger card-like surfaces
// Press is optional - can be used for non-interactive cards too

import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  SkeuVariant,
  CustomSkeuColors,
  SKEU_VARIANTS,
} from '../../../theme/skeuomorphic';
import { useSkeuomorphicPress } from '../../../hooks/useSkeuomorphicPress';
import { CornerRadii } from './SkeuContext';
import { Skeu3D } from './Skeu3D';

export interface SkeuCardProps {
  // Interaction (optional for cards)
  /** Press handler (optional - card can be non-interactive) */
  onPress?: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;

  // Appearance
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Uniform border radius for all corners */
  borderRadius?: number;
  /** Individual corner radii (overrides borderRadius) */
  cornerRadii?: CornerRadii;
  /** Whether to show the top highlight (default: true) */
  showHighlight?: boolean;
  /** Horizontal inset for the highlight (default: 12 for cards) */
  highlightInset?: number;

  // Animation
  /** Haptic feedback style (default: Light) */
  hapticStyle?: Haptics.ImpactFeedbackStyle;

  // Layout
  /** Additional wrapper styles */
  style?: ViewStyle;
  /** Additional content/face styles */
  contentStyle?: ViewStyle;

  // Accessibility
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;

  /** Content to render */
  children: React.ReactNode;
}

export function SkeuCard({
  // Interaction
  onPress,
  disabled = false,

  // Appearance
  variant = 'secondary',
  customColors,
  borderRadius,
  cornerRadii,
  showHighlight = true,
  highlightInset = 12, // Cards use larger inset

  // Animation
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,

  // Layout
  style,
  contentStyle,

  // Accessibility
  accessibilityLabel,
  testID,

  // Content
  children,
}: SkeuCardProps) {
  // Only use press animation if onPress is provided
  const isInteractive = !!onPress;
  
  const { animatedStyle, pressHandlers } = useSkeuomorphicPress({
    onPress: onPress ?? (() => {}),
    disabled: disabled || !isInteractive,
    hapticStyle,
  });

  const effectiveVariant = disabled ? 'disabled' : variant;

  const content = (
    <Skeu3D
      variant={effectiveVariant}
      customColors={customColors}
      borderRadius={borderRadius}
      cornerRadii={cornerRadii}
      showHighlight={showHighlight}
      highlightInset={highlightInset}
      faceStyle={contentStyle}
    >
      {children}
    </Skeu3D>
  );

  // Non-interactive cards don't need Pressable wrapper
  if (!isInteractive) {
    return (
      <Animated.View style={style}>
        {content}
      </Animated.View>
    );
  }

  return (
    <Pressable
      {...pressHandlers}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

// Re-export for convenience
export { SKEU_VARIANTS };
