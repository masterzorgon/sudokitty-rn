// Unified 3D edge component
// The darker shadow layer beneath the face that creates the 3D depth effect
// Replaces both Pill3DContainer and Card3DContainer

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import {
  SkeuVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';
import { CornerRadii } from './SkeuContext';

export interface Skeu3DEdgeProps {
  /** Pre-resolved colors from parent Skeu3D */
  resolvedColors: SkeuVariantColors;
  /** Resolved corner radii */
  cornerRadii: CornerRadii;
  /** Height of the 3D edge (default: 4) */
  edgeHeight?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Content to render (typically Skeu3DFace) */
  children: React.ReactNode;
}

export function Skeu3DEdge({
  resolvedColors: colors,
  cornerRadii: radii,
  edgeHeight = SKEU_DIMENSIONS.edgeHeight,
  style,
  children,
}: Skeu3DEdgeProps) {

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
