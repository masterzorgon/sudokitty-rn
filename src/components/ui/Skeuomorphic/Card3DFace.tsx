// 3D Face for rectangular cards
// Similar to Pill3DFace but optimized for larger surfaces and individual corner radii

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';

interface Card3DFaceProps {
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Border radius (applies to all corners) */
  borderRadius?: number;
  /** Individual corner radii */
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  /** Whether to show the gradient background (default: true) */
  showGradient?: boolean;
  /** Whether to show the top highlight (default: true) */
  showHighlight?: boolean;
  /** Additional face styles */
  style?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Card3DFace({
  variant = 'primary',
  customColors,
  borderRadius,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  showGradient = true,
  showHighlight = true,
  style,
  children,
}: Card3DFaceProps) {
  const colors = getVariantColors(variant, customColors);

  // Use individual corner radii if provided, otherwise use borderRadius
  const cornerRadii = {
    borderTopLeftRadius: borderTopLeftRadius ?? borderRadius,
    borderTopRightRadius: borderTopRightRadius ?? borderRadius,
    borderBottomLeftRadius: borderBottomLeftRadius ?? borderRadius,
    borderBottomRightRadius: borderBottomRightRadius ?? borderRadius,
  };

  const faceStyle = [
    styles.face,
    {
      ...cornerRadii,
      borderTopColor: colors.borderLight,
      borderLeftColor: colors.borderLight,
      borderRightColor: colors.borderDark,
      borderBottomColor: colors.borderDark,
    },
    style,
  ];

  const content = (
    <>
      {/* Top highlight for glossy effect - wider for cards */}
      {showHighlight && (
        <View
          style={[
            styles.highlight,
            {
              height: SKEU_DIMENSIONS.highlightHeight,
              borderTopLeftRadius: cornerRadii.borderTopLeftRadius,
              borderTopRightRadius: cornerRadii.borderTopRightRadius,
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
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
});
