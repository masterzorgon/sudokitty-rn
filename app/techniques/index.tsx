import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { colors, useColors } from "../../src/theme/colors";
import { typography } from "../../src/theme/typography";
import { spacing, borderRadius } from "../../src/theme";
import { BackButton } from "../../src/components/ui/BackButton";
import { StoreItemRow } from "../../src/components/ui/StoreItemRow";
import {
  getTechniquesGroupedByCategory,
  TechniqueMetadata,
  TechniqueCategory,
  CATEGORY_COLORS,
  TECHNIQUE_METADATA,
  isTechniqueLessonVisible,
  getTechniqueMetadata,
} from "../../src/data/techniqueMetadata";
import { useTechniqueProgress, useCompletionCount } from "../../src/stores/techniqueProgressStore";
import { playFeedback } from "../../src/utils/feedback";
import { trackPaywallOpened } from "../../src/utils/analytics";
import { useEffectivePremium, usePremiumStore } from "../../src/stores/premiumStore";
import { presentPaywall } from "../../src/lib/revenueCat";
import { CTABannerCarousel } from "../../src/components/ui/CTABannerCarousel";

function TechniqueCard({
  technique,
  index,
  isLocked,
  onPress,
}: {
  technique: TechniqueMetadata;
  index: number;
  isLocked: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const progress = useTechniqueProgress(technique.id);
  const difficultyColor = CATEGORY_COLORS[technique.category];

  const icon = (
    <View style={[styles.iconCircle, { backgroundColor: `${difficultyColor}18` }]}>
      <Ionicons name="book-outline" size={22} color={difficultyColor} />
    </View>
  );

  const subtitle = !technique.hasSolver ? "Coming soon" : technique.shortDescription;

  const trailing = !technique.hasSolver ? (
    <View style={styles.trailingRow}>
      <View style={[styles.comingSoonPill, { backgroundColor: `${c.textSecondary}18` }]}>
        <Text style={[styles.comingSoonText, { color: c.textSecondary }]}>Coming Soon</Text>
      </View>
      <Feather name="chevron-right" size={20} color={c.textSecondary} />
    </View>
  ) : (
    <View style={styles.trailingRow}>
      {!isLocked ? (
        <View style={styles.starsContainer}>
          {[1, 2, 3].map((starNum) => (
            <Ionicons
              key={starNum}
              name={starNum <= progress.findSuccesses ? "star" : "star-outline"}
              size={14}
              color={starNum <= progress.findSuccesses ? "#FFD700" : c.textSecondary}
            />
          ))}
        </View>
      ) : (
        <Feather name="lock" size={14} color={c.textSecondary} />
      )}
      <Feather name="chevron-right" size={20} color={c.textSecondary} />
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(300)}>
      <StoreItemRow
        icon={icon}
        title={technique.name}
        subtitle={subtitle}
        trailing={trailing}
        onPress={onPress}
      />
    </Animated.View>
  );
}

function CategorySection({
  category,
  color,
  techniques,
  sectionIndex,
  isPremium,
  onSelectTechnique,
}: {
  category: TechniqueCategory;
  color: string;
  techniques: TechniqueMetadata[];
  sectionIndex: number;
  isPremium: boolean;
  onSelectTechnique: (id: string) => void;
}) {
  const isEmpty = techniques.length === 0;

  return (
    <Animated.View entering={FadeIn.delay(sectionIndex * 60).duration(300)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category}</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Coming soon</Text>
        </View>
      ) : (
        <View style={styles.sectionCards}>
          {techniques.map((technique, index) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              index={sectionIndex * 4 + index}
              isLocked={!isPremium && technique.level >= 2}
              onPress={() => onSelectTechnique(technique.id)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default function TechniquesListScreen() {
  const c = useColors();
  const router = useRouter();
  const completionCount = useCompletionCount();
  const groups = getTechniquesGroupedByCategory();
  const totalTechniques = TECHNIQUE_METADATA.filter(
    (t) => t.hasSolver && isTechniqueLessonVisible(t),
  ).length;
  const isPremium = useEffectivePremium();

  const handleSelectTechnique = async (techniqueId: string) => {
    const meta = getTechniqueMetadata(techniqueId);
    if (!isPremium && meta && meta.level >= 2) {
      playFeedback("tap");
      trackPaywallOpened("technique_card");
      const purchased = await presentPaywall();
      if (purchased) {
        usePremiumStore.getState().setPremium(true);
      }
      return;
    }
    playFeedback("tap");
    router.push({
      pathname: "/techniques/[id]",
      params: { id: techniqueId },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={["top"]}>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Techniques</Text>
          <Text style={styles.headerSubtitle}>
            {completionCount}/{totalTechniques} mastered
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CTABannerCarousel promos={["techniques"]} />

        {groups.map((group, sectionIndex) => (
          <CategorySection
            key={group.category}
            category={group.category}
            color={group.color}
            techniques={group.techniques}
            sectionIndex={sectionIndex}
            isPremium={isPremium}
            onSelectTechnique={handleSelectTechnique}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  trailingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  comingSoonPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  comingSoonText: {
    fontSize: 13,
    fontFamily: "Pally-Regular",
  },
  emptySection: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptySectionText: {
    fontSize: 12,
    fontFamily: "Pally-Medium",
    color: colors.textLight,
    fontStyle: "italic",
  },
});
