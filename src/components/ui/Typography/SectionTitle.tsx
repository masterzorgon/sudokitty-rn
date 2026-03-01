import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';

import { useColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme';

interface SectionTitleProps {
  children: string;
  variant?: 'default' | 'caption';
  style?: TextStyle;
}

export function SectionTitle({ children, variant = 'default', style }: SectionTitleProps) {
  const c = useColors();

  const variantStyle = variant === 'caption' ? captionStyle : defaultStyle;
  const variantColor = variant === 'caption' ? c.textSecondary : c.textPrimary;

  return (
    <Text style={[variantStyle, { color: variantColor }, style]}>
      {children}
    </Text>
  );
}

const defaultStyle: TextStyle = {
  ...typography.headline,
  marginTop: spacing.lg,
  marginBottom: spacing.md,
};

const captionStyle: TextStyle = {
  ...typography.caption,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: spacing.sm,
  marginLeft: spacing.xs,
};
