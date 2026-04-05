import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, Linking, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "../../src/theme/colors";
import { PALETTES, THEME_NAMES } from "../../src/theme/palettes";
import { spacing, borderRadius } from "../../src/theme";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsLinkRow,
  AudioSettingsSection,
} from "../../src/components/settings";
import { ScreenBackground, ScreenContent, ScreenHeader } from "../../src/components/ui/Layout";
import { SkeuCard } from "../../src/components/ui/Skeuomorphic";
import { CTABannerCarousel } from "../../src/components/ui/CTABannerCarousel";
import { StatsCTA } from "../../src/components/home";
import { playFeedback } from "../../src/utils/feedback";
import {
  useSettingsStore,
  useUnlimitedMistakes,
  useUnlimitedHints,
  useColorTheme,
} from "../../src/stores/settingsStore";
import { useGameStore } from "../../src/stores/gameStore";
import { usePlayerStreakStore } from "../../src/stores/playerStreakStore";
import { useUserStatsStore } from "../../src/stores/userStatsStore";
import {
  trackProgressReset,
  trackExternalLinkOpened,
  trackPaywallOpened,
} from "../../src/utils/analytics";
import { useEffectivePremium, usePremiumStore } from "../../src/stores/premiumStore";
import {
  presentPaywall,
  presentPaywallAlways,
  presentCustomerCenter,
  restorePurchases,
} from "../../src/lib/revenueCat";

