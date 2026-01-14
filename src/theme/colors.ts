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
  cellBackgroundAlt: '#FFFBF7', // Subtle cream tint for checkerboard boxes
  cellSelected: '#FFE4D6',
  cellSelectedGlow: 'rgba(255, 176, 133, 0.25)', // Soft glow for selection
  cellRelated: '#FFF8F2',
  cellHighlighted: '#FFF5EE',
  cellError: '#FFF0F0',
  cellGiven: '#FFFBF8',

  // Glow effect
  glowColor: 'rgba(255, 176, 133, 0.4)',

  // Grid colors - softer, warmer
  gridLine: '#F0E8E4', // Hairline warm gray
  gridLineBold: '#E8DCD8', // Box borders - slightly heavier but still soft
  boxBorder: '#E0D4D0',

  // Note text
  noteText: '#C0B0A8',

  // Error text
  errorText: '#E85A5A',

  // Given number text - darker, more "printed"
  givenText: '#4A3C3C',

  // User entry text - softer, warmer
  userEntryText: '#6B5858',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#FFB085',
  tabBarInactive: '#B0A0A0',

  // Overlay
  overlayBackground: 'rgba(0, 0, 0, 0.5)',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: '#F0E8E8',

  // Board card - lifted from cream background
  boardBackground: '#FEFEFE',
  boardShadow: '#8B7070', // Warm brown for shadow

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
