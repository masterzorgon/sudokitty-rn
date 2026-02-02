// LabeledSection - Reusable wrapper that adds a section label above children
// Uses composition pattern - doesn't modify child components

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { GAME_LAYOUT } from '../../constants/layout';

// MARK: - Types

interface LabeledSectionProps {
  /** The label text to display above the children */
  label: string;
  /** The content to wrap */
  children: React.ReactNode;
}

// MARK: - Component

export function LabeledSection({ label, children }: LabeledSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: GAME_LAYOUT.SECTION_LABEL_MARGIN_BOTTOM,
    marginLeft: 2, // Slight indent to align with button edges
  },
});
