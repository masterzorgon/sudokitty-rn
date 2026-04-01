import React, { useCallback, useRef } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  useSettingsStore,
  useUnlimitedMistakes,
  useUnlimitedHints,
} from "../../stores/settingsStore";
import { useGameStore } from "../../stores/gameStore";
import { useEffectivePremium, usePremiumStore } from "../../stores/premiumStore";
import { presentPaywall } from "../../lib/revenueCat";
import { MAX_MISTAKES, MAX_HINTS } from "../../engine/types";
import { colors, useColors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { SkeuCard } from "../ui/Skeuomorphic";
import { AppButton } from "../ui/AppButton";
import { SheetWrapper, type SheetWrapperRef } from "../ui/Sheet/SheetWrapper";
import { SettingsToggleRow } from "../settings/SettingsToggleRow";
import { AudioSettingsSection } from "../settings/AudioSettingsSection";
import { MusicTrackSelector } from "../ui/MusicTrackSelector";
import { formatTime } from "../../utils/formatTime";

// MARK: - Types

interface GameSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

// MARK: - Constants

// MARK: - StatPill Component

function StatPill({ icon, value, cream }: { icon: string; value: string; cream: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: cream }]}>
      <Ionicons name={icon as any} size={14} color={colors.textSecondary} />
      <Text style={styles.statPillText}>{value}</Text>
    </View>
  );
}

// MARK: - GameSettingsModal Component

export function GameSettingsModal({ visible, onClose }: GameSettingsModalProps) {
  const c = useColors();
  const isPremium = useEffectivePremium();

  const unlimitedMistakes = useUnlimitedMistakes();
  const unlimitedHints = useUnlimitedHints();

  const setUnlimitedMistakes = useSettingsStore((s) => s.setUnlimitedMistakes);
  const setUnlimitedHints = useSettingsStore((s) => s.setUnlimitedHints);

  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const difficulty = useGameStore((s) => s.difficulty);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const paidHintsRemaining = useGameStore((s) => s.paidHintsRemaining);

  const handlePremiumToggle = useCallback(
    async (enabled: boolean, setter: (v: boolean) => void) => {
      if (!enabled) {
        setter(false);
        return;
      }
      if (isPremium) {
        setter(true);
        return;
      }
      const purchased = await presentPaywall();
      if (purchased) {
        usePremiumStore.getState().setPremium(true);
        setter(true);
      }
    },
    [isPremium],
  );

  const sheetRef = useRef<SheetWrapperRef>(null);

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  // Derived stats
  const livesRemaining = unlimitedMistakes ? "\u221E" : String(MAX_MISTAKES - mistakeCount);
  const hintsRemaining = unlimitedHints
    ? "\u221E"
    : String(Math.max(MAX_HINTS - hintsUsed, 0) + paidHintsRemaining);

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onClose}
      blurBackground={false}
      containerStyle={{ backgroundColor: c.cream, maxHeight: "85%" }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Game Stats Pills */}
        <View style={styles.statsRow}>
          <StatPill icon="timer-outline" value={formatTime(timeElapsed)} cream={c.cream} />
          <StatPill icon="skull-outline" value={difficulty} cream={c.cream} />
          <StatPill icon="heart" value={livesRemaining} cream={c.cream} />
          <StatPill icon="bulb" value={hintsRemaining} cream={c.cream} />
        </View>

        {/* Section 2: Music Track Carousel (above toggle card, always visible) */}
        <MusicTrackSelector />

        {/* Section 3: Audio + Timer + Haptics */}
        <View style={styles.audioSection}>
          <AudioSettingsSection showTimer showTrackSelector surface="modal" />
        </View>

        {/* Section 4: Premium toggles */}
        <SkeuCard borderRadius={borderRadius.lg} contentStyle={styles.premiumCardContent}>
          <SettingsToggleRow
            label="Unlimited mistakes"
            description="No penalty for wrong answers"
            value={unlimitedMistakes}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedMistakes)}
          />
          <SettingsToggleRow
            label="Unlimited hints"
            description="No limit on hints per game"
            value={unlimitedHints}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedHints)}
            isLast
          />
        </SkeuCard>
      </ScrollView>

      {/* Section 5: Close Button */}
      <View style={styles.closeButtonWrapper}>
        <AppButton onPress={handleClose} label="Resume Game" variant="primary" />
      </View>
    </SheetWrapper>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.md,
  },

  // Stats pills
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statPillText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Audio section
  audioSection: {
    marginBottom: spacing.md,
  },
  premiumCardContent: {
    padding: 0,
    overflow: "visible",
  },

  // Close button
  closeButtonWrapper: {
    marginTop: spacing.sm,
  },
});
