// Sudokitty color palette - matching iOS Theme.swift
// Soft pastel aesthetic for Gen Z female audience

export const colors = {
  // Primary colors
  cream: '#FFF0F6',
  softPink: '#FF6B9D',
  peach: '#FF70A0',
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
  cellBackgroundAlt: '#FFF7FB',
  cellSelected: '#FFD6E4',
  cellSelectedGlow: 'rgba(255, 107, 157, 0.25)',
  cellRelated: '#FFF2F8',
  cellHighlighted: '#FFEEF5',
  cellError: '#FFF0F0',
  cellGiven: '#FFF8FB',

  // Technique practice highlights (higher contrast than game highlights)
  techniqueHighlight: 'rgba(255, 107, 157, 0.35)',
  techniqueHighlightSecondary: 'rgba(255, 92, 80, 0.3)',

  // Glow effect
  glowColor: 'rgba(255, 107, 157, 0.4)',

  // Grid colors - softer, warmer
  gridLine: '#F0E8E4',
  gridLineBold: '#E8DCD8',
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
  tabBarActive: '#FF6B9D',
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
  boardShadow: '#8B7070',

  // Button
  buttonPrimary: '#FF6B9D',
  buttonSecondary: '#FFFFFF',
  buttonDisabled: '#E0D8D8',

  // 3D CTA Button colors
  ctaPrimaryFace: '#FF6B9D',
  ctaPrimaryEdge: '#E85A87',
  ctaPrimaryHighlight: '#FF90B8',
  ctaSecondaryFace: '#FFF0F8',
  ctaSecondaryEdge: '#E8D4DF',
  ctaSecondaryHighlight: '#FFF8FC',
  ctaSuccessFace: '#B8E6D0',
  ctaSuccessEdge: '#8FCDB5',
  ctaSuccessHighlight: '#D0F0E0',
  ctaDisabledFace: '#E8E0E0',
  ctaDisabledEdge: '#D0C8C8',
  ctaTextDark: '#4A3728',

  // NumberPad concave button colors
  numberPadBase: '#FFF0F8',
  numberPadPressed: '#F5E5ED',
  numberPadText: '#4A3728',
  numberPadActiveGlow: 'rgba(255, 107, 157, 0.3)',
  numberPadError: '#FFE5E5',

  // Gradients (as arrays for LinearGradient)
  backgroundGradient: ['#FFF0F8', '#FFE8F0', '#FFE0E8'] as const,
  buttonGradient: ['#FF6B9D', '#FF90B8'] as const,
  mochiGradient: ['#FFA0C4', '#FF6B9D'] as const,
} as const;

export type ColorName = keyof typeof colors;
