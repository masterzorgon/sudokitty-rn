// Skeuomorphic components barrel export
//
// Architecture (use from top to bottom based on needs):
//   Layer 3: SkeuButton, SkeuCard - Interactive components (90% of use cases)
//   Layer 2: Skeu3D - Non-interactive composite surface
//   Layer 1: Skeu3DEdge, Skeu3DFace - Primitives for custom compositions

// Layer 3: Interactive Components (Primary API)
export { SkeuButton } from './SkeuButton';
export type { SkeuButtonProps } from './SkeuButton';
export { SkeuCard } from './SkeuCard';
export type { SkeuCardProps } from './SkeuCard';
export { SkeuToggle } from './SkeuToggle';
export type { SkeuToggleProps } from './SkeuToggle';

// Layer 2: Composite Component
export { Skeu3D } from './Skeu3D';
export type { Skeu3DProps } from './Skeu3D';

// Layer 1: Primitives (Escape Hatch)
export { Skeu3DEdge } from './Skeu3DEdge';
export type { Skeu3DEdgeProps } from './Skeu3DEdge';
export { Skeu3DFace } from './Skeu3DFace';
export type { Skeu3DFaceProps } from './Skeu3DFace';

// Shared types and utilities
export { SkeuContext, resolveCornerRadii } from './SkeuContext';
export type { CornerRadii, SkeuContextValue } from './SkeuContext';

// Re-export theme constants for convenience
export { SKEU_VARIANTS, SKEU_DIMENSIONS, SKEU_TIMINGS, getVariantColors } from '../../../theme/skeuomorphic';
export type { SkeuVariant, SkeuVariantColors, CustomSkeuColors } from '../../../theme/skeuomorphic';

// Effects
export { SheenOverlay } from './SheenOverlay';
