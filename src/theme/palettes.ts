// Color palettes for system theme switching
// Each palette defines the accent-varying colors; neutrals stay constant in colors.ts

export type ThemeName = 'pink' | 'orange' | 'green' | 'blue';

export interface ColorPalette {
  // Primary accent family
  accent: string;
  accentSecondary: string;
  accentLight: string;

  // Background tint
  cream: string;

  // Cell highlights
  cellSelected: string;
  cellSelectedGlow: string;
  cellRelated: string;
  cellHighlighted: string;
  cellGiven: string;
  cellBackgroundAlt: string;

  // Technique highlights
  techniqueHighlight: string;
  techniqueHighlightSecondary: string;
  glowColor: string;

  // Buttons / CTA
  buttonPrimary: string;
  tabBarActive: string;
  ctaPrimaryFace: string;
  ctaPrimaryEdge: string;
  ctaPrimaryHighlight: string;
  ctaSecondaryFace: string;
  ctaSecondaryEdge: string;
  ctaSecondaryHighlight: string;

  // NumberPad
  numberPadBase: string;
  numberPadPressed: string;
  numberPadActiveGlow: string;

  // Gradients
  backgroundGradient: readonly [string, string, string];
  buttonGradient: readonly [string, string];
  mochiGradient: readonly [string, string];

  // Showcase gradient (bottom-to-top: deep, mid, light — 4th color is cream)
  showcaseGradient: readonly [string, string, string];

  // Skeuomorphic primary variant
  skeuPrimaryGradient: readonly [string, string, string];
  skeuPrimaryEdge: string;
  skeuPrimaryBorderDark: string;
  skeuSecondaryGradient: readonly [string, string, string];
  skeuSecondaryEdge: string;

  // Skeuomorphic card edge (white-faced cards use a lighter edge than secondary)
  skeuCardEdge: string;

  // Home screen top gradient (luminous top -> mid -> light -> cream)
  homeGradient: readonly [string, string, string, string];
  homeGlowColor: string;

  // Mochi pill (skeuomorphic balance display)
  mochiPillBg: string;
  mochiPillBorder: string;
  mochiPillEdge: string;
  mochiPillText: string;
}

const pinkPalette: ColorPalette = {
  accent: '#FF6B9D',
  accentSecondary: '#FF70A0',
  accentLight: '#FFD1DC',

  cream: '#FFF0F6',

  cellSelected: '#FFD6E4',
  cellSelectedGlow: 'rgba(255, 107, 157, 0.25)',
  cellRelated: '#FFF2F8',
  cellHighlighted: '#FFEEF5',
  cellGiven: '#FFF8FB',
  cellBackgroundAlt: '#FFF7FB',

  techniqueHighlight: 'rgba(255, 107, 157, 0.35)',
  techniqueHighlightSecondary: 'rgba(255, 92, 80, 0.3)',
  glowColor: 'rgba(255, 107, 157, 0.4)',

  buttonPrimary: '#FF6B9D',
  tabBarActive: '#FF6B9D',
  ctaPrimaryFace: '#FF6B9D',
  ctaPrimaryEdge: '#E85A87',
  ctaPrimaryHighlight: '#FF90B8',
  ctaSecondaryFace: '#FFF0F8',
  ctaSecondaryEdge: '#E8D4DF',
  ctaSecondaryHighlight: '#FFF8FC',

  numberPadBase: '#FFF0F8',
  numberPadPressed: '#F5E5ED',
  numberPadActiveGlow: 'rgba(255, 107, 157, 0.3)',

  backgroundGradient: ['#FFF0F8', '#FFE8F0', '#FFE0E8'],
  buttonGradient: ['#FF6B9D', '#FF90B8'],
  mochiGradient: ['#FFA0C4', '#FF6B9D'],

  showcaseGradient: ['#FCA2BE', '#FFE4F2', '#FFF0F8'],

  skeuPrimaryGradient: ['#FF6B9D', '#FF558B', '#FF6093'],
  skeuPrimaryEdge: '#E85A87',
  skeuPrimaryBorderDark: 'rgba(232, 90, 135, 0.3)',
  skeuSecondaryGradient: ['#FFF7FB', '#FFF0F8', '#FFEBF5'],
  skeuSecondaryEdge: '#E8D4DF',

  skeuCardEdge: '#F4E4EC',

  homeGradient: ['#FFB0D0', '#FFD0E4', '#FFECF4', '#FFF0F6'],
  homeGlowColor: 'rgba(255, 107, 157, 0.35)',

  mochiPillBg: '#FFE8F0',
  mochiPillBorder: '#F0B8CC',
  mochiPillEdge: '#D8869E',
  mochiPillText: '#8C3055',
};

