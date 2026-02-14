import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { AppButton } from '../ui/AppButton';
import type { TechniqueMetadata } from '../../data/techniqueMetadata';

// ============================================
// Types
// ============================================

interface TechniqueIntroProps {
  metadata: TechniqueMetadata;
  comingSoon: boolean;
  onStart: () => void;
  onBack: () => void;
}

// ============================================
// Component
// ============================================

export function TechniqueIntro({ metadata, comingSoon, onStart, onBack }: TechniqueIntroProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.introContent}>
      <View style={styles.introCard}>
        <View style={[styles.introIcon, { backgroundColor: `${metadata.color}15` }]}>
          <Feather name={metadata.icon as any} size={32} color={metadata.color} />
        </View>
        <Text style={styles.introTitle}>{metadata.name}</Text>

        {comingSoon && (
          <View style={[styles.categoryBadge, { backgroundColor: `${metadata.color}20`, alignSelf: 'center' }]}>
            <Text style={[styles.categoryBadgeText, { color: metadata.color }]}>
              {metadata.category}
            </Text>
          </View>
        )}

        <Text style={styles.introDescription}>{metadata.longDescription}</Text>

        {comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Feather name="clock" size={14} color={colors.textLight} />
            <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomActions}>
        {comingSoon ? (
          <AppButton onPress={onBack} label="back to techniques" variant="neutral" icon="arrow-left" iconPosition="left" />
        ) : (
          <AppButton onPress={onStart} label="start demo" icon="play" />
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  introContent: {
    flex: 1,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.medium,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    fontSize: 22,
  },
  introDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'Pally-Medium',
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.textLight}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    fontFamily: 'Pally-Medium',
    color: colors.textLight,
  },
  bottomActions: {
    // No extra padding — parent introContent already has paddingHorizontal
  },
});