const RULES_URL = "https://sudokitty.com/rules";
const PRIVACY_URL = "https://sudokitty.com/privacy";
const TERMS_URL = "https://sudokitty.com/terms";

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const unlimitedMistakes = useUnlimitedMistakes();
  const unlimitedHints = useUnlimitedHints();
  const colorTheme = useColorTheme();

  const setUnlimitedMistakes = useSettingsStore((s) => s.setUnlimitedMistakes);
  const setUnlimitedHints = useSettingsStore((s) => s.setUnlimitedHints);
  const setColorTheme = useSettingsStore((s) => s.setColorTheme);

  const isPremium = useEffectivePremium();

  const resetGame = useGameStore((s) => s.resetGame);
  const resetDailyChallenge = usePlayerStreakStore((s) => s.resetState);
  const resetStats = useUserStatsStore((s) => s.resetStats);

  const navigate = useCallback(
    async (dest: string | { url: string; trackKey: string }) => {
      if (typeof dest === "string") {
        router.push(dest as any);
      } else {
        try {
          trackExternalLinkOpened(dest.trackKey);
          await Linking.openURL(dest.url);
        } catch {
          Alert.alert("Error", "Unable to open the link.");
        }
      }
    },
    [router],
  );

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

  const handleUpgradePremium = useCallback(async () => {
    trackPaywallOpened("settings");
    const purchased = await presentPaywallAlways();
    if (purchased) {
      usePremiumStore.getState().setPremium(true);
    }
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? "Restored!" : "Nothing to Restore",
      restored ? "Your premium access has been restored." : "No previous purchases found.",
    );
  }, []);

  const handleManageSubscription = useCallback(async () => {
    await presentCustomerCenter();
  }, []);

  const handleViewStats = useCallback(() => {
    playFeedback("tap");
    router.push("/(tabs)/stats");
  }, [router]);

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      "Reset Progress",
      "This will permanently delete all your game progress, stats, and streaks. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetGame();
            resetDailyChallenge();
            resetStats();
            trackProgressReset();
            Alert.alert("Done", "Your progress has been reset.");
          },
        },
      ],
    );
  }, [resetGame, resetDailyChallenge, resetStats]);

  const [headerHeight, setHeaderHeight] = useState(50);
  const contentStyle = useMemo(
    () => ({ ...styles.scrollContent, paddingTop: headerHeight }),
    [headerHeight],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.cream, paddingTop: insets.top }]}>
      <ScreenBackground />
      <ScreenContent contentStyle={contentStyle} style={{ marginTop: 20 }}>
        <CTABannerCarousel promos={["rate"]} />

        <View style={styles.statsCTAContainer}>
          <StatsCTA onPress={handleViewStats} />
        </View>

        <SettingsSection title="Appearance">
          <View style={styles.themePickerRow}>
            {THEME_NAMES.map((name) => {
              const isActive = name === colorTheme;
              const swatch = PALETTES[name].accent;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    playFeedback("tap");
                    setColorTheme(name);
                  }}
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: swatch },
                    isActive && styles.themeSwatchActive,
                  ]}
                  accessibilityLabel={`${name} theme`}
                  accessibilityState={{ selected: isActive }}
                >
                  {isActive && <Feather name="check" size={20} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </SettingsSection>

        <SettingsSection title="Game">
          <AudioSettingsSection
            showTimer
            showTrackSelector={false}
            surface="screen"
            isLastSection={false}
          />
          <SettingsToggleRow
            label="Unlimited mistakes"
            value={unlimitedMistakes}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedMistakes)}
            icon="alert-circle"
            accessibilityHint="Toggle unlimited mistakes (premium feature)"
          />
          <SettingsToggleRow
            label="Unlimited hints"
            value={unlimitedHints}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedHints)}
            icon="zap"
            accessibilityHint="Toggle unlimited hints (premium feature)"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Learn">
          <SettingsLinkRow
            label="How to play"
            onPress={() => navigate("/tutorial")}
            icon="help-circle"
            accessibilityHint="Open the interactive tutorial"
          />
          <SettingsLinkRow
            label="Advanced techniques"
            onPress={() => navigate("/techniques")}
            icon="award"
          />
          <SettingsLinkRow
            label="Sudoku rules"
            onPress={() => navigate({ url: RULES_URL, trackKey: "rules" })}
            icon="book"
            isExternal
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Premium">
          {!isPremium && (
            <SettingsLinkRow
              label="Remove ads"
              onPress={handleUpgradePremium}
              icon="star"
              accessibilityHint="Upgrade to unlock all premium features"
            />
          )}
          <SettingsLinkRow
            label="Restore purchases"
            onPress={handleRestorePurchases}
            icon="refresh-cw"
            accessibilityHint="Restore previously purchased premium access"
          />
          <SettingsLinkRow
            label="Manage subscription"
            onPress={handleManageSubscription}
            icon="credit-card"
            accessibilityHint="Manage your subscription or request a refund"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsLinkRow
            label="Send feedback"
            onPress={() => navigate("/feedback")}
            icon="message-circle"
            accessibilityHint="Send feedback to the developers"
          />
          <SettingsLinkRow
            label="Privacy preferences"
            onPress={() => navigate({ url: PRIVACY_URL, trackKey: "privacy" })}
            icon="shield"
            isExternal
          />
          <SettingsLinkRow
            label="Terms"
            onPress={() => navigate({ url: TERMS_URL, trackKey: "terms" })}
            icon="file-text"
            isExternal
          />
          <SettingsLinkRow
            label="App info"
            onPress={() => navigate("/info")}
            icon="info"
            accessibilityHint="View app information"
            isLast
          />
        </SettingsSection>

        <SkeuCard borderRadius={borderRadius.lg} style={styles.resetContainer}>
          <SettingsLinkRow
            label="Reset progress"
            onPress={handleResetProgress}
            icon="trash-2"
            isDestructive
            accessibilityHint="Delete all game progress and statistics"
            isLast
          />
        </SkeuCard>
      </ScreenContent>
      <ScreenHeader onHeightChange={setHeaderHeight} />
    </View>
  );
}

const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  statsCTAContainer: {
    marginBottom: spacing.xl,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 120,
  },
  resetContainer: {
    marginBottom: spacing.xl,
  },
  themePickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  themeSwatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeSwatchActive: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});
