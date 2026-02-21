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
  useMistakeLimitEnabled,
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
  const mistakeLimitEnabled = useMistakeLimitEnabled();
  const colorTheme = useColorTheme();

  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setTimerEnabled = useSettingsStore((s) => s.setTimerEnabled);
  const setMistakeLimitEnabled = useSettingsStore((s) => s.setMistakeLimitEnabled);
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
    Alert.alert('Coming Soon', 'The tutorial will be available in a future update.');
  }, []);

  const handleRules = useCallback(async () => {
    try {
      trackExternalLinkOpened('rules');
      await Linking.openURL(RULES_URL);
    } catch (error) {
      Alert.alert('Error', 'Unable to open the link.');
    }
  }, []);

  const handleUpgradePremium = useCallback(async () => {
    trackPaywallOpened('settings');
    await presentPaywallAlways();
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'Restored!' : 'Nothing to Restore',
      restored
        ? 'Your premium access has been restored.'
        : 'No previous purchases found.',
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
      Alert.alert('Error', 'Unable to open the link.');
    }
  }, []);

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      'Reset Progress',
      'This will permanently delete all your game progress, stats, and streaks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset all stores except settings
            resetGame();
            resetDailyChallenge();
            // TODO: Reset tutorial state when tutorialStore exists
            trackProgressReset();
            Alert.alert('Done', 'Your progress has been reset.');
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
        <Text style={styles.title}>Settings</Text>

        {/* Appearance - Theme Color Picker */}
        <SettingsSection title="Appearance">
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
        <SettingsSection title="Game">
          <SettingsToggleRow
            label="Sounds"
            value={soundsEnabled}
            onValueChange={setSoundsEnabled}
            icon="volume-2"
            accessibilityHint="Toggle game sounds on or off"
          />
          <SettingsToggleRow
            label="Haptics"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            icon="smartphone"
            accessibilityHint="Toggle haptic feedback on or off"
          />
          <SettingsToggleRow
            label="Timer"
            value={timerEnabled}
            onValueChange={setTimerEnabled}
            icon="clock"
            accessibilityHint="Show or hide the game timer"
          />
          <SettingsToggleRow
            label="Mistake Limit"
            value={mistakeLimitEnabled}
            onValueChange={setMistakeLimitEnabled}
            icon="alert-circle"
            accessibilityHint="Enable or disable mistake tracking"
            isLast
          />
        </SettingsSection>

        {/* Learn */}
        <SettingsSection title="Learn">
          <SettingsLinkRow
            label="How to Play"
            onPress={handleHowToPlay}
            icon="help-circle"
            accessibilityHint="Open the tutorial"
          />
          <SettingsLinkRow
            label="Sudoku Rules"
            onPress={handleRules}
            icon="book"
            isExternal
            isLast
          />
        </SettingsSection>

        {/* Premium */}
        <SettingsSection title="Premium">
          {!isPremium && (
            <SettingsLinkRow
              label="Upgrade to Premium"
              onPress={handleUpgradePremium}
              icon="star"
              accessibilityHint="Upgrade to unlock all premium features"
            />
          )}
          <SettingsLinkRow
            label="Restore Purchases"
            onPress={handleRestorePurchases}
            icon="refresh-cw"
            accessibilityHint="Restore previously purchased premium access"
          />
          <SettingsLinkRow
            label="Manage Subscription"
            onPress={handleManageSubscription}
            icon="credit-card"
            accessibilityHint="Manage your subscription or request a refund"
            isLast
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsLinkRow
            label="Send Feedback"
            onPress={handleSendFeedback}
            icon="message-circle"
            accessibilityHint="Send feedback to the developers"
          />
          <SettingsLinkRow
            label="Privacy Preferences"
            onPress={handlePrivacy}
            icon="shield"
            isExternal
            isLast
          />
        </SettingsSection>

        {/* Reset Progress (standalone, not in a section) */}
        <View style={styles.resetContainer}>
          <SettingsLinkRow
            label="Reset Progress"
            onPress={handleResetProgress}
            icon="trash-2"
            isDestructive
            accessibilityHint="Delete all game progress and statistics"
            isLast
          />
        </View>

        {/* Footer - App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            Version {appVersion} ({buildNumber})
          </Text>
          <Text style={styles.copyrightText}>Made with love by Bridgeful</Text>
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
    // Subtle shadow for card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
