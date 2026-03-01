// Shared context for skeuomorphic components
// Allows Skeu3D to pass variant/colors to children without prop drilling

import { createContext } from 'react';
import type { SkeuVariantColors } from '../../../theme/skeuomorphic';

// Corner radii type for individual corner control
export interface CornerRadii {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

// Resolve corner radii from either uniform or individual values
export function resolveCornerRadii(
  borderRadius?: number,
  cornerRadii?: CornerRadii
): Required<CornerRadii> {
  if (cornerRadii) {
    return {
      topLeft: cornerRadii.topLeft ?? 0,
      topRight: cornerRadii.topRight ?? 0,
      bottomLeft: cornerRadii.bottomLeft ?? 0,
      bottomRight: cornerRadii.bottomRight ?? 0,
    };
  }
  const radius = borderRadius ?? 0;
  return {
    topLeft: radius,
    topRight: radius,
    bottomLeft: radius,
    bottomRight: radius,
  };
}

// Context value passed from Skeu3D to children
export interface SkeuContextValue {
  colors: SkeuVariantColors;
  radii: Required<CornerRadii>;
  edgeHeight: number;
}

export const SkeuContext = createContext<SkeuContextValue | null>(null);
