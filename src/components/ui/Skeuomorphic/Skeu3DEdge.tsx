// Unified 3D edge component
// The darker shadow layer beneath the face that creates the 3D depth effect
// Replaces both Pill3DContainer and Card3DContainer

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';
import { CornerRadii, resolveCornerRadii } from './SkeuContext';

export interface Skeu3DEdgeProps {
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Uniform border radius for all corners */
  borderRadius?: number;
  /** Individual corner radii (overrides borderRadius) */
  cornerRadii?: CornerRadii;
  /** Height of the 3D edge (default: 4) */
  edgeHeight?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Content to render (typically Skeu3DFace) */
  children: React.ReactNode;
}

export function Skeu3DEdge({
  variant = 'primary',
  customColors,
  borderRadius,
  cornerRadii,
  edgeHeight = SKEU_DIMENSIONS.edgeHeight,
  style,
  children,
}: Skeu3DEdgeProps) {
  const colors = getVariantColors(variant, customColors);
  const radii = resolveCornerRadii(borderRadius, cornerRadii);

  return (
    <View style={[styles.container, style]}>
      {/* 3D edge (the darker "base" beneath) */}
      <View
        style={[
          styles.edge,
          {
            backgroundColor: colors.edge,
            borderTopLeftRadius: radii.topLeft,
            borderTopRightRadius: radii.topRight,
            borderBottomLeftRadius: radii.bottomLeft,
            borderBottomRightRadius: radii.bottomRight,
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
