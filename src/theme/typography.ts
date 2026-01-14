// Typography system for Sudokitty
// Rounded, casual style matching iOS Theme.swift

import { TextStyle } from 'react-native';

// Font weights mapping (system font)
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
  cell: 22,
  notes: 9,
};

// Pre-defined text styles
export const typography: Record<string, TextStyle> = {
  // Titles
  largeTitle: {
    fontSize: fontSizes.largeTitle,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },

  // Headings
  headline: {
    fontSize: fontSizes.headline,
    fontWeight: fontWeights.semibold,
  },

  // Body text
  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },

  // Captions
  caption: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  captionLight: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
  },

  // Small text
  small: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
  },

  // Cell text
  cellValue: {
    fontSize: fontSizes.cell,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  cellNotes: {
    fontSize: fontSizes.notes,
    fontWeight: fontWeights.regular,
    textAlign: 'center',
  },

  // Button text
  button: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  buttonSmall: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
};
