// AppButton — App-standard button wrapping SkeuButton with consistent defaults.
// Matches the PrimaryActionPill styling (borderRadius=24, no highlight, no sheen,
// fontSize=20, fontWeight=600) so every screen gets the same button look.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { SkeuButton } from './Skeuomorphic/SkeuButton';
import { colors } from '../../theme/colors';
import type { SkeuVariant } from '../../theme/skeuomorphic';

// ============================================
// Types
// ============================================

export interface AppButtonProps {
  /** Press handler */
  onPress: () => void;
  /** Button label text */
  label: string;
  /** Color variant (default: 'primary') */
  variant?: 'primary' | 'secondary' | 'neutral';
  /** Optional Feather icon name */
  icon?: string;
  /** Icon placement relative to label (default: 'right') */
  iconPosition?: 'left' | 'right';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

// ============================================
// Constants (match PrimaryActionPill)
// ============================================

const BORDER_RADIUS = 24;
const CONTENT_STYLE = {
  paddingVertical: 14,
  paddingHorizontal: 24,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const TEXT_COLOR: Record<string, string> = {
  primary: '#FFFFFF',
  secondary: colors.textPrimary,
  neutral: colors.textPrimary,
};

const ICON_SIZE = 16;

// ============================================
// Component
// ============================================

export function AppButton({
  onPress,
  label,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  disabled = false,
  accessibilityLabel,
}: AppButtonProps) {
  const textColor = TEXT_COLOR[variant] ?? '#FFFFFF';

  return (
    <SkeuButton
      onPress={onPress}
      variant={variant as SkeuVariant}
      disabled={disabled}
      borderRadius={BORDER_RADIUS}
      showHighlight={false}
      sheen={false}
      contentStyle={CONTENT_STYLE}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.row}>
        {icon && iconPosition === 'left' && (
          <Feather name={icon as any} size={ICON_SIZE} color={textColor} />
        )}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        {icon && iconPosition === 'right' && (
          <Feather name={icon as any} size={ICON_SIZE} color={textColor} />
        )}
      </View>
    </SkeuButton>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
