// Daily Challenge CTA card with 3D press effect
// Full-width card showing calendar icon, difficulty, participant count

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { DailyChallenge, DIFFICULTY_CONFIG } from "../../engine/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { SkeuCard } from "../ui/Skeuomorphic";

interface DailyChallengeCTAProps {
  challenge: DailyChallenge;
  isCompleted: boolean;
  participantCount: number;
  onPress: () => void;
}

// Difficulty badge colors
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: colors.mint,
  medium: colors.butter,
  hard: colors.peach,
  expert: colors.coral,
};

// White custom colors for the card
const whiteColors = {
  gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  edge: '#E0E0E0',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  borderDark: 'rgba(0, 0, 0, 0.1)',
};

export const DailyChallengeCTA = memo(
  ({
    challenge,
    isCompleted,
    participantCount,
    onPress,
  }: DailyChallengeCTAProps) => {
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const difficultyColor =
      DIFFICULTY_COLORS[challenge.difficulty] || colors.softOrange;

    return (
      <SkeuCard
        onPress={onPress}
        variant="secondary"
        customColors={whiteColors}
        borderRadius={borderRadius.lg}
        showHighlight={false}
        style={styles.container}
        contentStyle={styles.face}
        accessibilityLabel={`Daily challenge, ${difficultyConfig.name} difficulty`}
      >
        {/* Left section - Icon and title */}
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <Feather name="calendar" size={20} color={colors.softOrange} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>daily challenge</Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: `${difficultyColor}40` },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: difficultyColor },
                  ]}
                >
                  {difficultyConfig.name}
                </Text>
              </View>
              <Text style={styles.participants}>
                {participantCount.toLocaleString()} playing today
              </Text>
            </View>
          </View>
        </View>

        {/* Right section - Status and chevron */}
        <View style={styles.rightContent}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Feather name="check" size={12} color={colors.mint} />
              <Text style={styles.completedText}>done!</Text>
            </View>
          )}
          <Feather
            name="chevron-right"
            size={24}
            color={colors.textLight}
          />
        </View>
      </SkeuCard>
    );
  }
);

DailyChallengeCTA.displayName = "DailyChallengeCTA";

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
    backgroundColor: "rgba(255, 157, 107, 0.15)",
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  participants: {
    fontSize: 12,
    color: colors.textLight,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(184, 230, 208, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  completedText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mint,
  },
  streakBadge: {
    position: "absolute",
    top: -12,
    right: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.softOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A3728",
  },
});
