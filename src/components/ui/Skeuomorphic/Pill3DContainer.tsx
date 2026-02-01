// 3D Container with edge layer
// Wraps content and provides the 3D depth effect via a darker edge beneath

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';

interface Pill3DContainerProps {
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Border radius for the pill shape */
  borderRadius: number;
  /** Height of the 3D edge (default: 4) */
  edgeHeight?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Pill3DContainer({
  variant = 'primary',
  customColors,
  borderRadius,
  edgeHeight = SKEU_DIMENSIONS.edgeHeight,
  style,
  children,
}: Pill3DContainerProps) {
  const colors = getVariantColors(variant, customColors);

  return (
    <View style={[styles.container, style]}>
      {/* 3D edge (the darker "base" beneath) */}
      <View
        style={[
          styles.edge,
          {
            backgroundColor: colors.edge,
            borderRadius,
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
