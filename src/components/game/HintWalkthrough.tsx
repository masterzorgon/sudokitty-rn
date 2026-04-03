// Inline hint walkthrough panel — replaces controls; board shows step highlights.

import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useActiveHintSession, useGameStore } from "../../stores/gameStore";
import { useColors } from "../../theme/colors";
import { typography, fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { LEVEL_TO_CATEGORY, CATEGORY_COLORS } from "../../data/techniqueMetadata";
import type { TechniqueCategory } from "../../data/techniqueMetadata";
import { playFeedback } from "../../utils/feedback";

export const HintWalkthrough = memo(function HintWalkthrough() {
  const c = useColors();
  const session = useActiveHintSession();
  const nextHintStep = useGameStore((s) => s.nextHintStep);
  const prevHintStep = useGameStore((s) => s.prevHintStep);
  const applyActiveHint = useGameStore((s) => s.applyActiveHint);
  const cancelActiveHint = useGameStore((s) => s.cancelActiveHint);

  const step = session?.steps[session.stepIndex];
  const totalSteps = session?.steps.length ?? 0;
  const isLast = session != null && session.stepIndex >= totalSteps - 1;
  const isFirst = session == null || session.stepIndex <= 0;

  const category = session?.hint.level
    ? LEVEL_TO_CATEGORY[session.hint.level]
    : ("Beginner" as TechniqueCategory);
  const badgeColor = CATEGORY_COLORS[category];

  const dots = useMemo(() => {
    if (!session || totalSteps <= 0) return [];
    return Array.from({ length: totalSteps }, (_, i) => i);
  }, [session, totalSteps]);

  if (!session || !step) return null;

  return (
    <View style={[styles.container, { backgroundColor: c.cream }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            playFeedback("tap");
            cancelActiveHint();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel hint"
        >
          <Text style={[styles.cancelText, { color: c.accent }]}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { color: c.textPrimary }]}>{session.hint.techniqueName}</Text>

      <View style={[styles.badge, { backgroundColor: badgeColor + "22" }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{category}</Text>
      </View>

      <Text style={[styles.body, { color: c.textPrimary }]}>{step.text}</Text>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => {
            playFeedback("tap");
            prevHintStep();
          }}
          disabled={isFirst}
          style={[styles.iconBtn, isFirst && styles.iconBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous hint step"
        >
          <Ionicons name="chevron-back" size={28} color={isFirst ? c.textLight : c.accent} />
        </Pressable>

        <View style={styles.dots}>
          {dots.map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === session.stepIndex ? c.accent : c.textLight + "80" },
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <Pressable
            onPress={() => {
              playFeedback("tap");
              applyActiveHint();
            }}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="Apply hint"
          >
            <Text style={[styles.doneText, { color: c.accent }]}>Done</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              playFeedback("tap");
              nextHintStep();
            }}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Next hint step"
          >
            <Ionicons name="chevron-forward" size={28} color={c.accent} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.xs,
  },
  cancelText: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
  },
  title: {
    ...typography.title,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  badge: {
    alignSelf: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnDisabled: {
    opacity: 0.35,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  doneBtn: {
    minWidth: 56,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  doneText: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
  },
});
