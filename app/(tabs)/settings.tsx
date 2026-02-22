// Settings screen with grouped sections
// Includes game preferences, learn, premium, support, and footer

import React, { useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';

import { colors, useColors } from '../../src/theme/colors';
import { PALETTES, THEME_NAMES, type ThemeName } from '../../src/theme/palettes';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsLinkRow,
} from '../../src/components/settings';
import {
  useSettingsStore,
  useSoundsEnabled,
  useHapticsEnabled,
  useTimerEnabled,
  useUnlimitedMistakes,
  useUnlimitedHints,
  useColorTheme,
} from '../../src/stores/settingsStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useDailyChallengeStore } from '../../src/stores/dailyChallengeStore';
import {
  trackProgressReset,
  trackExternalLinkOpened,
  trackPaywallOpened,
} from '../../src/utils/analytics';
import { useIsPremium } from '../../src/stores/premiumStore';
import {
  presentPaywall,
  presentPaywallAlways,
  presentCustomerCenter,
  restorePurchases,
} from '../../src/lib/revenueCat';

// External URLs
const RULES_URL = 'https://sudoku.com/how-to-play/sudoku-rules-for-complete-beginners/';
const PRIVACY_URL = 'https://example.com/privacy'; // TODO: Replace with actual privacy URL

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();

  // Settings state
  const soundsEnabled = useSoundsEnabled();
  const hapticsEnabled = useHapticsEnabled();
  const timerEnabled = useTimerEnabled();
  const unlimitedMistakes = useUnlimitedMistakes();
  const unlimitedHints = useUnlimitedHints();
  const colorTheme = useColorTheme();

  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setTimerEnabled = useSettingsStore((s) => s.setTimerEnabled);
  const setUnlimitedMistakes = useSettingsStore((s) => s.setUnlimitedMistakes);
  const setUnlimitedHints = useSettingsStore((s) => s.setUnlimitedHints);
  const setColorTheme = useSettingsStore((s) => s.setColorTheme);

  // Premium state
  const isPremium = useIsPremium();

  // Store reset actions
  const resetGame = useGameStore((s) => s.resetGame);
  const resetDailyChallenge = useDailyChallengeStore((s) => s.resetState);

  // App version
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    '1';

  // Handlers
  const handleHowToPlay = useCallback(() => {
    // TODO: Navigate to tutorial flow
    Alert.alert('coming soon', 'the tutorial will be available in a future update.');
  }, []);

  const handleRules = useCallback(async () => {
    try {
      trackExternalLinkOpened('rules');
      await Linking.openURL(RULES_URL);
    } catch (error) {
      Alert.alert('error', 'unable to open the link.');
    }
  }, []);

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
        setter(true);
      }
    },
    [isPremium],
  );

  const handleUpgradePremium = useCallback(async () => {
    trackPaywallOpened('settings');
    await presentPaywallAlways();
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'restored!' : 'nothing to restore',
      restored
        ? 'your premium access has been restored.'
        : 'no previous purchases found.',
    );
  }, []);

  const handleManageSubscription = useCallback(async () => {
    await presentCustomerCenter();
  }, []);

  const handleSendFeedback = useCallback(() => {
    router.push('/feedback');
  }, [router]);

  const handlePrivacy = useCallback(async () => {
    try {
      trackExternalLinkOpened('privacy');
      await Linking.openURL(PRIVACY_URL);
    } catch (error) {
      Alert.alert('error', 'unable to open the link.');
    }
  }, []);

  const handleAppInfo = useCallback(() => {
    router.push('/info');
  }, [router]);

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      'reset progress',
      'this will permanently delete all your game progress, stats, and streaks. this cannot be undone.',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'reset',
          style: 'destructive',
          onPress: () => {
            // Reset all stores except settings
            resetGame();
            resetDailyChallenge();
            // TODO: Reset tutorial state when tutorialStore exists
            trackProgressReset();
            Alert.alert('done', 'your progress has been reset.');
          },
        },
      ]
    );
  }, [resetGame, resetDailyChallenge]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>settings</Text>

        {/* Appearance - Theme Color Picker */}
        <SettingsSection title="appearance">
          <View style={styles.themePickerRow}>
            {THEME_NAMES.map((name) => {
              const isActive = name === colorTheme;
              const swatch = PALETTES[name].accent;
              return (
                <Pressable
                  key={name}
                  onPress={() => setColorTheme(name)}
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: swatch },
                    isActive && styles.themeSwatchActive,
                  ]}
                  accessibilityLabel={`${name} theme`}
                  accessibilityState={{ selected: isActive }}
                >
                  {isActive && (
                    <Feather name="check" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </SettingsSection>

        {/* Game Preferences */}
        <SettingsSection title="game">
          <SettingsToggleRow
            label="sounds"
            value={soundsEnabled}
            onValueChange={setSoundsEnabled}
            icon="volume-2"
            accessibilityHint="Toggle game sounds on or off"
          />
          <SettingsToggleRow
            label="haptics"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            icon="smartphone"
            accessibilityHint="Toggle haptic feedback on or off"
          />
          <SettingsToggleRow
            label="timer"
            value={timerEnabled}
            onValueChange={setTimerEnabled}
            icon="clock"
            accessibilityHint="Show or hide the game timer"
          />
          <SettingsToggleRow
            label="unlimited mistakes"
            value={unlimitedMistakes}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedMistakes)}
            icon="alert-circle"
            accessibilityHint="Toggle unlimited mistakes (premium feature)"
          />
          <SettingsToggleRow
            label="unlimited hints"
            value={unlimitedHints}
            onValueChange={(v) => handlePremiumToggle(v, setUnlimitedHints)}
            icon="zap"
            accessibilityHint="Toggle unlimited hints (premium feature)"
            isLast
          />
        </SettingsSection>

        {/* Learn */}
        <SettingsSection title="learn">
          <SettingsLinkRow
            label="how to play"
            onPress={handleHowToPlay}
            icon="help-circle"
            accessibilityHint="Open the tutorial"
          />
          <SettingsLinkRow
            label="sudoku rules"
            onPress={handleRules}
            icon="book"
            isExternal
            isLast
          />
        </SettingsSection>

        {/* Premium */}
        <SettingsSection title="premium">
          {!isPremium && (
            <SettingsLinkRow
              label="remove ads"
              onPress={handleUpgradePremium}
              icon="star"
              accessibilityHint="Upgrade to unlock all premium features"
            />
          )}
          <SettingsLinkRow
            label="restore purchases"
            onPress={handleRestorePurchases}
            icon="refresh-cw"
            accessibilityHint="Restore previously purchased premium access"
          />
          <SettingsLinkRow
            label="manage subscription"
            onPress={handleManageSubscription}
            icon="credit-card"
            accessibilityHint="Manage your subscription or request a refund"
            isLast
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="support">
          <SettingsLinkRow
            label="send feedback"
            onPress={handleSendFeedback}
            icon="message-circle"
            accessibilityHint="Send feedback to the developers"
          />
          <SettingsLinkRow
            label="privacy preferences"
            onPress={handlePrivacy}
            icon="shield"
            isExternal
          />
          <SettingsLinkRow
            label="app info"
            onPress={handleAppInfo}
            icon="info"
            accessibilityHint="View app information"
            isLast
          />
        </SettingsSection>

        {/* Reset Progress (standalone, not in a section) */}
        <View style={styles.resetContainer}>
          <SettingsLinkRow
            label="reset progress"
            onPress={handleResetProgress}
            icon="trash-2"
            isDestructive
            accessibilityHint="Delete all game progress and statistics"
            isLast
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    // Extra bottom padding to clear the floating SplitNavBar (~106px)
    paddingBottom: 120,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  resetContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  copyrightText: {
    ...typography.small,
    color: colors.textLight,
  },
  themePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  themeSwatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
