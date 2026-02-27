import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';

interface ScreenTitleProps {
  children: string;
  style?: TextStyle;
}

export function ScreenTitle({ children, style }: ScreenTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