const orangePalette: ColorPalette = {
  accent: '#FF8C56',
  accentSecondary: '#FF9A6B',
  accentLight: '#FFD4B8',

  cream: '#FFF5EE',

  cellSelected: '#FFE0C8',
  cellSelectedGlow: 'rgba(255, 140, 86, 0.25)',
  cellRelated: '#FFF8F2',
  cellHighlighted: '#FFF3EB',
  cellGiven: '#FFFAF6',
  cellBackgroundAlt: '#FFF8F3',

  techniqueHighlight: 'rgba(255, 140, 86, 0.35)',
  techniqueHighlightSecondary: 'rgba(255, 92, 80, 0.3)',
  glowColor: 'rgba(255, 140, 86, 0.4)',

  buttonPrimary: '#FF8C56',
  tabBarActive: '#FF8C56',
  ctaPrimaryFace: '#FF8C56',
  ctaPrimaryEdge: '#E07040',
  ctaPrimaryHighlight: '#FFB088',
  ctaSecondaryFace: '#FFF5EE',
  ctaSecondaryEdge: '#E8D4C8',
  ctaSecondaryHighlight: '#FFFAF6',

  numberPadBase: '#FFF5EE',
  numberPadPressed: '#F5EADE',
  numberPadActiveGlow: 'rgba(255, 140, 86, 0.3)',

  backgroundGradient: ['#FFF5EE', '#FFEFE4', '#FFE8D8'],
  buttonGradient: ['#FF8C56', '#FFB088'],
  mochiGradient: ['#FFB088', '#FF8C56'],

  showcaseGradient: ['#F0A870', '#FFE0C8', '#FFF2EA'],

  skeuPrimaryGradient: ['#FF8C56', '#FF7840', '#FF844C'],
  skeuPrimaryEdge: '#E07040',
  skeuPrimaryBorderDark: 'rgba(224, 112, 64, 0.3)',
  skeuSecondaryGradient: ['#FFF8F3', '#FFF5EE', '#FFF0E8'],
  skeuSecondaryEdge: '#E8D4C8',

  skeuCardEdge: '#F4E4D8',

  homeGradient: ['#FFC8A0', '#FFDCC0', '#FFF0E4', '#FFF5EE'],
  homeGlowColor: 'rgba(255, 140, 86, 0.35)',

  mochiPillBg: '#FFEDDB',
  mochiPillBorder: '#F0C4A0',
  mochiPillEdge: '#D89868',
  mochiPillText: '#8C4E20',
};

