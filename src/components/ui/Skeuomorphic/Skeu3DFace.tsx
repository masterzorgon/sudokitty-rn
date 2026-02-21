// Unified 3D face component
// The visible gradient surface with borders and highlight
// Replaces both Pill3DFace and Card3DFace

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SkeuVariant,
  CustomSkeuColors,
  SKEU_DIMENSIONS,
  useThemedSkeuVariants,
} from '../../../theme/skeuomorphic';
import { CornerRadii, resolveCornerRadii } from './SkeuContext';

export interface Skeu3DFaceProps {
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Uniform border radius for all corners */
  borderRadius?: number;
  /** Individual corner radii (overrides borderRadius) */
  cornerRadii?: CornerRadii;
  /** Whether to show the gradient background (default: true) */
  showGradient?: boolean;
  /** Whether to show the top highlight (default: true) */
  showHighlight?: boolean;
  /** Horizontal inset for the highlight (default: 8, use 12 for cards) */
  highlightInset?: number;
  /** Additional face styles */
  style?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Skeu3DFace({
  variant = 'primary',
  customColors,
  borderRadius,
  cornerRadii,
  showGradient = true,
  showHighlight = true,
  highlightInset = 8,
  style,
  children,
}: Skeu3DFaceProps) {
  const themedVariants = useThemedSkeuVariants();
  const colors = customColors
    ? {
        gradient: customColors.gradient,
        edge: customColors.edge,
        borderLight: customColors.borderLight ?? 'rgba(255, 255, 255, 0.3)',
        borderDark: customColors.borderDark ?? 'rgba(0, 0, 0, 0.1)',
        textColor: customColors.textColor ?? '#FFFFFF',
      }
    : themedVariants[variant];
  const radii = resolveCornerRadii(borderRadius, cornerRadii);

  const faceStyle: ViewStyle[] = [
    styles.face,
    {
      borderTopLeftRadius: radii.topLeft,
      borderTopRightRadius: radii.topRight,
      borderBottomLeftRadius: radii.bottomLeft,
      borderBottomRightRadius: radii.bottomRight,
      borderTopColor: colors.borderLight,
      borderLeftColor: colors.borderLight,
      borderRightColor: colors.borderDark,
      borderBottomColor: colors.borderDark,
    },
    style,
  ];

  const content = (
    <>
      {/* Top highlight for glossy effect */}
      {showHighlight && (
        <View
          style={[
            styles.highlight,
            {
              height: SKEU_DIMENSIONS.highlightHeight,
              left: highlightInset,
              right: highlightInset,
              // Match top corners for cards with different corner radii
              borderTopLeftRadius: radii.topLeft > 0 ? Math.min(radii.topLeft, 100) : 0,
              borderTopRightRadius: radii.topRight > 0 ? Math.min(radii.topRight, 100) : 0,
            },
          ]}
        />
      )}
      {children}
    </>
  );

  if (!showGradient) {
    return <View style={faceStyle}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={colors.gradient as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={faceStyle}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  face: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
});
