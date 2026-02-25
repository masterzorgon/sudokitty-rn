// Sudoku Techniques CTA card with 3D press effect
// Full-width card inviting users to learn solving strategies

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { SkeuButton } from "../ui/Skeuomorphic";
import type { CustomSkeuColors } from "../ui/Skeuomorphic";

interface TechniquesCTAProps {
  onPress: () => void;
}

export const TechniquesCTA = memo(({ onPress }: TechniquesCTAProps) => {
  const c = useColors();

  const skeuColors: CustomSkeuColors = {
    gradient: [c.mochiPillBg, c.mochiPillBg, c.mochiPillBg] as readonly [string, string, string],
    edge: c.mochiPillEdge,
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: c.mochiPillBorder + '80',
    textColor: c.mochiPillText,
  };

  return (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={borderRadius.lg}
      showHighlight={false}
      style={styles.container}
      contentStyle={styles.face}
      accessibilityLabel="Sudoku techniques, learn advanced solving strategies"
    >
      {/* Left section - Icon and title */}
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: c.mochiPillBorder + '40' }]}>
          <Feather name="award" size={20} color={c.mochiPillText} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: c.mochiPillText }]}>sudoku techniques</Text>
          <Text style={[styles.subtitle, { color: c.mochiPillText }]}>learn advanced solving strategies</Text>
        </View>
      </View>

      {/* Right section - Chevron */}
      <View style={styles.rightContent}>
        <Feather
          name="chevron-right"
          size={24}
          color={c.mochiPillText}
        />
      </View>
    </SkeuButton>
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
  },
  subtitle: {
    fontSize: 12,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
