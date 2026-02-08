// Techniques list screen - Browse and select techniques to learn
// Grouped by technique type: Singles, Intersections, Subsets, Fish, etc.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import {
  getTechniquesGroupedByType,
  TechniqueMetadata,
  TechniqueType,
  CATEGORY_COLORS,
  TECHNIQUE_METADATA,
} from '../../src/data/techniqueMetadata';
import {
  useTechniqueProgressStore,
  useTechniqueProgress,
  useCompletionCount,
  COMPLETION_THRESHOLD,
} from '../../src/stores/techniqueProgressStore';
import { triggerHaptic, ImpactFeedbackStyle } from '../../src/utils/haptics';

// ============================================
// Technique Card Component
// ============================================

function TechniqueCard({
  technique,
  index,
  onPress,
}: {
  technique: TechniqueMetadata;
  index: number;
  onPress: () => void;
}) {
  const progress = useTechniqueProgress(technique.id);
  const difficultyColor = CATEGORY_COLORS[technique.category];

  // For techniques without a solver, show "Coming Soon" instead of progress
  if (!technique.hasSolver) {
    return (
      <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(300)}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          accessibilityLabel={`${technique.name}, ${technique.category}, Coming soon`}
          accessibilityRole="button"
        >
          <View style={styles.cardContent}>
            {/* Left: Name and difficulty badge */}
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{technique.name}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}18` }]}>
                <Text style={[styles.difficultyBadgeText, { color: difficultyColor }]}>
                  {technique.category}
                </Text>
              </View>
            </View>

            {/* Right: Coming Soon pill and chevron */}
            <View style={styles.cardRight}>
              <View style={styles.comingSoonPill}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textLight} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const statusIcon = progress.isCompleted
    ? 'check-circle'
    : progress.demoCompleted
      ? 'play-circle'
      : 'circle';

  const statusColor = progress.isCompleted
    ? '#4CAF50'
    : progress.demoCompleted
      ? colors.softOrange
      : colors.textLight;

  const progressText = progress.isCompleted
    ? 'Mastered'
    : progress.demoCompleted
      ? `${progress.findSuccesses}/${COMPLETION_THRESHOLD} found`
      : 'Not started';

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        accessibilityLabel={`${technique.name}, ${technique.category}, ${progressText}`}
        accessibilityRole="button"
      >
        <View style={styles.cardContent}>
          {/* Left: Name and difficulty badge */}
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{technique.name}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}18` }]}>
              <Text style={[styles.difficultyBadgeText, { color: difficultyColor }]}>
                {technique.category}
              </Text>
            </View>
          </View>

          {/* Right: Status and chevron */}
          <View style={styles.cardRight}>
            <Feather name={statusIcon as any} size={16} color={statusColor} />
            <Feather name="chevron-right" size={18} color={colors.textLight} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================
// Type Section Component
// ============================================

function TypeSection({
  type,
  color,
  techniques,
  sectionIndex,
  onSelectTechnique,
}: {
  type: TechniqueType;
  color: string;
  techniques: TechniqueMetadata[];
  sectionIndex: number;
  onSelectTechnique: (id: string) => void;
}) {
  const isEmpty = techniques.length === 0;

  return (
    <Animated.View
      entering={FadeIn.delay(sectionIndex * 60).duration(300)}
      style={styles.section}
    >
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{type}</Text>
      </View>

      {/* Technique cards or empty state */}
      {isEmpty ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>coming soon</Text>
        </View>
      ) : (
        <View style={styles.sectionCards}>
          {techniques.map((technique, index) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              index={sectionIndex * 4 + index}
              onPress={() => onSelectTechnique(technique.id)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ============================================
// Main Screen
// ============================================

export default function TechniquesListScreen() {
  const router = useRouter();
  const loadState = useTechniqueProgressStore((s) => s.loadState);
  const completionCount = useCompletionCount();
  const groups = getTechniquesGroupedByType();
  const totalTechniques = TECHNIQUE_METADATA.filter((t) => t.hasSolver).length;

  // Load progress on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleSelectTechnique = (techniqueId: string) => {
    triggerHaptic(ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/techniques/[id]',
      params: { id: techniqueId },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>techniques</Text>
          <Text style={styles.headerSubtitle}>
            {completionCount}/{totalTechniques} mastered
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Technique list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, sectionIndex) => (
          <TypeSection
            key={group.type}
            type={group.type}
            color={group.color}
            techniques={group.techniques}
            sectionIndex={sectionIndex}
            onSelectTechnique={handleSelectTechnique}
          />
        ))}

        {/* Bottom spacing for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
  },
  headerTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  sectionCards: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 14,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontFamily: 'OpenRunde-Medium',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comingSoonPill: {
    backgroundColor: `${colors.textLight}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: 'OpenRunde-Medium',
    color: colors.textLight,
  },
  emptySection: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptySectionText: {
    fontSize: 12,
    fontFamily: 'OpenRunde-Medium',
    color: colors.textLight,
    fontStyle: 'italic',
  },
});
