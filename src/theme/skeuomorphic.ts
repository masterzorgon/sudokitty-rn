// Skeuomorphic 3D button style system
// Provides constants, variants, and types for consistent 3D button styling

// MARK: - Animation Timings

export const SKEU_TIMINGS = {
  pressDuration: 100,
  sheenDuration: 400,
  sheenInterval: 3000,
} as const;

// MARK: - Dimensions

export const SKEU_DIMENSIONS = {
  edgeHeight: 4,
  pressScale: 0.96,
  pressDepth: 2,
  highlightHeight: '40%',
  sheenWidth: 60,
} as const;

// MARK: - Types

export type SkeuVariant = 'primary' | 'secondary' | 'success' | 'disabled' | 'neutral';

export interface SkeuVariantColors {
  gradient: readonly [string, string, string];
  edge: string;
  borderLight: string;
  borderDark: string;
  textColor: string;
}

export interface CustomSkeuColors {
  gradient: readonly [string, string, string];
  edge: string;
  borderLight?: string;
  borderDark?: string;
  textColor?: string;
}

// MARK: - Color Variants

export const SKEU_VARIANTS: Record<SkeuVariant, SkeuVariantColors> = {
  primary: {
    gradient: ['#FF9D6B', '#FF8B55', '#FF9360'],
    edge: '#E8875A',
    borderLight: 'rgba(255, 255, 255, 0.3)',
    borderDark: 'rgba(232, 135, 90, 0.3)',
    textColor: '#FFFFFF',
  },
  secondary: {
    gradient: ['#FFFBF7', '#FFF8F0', '#FFF5EB'],
    edge: '#E8DFD4',
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: 'rgba(200, 190, 180, 0.3)',
    textColor: '#5D4E4E',
  },
  success: {
    gradient: ['#D0F0E0', '#B8E6D0', '#D0F0E0'],
    edge: '#8FCDB5',
    borderLight: 'rgba(255, 255, 255, 0.4)',
    borderDark: 'rgba(143, 205, 181, 0.3)',
    textColor: '#4A3728',
  },
  disabled: {
    gradient: ['#E8E0E0', '#E8E0E0', '#E8E0E0'],
    edge: '#D0C8C8',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    borderDark: 'rgba(208, 200, 200, 0.2)',
    textColor: '#B0A0A0',
  },
  neutral: {
    gradient: ['#FFFFFF', '#FEFEFE', '#FFFFFF'],
    edge: '#D8D0CC',
    borderLight: 'rgba(255, 255, 255, 0.8)',
    borderDark: 'rgba(0, 0, 0, 0.15)',
    textColor: '#5D4E4E',
  },
} as const;

// MARK: - Utility Functions

export function getVariantColors(
  variant: SkeuVariant,
  customColors?: CustomSkeuColors
): SkeuVariantColors {
  if (customColors) {
    return {
      gradient: customColors.gradient,
      edge: customColors.edge,
      borderLight: customColors.borderLight ?? 'rgba(255, 255, 255, 0.3)',
      borderDark: customColors.borderDark ?? 'rgba(0, 0, 0, 0.1)',
      textColor: customColors.textColor ?? '#FFFFFF',
    };
  }
  return SKEU_VARIANTS[variant];
}
