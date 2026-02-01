// 3D Container for rectangular cards
// Similar to Pill3DContainer but supports individual corner radii and larger surfaces

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';

interface Card3DContainerProps {
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
  /** Height of the 3D edge (default: 4) */
  edgeHeight?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Card3DContainer({
  variant = 'primary',
  customColors,
  borderRadius,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  edgeHeight = SKEU_DIMENSIONS.edgeHeight,
  style,
  children,
}: Card3DContainerProps) {
  const colors = getVariantColors(variant, customColors);

  // Use individual corner radii if provided, otherwise use borderRadius
  const cornerRadii = {
    borderTopLeftRadius: borderTopLeftRadius ?? borderRadius,
    borderTopRightRadius: borderTopRightRadius ?? borderRadius,
    borderBottomLeftRadius: borderBottomLeftRadius ?? borderRadius,
    borderBottomRightRadius: borderBottomRightRadius ?? borderRadius,
  };

  return (
    <View style={[styles.container, style]}>
      {/* 3D edge (the darker "base" beneath) */}
      <View
        style={[
          styles.edge,
          {
            backgroundColor: colors.edge,
            ...cornerRadii,
            height: '100%',
            bottom: -edgeHeight,
          },
        ]}
      />
      {/* Content (the face) */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
