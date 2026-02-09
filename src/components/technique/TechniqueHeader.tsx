import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import type { TechniqueMetadata } from '../../data/techniqueMetadata';

// ============================================
// Types
// ============================================

interface TechniqueHeaderProps {
  metadata: TechniqueMetadata;
  onBack: () => void;
}

// ============================================
// Component
// ============================================

export function TechniqueHeader({ metadata, onBack }: TechniqueHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Feather name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{metadata.name}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: `${metadata.color}20` }]}>
          <Text style={[styles.categoryBadgeText, { color: metadata.color }]}>
            {metadata.category}
          </Text>
        </View>
      </View>
      <View style={styles.backButton} />
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 18,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'OpenRunde-Medium',
  },
});
