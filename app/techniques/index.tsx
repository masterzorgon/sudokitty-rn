// Techniques list screen - Browse and select techniques to learn
// Grouped by difficulty: Beginner, Intermediate, Advanced, Expert

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
  getTechniquesGroupedByCategory,
  TechniqueMetadata,
  TechniqueCategory,
  CATEGORY_COLORS,
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
          {/* Left: Icon */}
          <View style={[styles.cardIcon, { backgroundColor: `${technique.color}15` }]}>
            <Feather
              name={technique.icon as any}
              size={18}
              color={technique.color}
            />
          </View>

          {/* Center: Name and description */}
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{technique.name}</Text>
            <Text style={styles.cardDescription} numberOfLines={1}>
              {technique.shortDescription}
            </Text>
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
// Category Section Component
// ============================================

function CategorySection({
  category,
  color,
  techniques,
  sectionIndex,
  onSelectTechnique,
}: {
  category: TechniqueCategory;
  color: string;
  techniques: TechniqueMetadata[];
  sectionIndex: number;
  onSelectTechnique: (id: string) => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(sectionIndex * 100).duration(300)}
      style={styles.section}
    >
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{category.toLowerCase()}</Text>
        <Text style={styles.sectionCount}>{techniques.length} techniques</Text>
      </View>

      {/* Technique cards */}
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
  const groups = getTechniquesGroupedByCategory();
  const totalTechniques = groups.reduce((sum, g) => sum + g.techniques.length, 0);

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
          <CategorySection
            key={group.category}
            category={group.category}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textLight,
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
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 14,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
