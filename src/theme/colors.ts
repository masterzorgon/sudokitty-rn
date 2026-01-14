// Sudokitty color palette - matching iOS Theme.swift
// Soft pastel aesthetic for Gen Z female audience

export const colors = {
  // Primary colors
  cream: '#FFF8F0',
  softOrange: '#FFB085',
  peach: '#FFCAB0',
  pink: '#FFD1DC',
  lavender: '#E8D5E8',

  // Accent colors
  coral: '#FF8A80',
  mint: '#B8E6D0',
  butter: '#FFF3B0',

  // Text colors
  textPrimary: '#5D4E4E',
  textSecondary: '#8B7878',
  textLight: '#B0A0A0',

  // Cell colors
  cellBackground: '#FFFFFF',
  cellSelected: '#FFE4D6',
  cellRelated: '#FFF5EE',
  cellHighlighted: '#FFF0E8',
  cellError: '#FFE0E0',
  cellGiven: '#FFF5EE',

  // Glow effect
  glowColor: 'rgba(255, 176, 133, 0.5)',

  // Grid colors
  gridLine: '#E8D8D8',
  gridLineBold: '#D0C0C0',
  boxBorder: '#C0B0B0',

  // Note text
  noteText: '#B0A0A0',

  // Error text
  errorText: '#FF6B6B',

  // Given number text
  givenText: '#5D4E4E',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#FFB085',
  tabBarInactive: '#B0A0A0',

  // Overlay
  overlayBackground: 'rgba(0, 0, 0, 0.5)',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: '#F0E8E8',

  // Button
  buttonPrimary: '#FFB085',
  buttonSecondary: '#FFFFFF',
  buttonDisabled: '#E0D8D8',

  // Gradients (as arrays for LinearGradient)
  backgroundGradient: ['#FFF8F0', '#FFF0E8', '#FFE8E0'] as const,
  buttonGradient: ['#FFB085', '#FFCAB0'] as const,
  mochiGradient: ['#FFD4B8', '#FFB085'] as const,
} as const;

export type ColorName = keyof typeof colors;