const greenPalette: ColorPalette = {
  accent: '#5CB85C',
  accentSecondary: '#66C266',
  accentLight: '#C8E6C9',

  cream: '#F2FBF2',

  cellSelected: '#D4EDDA',
  cellSelectedGlow: 'rgba(92, 184, 92, 0.25)',
  cellRelated: '#F0FAF0',
  cellHighlighted: '#E8F5E9',
  cellGiven: '#F8FCF8',
  cellBackgroundAlt: '#F5FAF5',

  techniqueHighlight: 'rgba(92, 184, 92, 0.35)',
  techniqueHighlightSecondary: 'rgba(76, 175, 80, 0.3)',
  glowColor: 'rgba(92, 184, 92, 0.4)',

  buttonPrimary: '#5CB85C',
  tabBarActive: '#5CB85C',
  ctaPrimaryFace: '#5CB85C',
  ctaPrimaryEdge: '#489848',
  ctaPrimaryHighlight: '#81C784',
  ctaSecondaryFace: '#F2FBF2',
  ctaSecondaryEdge: '#C8DCC8',
  ctaSecondaryHighlight: '#F8FCF8',

  numberPadBase: '#F2FBF2',
  numberPadPressed: '#E4F0E4',
  numberPadActiveGlow: 'rgba(92, 184, 92, 0.3)',

  backgroundGradient: ['#F2FBF2', '#E8F5E8', '#E0F0E0'],
  buttonGradient: ['#5CB85C', '#81C784'],
  mochiGradient: ['#81C784', '#5CB85C'],

  showcaseGradient: ['#7CC47C', '#C8E6C9', '#E8F5E9'],

  skeuPrimaryGradient: ['#5CB85C', '#4CA84C', '#54B054'],
  skeuPrimaryEdge: '#489848',
  skeuPrimaryBorderDark: 'rgba(72, 152, 72, 0.3)',
  skeuSecondaryGradient: ['#F5FAF5', '#F2FBF2', '#EDF8ED'],
  skeuSecondaryEdge: '#C8DCC8',

  skeuCardEdge: '#D4ECD8',

  homeGradient: ['#A0D8A0', '#C0E8C0', '#E0F4E0', '#F2FBF2'],
  homeGlowColor: 'rgba(92, 184, 92, 0.35)',

  mochiPillBg: '#DEF0DE',
  mochiPillBorder: '#A8D4A8',
  mochiPillEdge: '#78AC78',
  mochiPillText: '#2E5C2E',
};

const bluePalette: ColorPalette = {
  accent: '#5B9BD5',
  accentSecondary: '#64A3DB',
  accentLight: '#B8D4F0',

  cream: '#F0F6FF',

  cellSelected: '#D0E4F8',
  cellSelectedGlow: 'rgba(91, 155, 213, 0.25)',
  cellRelated: '#F0F6FF',
  cellHighlighted: '#E8F0FA',
  cellGiven: '#F8FAFF',
  cellBackgroundAlt: '#F5F8FE',

  techniqueHighlight: 'rgba(91, 155, 213, 0.35)',
  techniqueHighlightSecondary: 'rgba(66, 133, 244, 0.3)',
  glowColor: 'rgba(91, 155, 213, 0.4)',

  buttonPrimary: '#5B9BD5',
  tabBarActive: '#5B9BD5',
  ctaPrimaryFace: '#5B9BD5',
  ctaPrimaryEdge: '#4882B8',
  ctaPrimaryHighlight: '#85B8E4',
  ctaSecondaryFace: '#F0F6FF',
  ctaSecondaryEdge: '#C8D4E8',
  ctaSecondaryHighlight: '#F8FAFF',

  numberPadBase: '#F0F6FF',
  numberPadPressed: '#E2ECF8',
  numberPadActiveGlow: 'rgba(91, 155, 213, 0.3)',

  backgroundGradient: ['#F0F6FF', '#E8F0FA', '#E0E8F5'],
  buttonGradient: ['#5B9BD5', '#85B8E4'],
  mochiGradient: ['#85B8E4', '#5B9BD5'],

  showcaseGradient: ['#7AAED0', '#B8D4F0', '#E0ECF8'],

  skeuPrimaryGradient: ['#5B9BD5', '#4A8BC5', '#5293CD'],
  skeuPrimaryEdge: '#4882B8',
  skeuPrimaryBorderDark: 'rgba(72, 130, 184, 0.3)',
  skeuSecondaryGradient: ['#F5F8FE', '#F0F6FF', '#EBF2FC'],
  skeuSecondaryEdge: '#C8D4E8',

  skeuCardEdge: '#D4E4F4',

  homeGradient: ['#C0D8F0', '#D8E8F8', '#ECF2FC', '#F0F6FF'],
  homeGlowColor: 'rgba(91, 155, 213, 0.15)',

  mochiPillBg: '#DCEAF8',
  mochiPillBorder: '#A0C4E0',
  mochiPillEdge: '#6894B8',
  mochiPillText: '#264060',
};

export const PALETTES: Record<ThemeName, ColorPalette> = {
  pink: pinkPalette,
  orange: orangePalette,
  green: greenPalette,
  blue: bluePalette,
};

export const THEME_NAMES: ThemeName[] = ['pink', 'orange', 'green', 'blue'];
