// Composite skeuomorphic component
// Combines Edge + Face with Context for shared props
// Use for non-interactive skeuomorphic surfaces

import React from 'react';
import { ViewStyle } from 'react-native';

import {
  SkeuVariant,
  CustomSkeuColors,
  getVariantColors,
  SKEU_DIMENSIONS,
} from '../../../theme/skeuomorphic';
import { SkeuContext, CornerRadii, resolveCornerRadii } from './SkeuContext';
import { Skeu3DEdge } from './Skeu3DEdge';
import { Skeu3DFace } from './Skeu3DFace';

export interface Skeu3DProps {
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
  /** Whether to show the gradient background (default: true) */
  showGradient?: boolean;
  /** Whether to show the top highlight (default: true) */
  showHighlight?: boolean;
  /** Horizontal inset for the highlight (default: 8) */
  highlightInset?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional face styles */
  faceStyle?: ViewStyle;
  /** Content to render */
  children: React.ReactNode;
}

export function Skeu3D({
  variant = 'primary',
  customColors,
  borderRadius,
  cornerRadii,
  edgeHeight = SKEU_DIMENSIONS.edgeHeight,
  showGradient = true,
  showHighlight = true,
  highlightInset = 8,
  style,
  faceStyle,
  children,
}: Skeu3DProps) {
  const colors = getVariantColors(variant, customColors);
  const radii = resolveCornerRadii(borderRadius, cornerRadii);

  // Provide context for any nested components that might need it
  const contextValue = {
    colors,
    radii,
    edgeHeight,
  };

  return (
    <SkeuContext.Provider value={contextValue}>
      <Skeu3DEdge
        variant={variant}
        customColors={customColors}
        cornerRadii={radii}
        edgeHeight={edgeHeight}
        style={style}
      >
        <Skeu3DFace
          variant={variant}
          customColors={customColors}
          cornerRadii={radii}
          showGradient={showGradient}
          showHighlight={showHighlight}
          highlightInset={highlightInset}
          style={faceStyle}
        >
          {children}
        </Skeu3DFace>
      </Skeu3DEdge>
    </SkeuContext.Provider>
  );
}
