// Typography system for Sudokitty
// Uses Open Runde - a soft, rounded variant of Inter
// Perfect for the cute, friendly aesthetic of the app

import { TextStyle } from 'react-native';

// Font family names - Open Runde with different weights
// Each weight requires its own font file (OTF doesn't support weight variants)
export const fontFamilies = {
  regular: 'OpenRunde-Regular',
  medium: 'OpenRunde-Medium',
  semibold: 'OpenRunde-Semibold',
  bold: 'OpenRunde-Bold',
};

// Font weights mapping (for reference, actual weight is determined by fontFamily)
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Font sizes
export const fontSizes = {
  xs: 10,
  sm: 12,
  caption: 14,
  body: 16,
  headline: 18,
  title: 24,
  largeTitle: 32,
  cell: 24, // Slightly larger for better presence
  notes: 9,
};

// Pre-defined text styles using Open Runde font family
export const typography: Record<string, TextStyle> = {
  // Titles
  largeTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.largeTitle,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.title,
    letterSpacing: -0.3,
  },

  // Headings
  headline: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.headline,
  },

  // Body text
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.body,
  },

  // Captions
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.caption,
  },
  captionLight: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.caption,
  },

  // Small text
  small: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
  },

  // Cell text - using Open Runde for consistent aesthetic
  cellValue: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.cell,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cellNotes: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.notes,
    textAlign: 'center',
  },

  // Button text
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  buttonSmall: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
};
