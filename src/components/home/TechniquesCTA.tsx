// Sudoku Techniques CTA card with 3D press effect
// Full-width card inviting users to learn solving strategies

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, useColors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { SkeuCard } from "../ui/Skeuomorphic";

interface TechniquesCTAProps {
  onPress: () => void;
}

// White custom colors for the card
const whiteColors = {
  gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  edge: '#E0E0E0',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  borderDark: 'rgba(0, 0, 0, 0.1)',
};

export const TechniquesCTA = memo(({ onPress }: TechniquesCTAProps) => {
  const c = useColors();
  return (
    <SkeuCard
      onPress={onPress}
      variant="secondary"
      customColors={whiteColors}
      borderRadius={borderRadius.lg}
      showHighlight={false}
      style={styles.container}
      contentStyle={styles.face}
      accessibilityLabel="Sudoku techniques, learn advanced solving strategies"
    >
      {/* Left section - Icon and title */}
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: c.accent + '26' }]}>
          <Feather name="award" size={20} color={c.accent} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>sudoku techniques</Text>
          <Text style={styles.subtitle}>learn advanced solving strategies</Text>
        </View>
      </View>

      {/* Right section - Chevron */}
      <View style={styles.rightContent}>
        <Feather
          name="chevron-right"
          size={24}
          color={colors.textLight}
        />
      </View>
    </SkeuCard>
  );
});

TechniquesCTA.displayName = "TechniquesCTA";

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
