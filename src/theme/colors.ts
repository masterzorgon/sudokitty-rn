// Sudokitty color system
// Static neutrals + dynamic accent palette via useColors() hook

import { useMemo } from 'react';
import { useColorTheme } from '../stores/settingsStore';
import { PALETTES, type ColorPalette } from './palettes';

// Neutral colors that stay constant across all themes
export const colors = {
  // Accent colors (non-theme, always available)
  coral: '#FF5C50',
  mint: '#7CC9A8',
  butter: '#FFD84D',
  lavender: '#E8D5E8',

  // Text colors
  textPrimary: '#5D4E4E',
  textSecondary: '#8B7878',
  textLight: '#B0A0A0',

  // Cell colors (neutral)
  cellBackground: '#FFFFFF',
  cellError: '#FFF0F0',

  // Grid colors
  gridLine: '#F0E8E4',
  gridLineBold: '#E8DCD8',
  boxBorder: '#E0D4D0',

  // Note text
  noteText: '#8A7A72',

  // Error text
  errorText: '#E85A5A',

  // Given number text
  givenText: '#4A3C3C',

  // User entry text
  userEntryText: '#6B5858',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarInactive: '#B0A0A0',

  // Floating nav bar
  navInactive: '#9CA3AF',

  // Overlay
  overlayBackground: 'rgba(0, 0, 0, 0.5)',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: '#F0E8E8',

  // Board card
  boardBackground: '#FEFEFE',

  // Button (neutral variants)
  buttonSecondary: '#FFFFFF',
  buttonDisabled: '#E0D8D8',

  // CTA (neutral variants)
  ctaSuccessFace: '#B8E6D0',
  ctaSuccessEdge: '#8FCDB5',
  ctaSuccessHighlight: '#D0F0E0',
  ctaDisabledFace: '#E8E0E0',
  ctaDisabledEdge: '#D0C8C8',
  ctaTextDark: '#4A3728',

  // NumberPad (neutral)
  numberPadText: '#4A3728',
  numberPadError: '#FFE5E5',
} as const;

export type NeutralColors = typeof colors;
export type FullColors = NeutralColors & ColorPalette;

export function useColors(): FullColors {
  const theme = useColorTheme();
  return useMemo(() => ({ ...colors, ...PALETTES[theme] }), [theme]);
}

export type { ColorPalette, ThemeName } from './palettes';
