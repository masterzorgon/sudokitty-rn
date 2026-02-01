// 3D Face with gradient, highlight, and border treatment
// The main visible surface of a skeuomorphic button

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';

interface Pill3DFaceProps {
  /** Color variant preset */
  variant?: SkeuVariant;
  /** Custom colors (overrides variant) */
  customColors?: CustomSkeuColors;
  /** Border radius for the pill shape */
  borderRadius: number;
  /** Whether to show the top highlight (default: true) */
  showHighlight?: boolean;
  /** Additional face styles */
  style?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Pill3DFace({
  variant = 'primary',
  customColors,
  borderRadius,
  showHighlight = true,
  style,
  children,
}: Pill3DFaceProps) {
  const colors = getVariantColors(variant, customColors);

  return (
    <LinearGradient
      colors={colors.gradient as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.face,
        {
          borderRadius,
          borderTopColor: colors.borderLight,
          borderLeftColor: colors.borderLight,
          borderRightColor: colors.borderDark,
          borderBottomColor: colors.borderDark,
        },
        style,
      ]}
    >
      {/* Top highlight for glossy effect */}
      {showHighlight && (
        <View
          style={[
            styles.highlight,
            {
              height: SKEU_DIMENSIONS.highlightHeight,
            },
          ]}
        />
      )}
      {children}
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
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
});
