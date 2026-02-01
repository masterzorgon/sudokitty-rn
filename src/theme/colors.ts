// Sudokitty color palette - matching iOS Theme.swift
// Soft pastel aesthetic for Gen Z female audience

export const colors = {
  // Primary colors
  cream: '#FFF8F0',
  softOrange: '#FFB085',
  peach: '#FFA070',
  pink: '#FFD1DC',
  lavender: '#E8D5E8',

  // Accent colors
  coral: '#FF5C50',
  mint: '#7CC9A8',
  butter: '#FFD84D',

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
  noteText: '#8A7A72',

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

  // Floating nav bar
  navInactive: '#9CA3AF',

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

  // 3D CTA Button colors
  ctaPrimaryFace: '#FFB085',
  ctaPrimaryEdge: '#E8956A',
  ctaPrimaryHighlight: '#FFC4A0',
  ctaSecondaryFace: '#FFF8F0',
  ctaSecondaryEdge: '#E8DFD4',
  ctaSecondaryHighlight: '#FFFCF8',
  ctaSuccessFace: '#B8E6D0',
  ctaSuccessEdge: '#8FCDB5',
  ctaSuccessHighlight: '#D0F0E0',
  ctaDisabledFace: '#E8E0E0',
  ctaDisabledEdge: '#D0C8C8',
  ctaTextDark: '#4A3728',

  // NumberPad concave button colors
  numberPadBase: '#FFF8F0',
  numberPadPressed: '#F5EDE5',
  numberPadText: '#4A3728',
  numberPadActiveGlow: 'rgba(255, 176, 133, 0.3)',
  numberPadError: '#FFE5E5',

  // Gradients (as arrays for LinearGradient)
  backgroundGradient: ['#FFF8F0', '#FFF0E8', '#FFE8E0'] as const,
  buttonGradient: ['#FFB085', '#FFCAB0'] as const,
  mochiGradient: ['#FFD4B8', '#FFB085'] as const,
} as const;

export type ColorName = keyof typeof colors;
