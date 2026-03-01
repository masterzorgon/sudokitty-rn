import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';

import { useColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme';

interface ScreenTitleProps {
  children: string;
  style?: TextStyle;
}

export function ScreenTitle({ children, style }: ScreenTitleProps) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.textPrimary }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...typography.largeTitle,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
