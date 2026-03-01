import { colors } from '../../theme/colors';
import type { CustomSkeuColors } from '../ui/Skeuomorphic';

export const BUTTON_HEIGHT = 56;
export const BUTTON_RADIUS = 12;
export const BUTTON_GAP = 4;

/** White 3D surface for inactive game control buttons. textColor varies per use case. */
export function makeWhiteSkeuColors(textColor: string): CustomSkeuColors {
  return {
    gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
    edge: '#E0E0E0',
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: 'rgba(0, 0, 0, 0.1)',
    textColor,
  };
}

export const whiteSkeuColorsSecondary = makeWhiteSkeuColors(colors.textSecondary);
export const whiteSkeuColorsPrimary = makeWhiteSkeuColors(colors.textPrimary);
