// Interactive skeuomorphic button
// Combines Skeu3D with press animation, haptics, and accessibility
// This is the primary API for most button use cases

import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  SkeuVariant,
  CustomSkeuColors,
  SKEU_VARIANTS,
  useThemedSkeuVariants,
} from '../../../theme/skeuomorphic';
import { useSkeuomorphicPress } from '../../../hooks/useSkeuomorphicPress';
import type { FeedbackId } from '../../../utils/feedback';
import { CornerRadii } from './SkeuContext';
import { Skeu3D } from './Skeu3D';
import { SheenOverlay } from './SheenOverlay';

export interface SkeuButtonProps {
  // Interaction
  /** Press handler */
  onPress: () => void;
  /** Whether the button is disabled */
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
  /** Horizontal inset for the highlight (default: 8) */
  highlightInset?: number;
  /** Whether to show animated sheen effect (default: false) */
  sheen?: boolean;

  // Animation
  /** Haptic feedback style (default: Light). Ignored if feedbackId is set. */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Override with specific feedback (e.g. 'erase', 'notesToggle', 'hint') */
  feedbackId?: FeedbackId;
  /** Disable built-in animation for custom animation (default: false) */
  disableAnimation?: boolean;

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

export function SkeuButton({
  // Interaction
  onPress,
  disabled = false,

  // Appearance
  variant = 'primary',
  customColors,
  borderRadius,
  cornerRadii,
  showHighlight = true,
  highlightInset = 8,
  sheen = false,

  // Animation
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  feedbackId,
  disableAnimation = false,

  // Layout
  style,
  contentStyle,

  // Accessibility
  accessibilityLabel,
  testID,

  // Content
  children,
}: SkeuButtonProps) {
  // Use the skeuomorphic press hook for animation
  const { animatedStyle, pressHandlers } = useSkeuomorphicPress({
    onPress,
    disabled,
    hapticStyle,
    feedbackId,
  });

  const themedVariants = useThemedSkeuVariants();
  const effectiveVariant = disabled ? 'disabled' : variant;
  const textColor = customColors?.textColor ?? themedVariants[effectiveVariant].textColor;

  // Wrap content with animation if enabled
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
      {sheen && <SheenOverlay width={260} targetX={400} opacity={0.25} />}
      {children}
    </Skeu3D>
  );

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
      {disableAnimation ? (
        content
      ) : (
        <Animated.View style={animatedStyle}>
          {content}
        </Animated.View>
      )}
    </Pressable>
  );
}

// Re-export for convenience - allows consumers to get text color
export { SKEU_VARIANTS };
