import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../src/theme/colors';
import { PALETTES, THEME_NAMES } from '../../src/theme/palettes';
import { spacing, borderRadius } from '../../src/theme';
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsLinkRow,
} from '../../src/components/settings';
import { ScreenBackground } from '../../src/components/ui/Layout/ScreenBackground';
import { ScreenHeader } from '../../src/components/ui/Layout/ScreenHeader';
import { SkeuCard } from '../../src/components/ui/Skeuomorphic';
import { CTABannerCarousel } from '../../src/components/ui/CTABannerCarousel';
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

  const isPremium = useIsPremium();

  const resetGame = useGameStore((s) => s.resetGame);
  const resetDailyChallenge = useDailyChallengeStore((s) => s.resetState);

  // Single navigation helper: string = internal route, object = external URL with analytics
  const navigate = useCallback(
    async (dest: string | { url: string; trackKey: string }) => {
      if (typeof dest === 'string') {
        router.push(dest as any);
      } else {
        try {
          trackExternalLinkOpened(dest.trackKey);
          await Linking.openURL(dest.url);
        } catch {
          Alert.alert('Error', 'Unable to open the link.');
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
      restored ? 'Restored!' : 'Nothing to Restore',
      restored
        ? 'Your premium access has been restored.'
        : 'No previous purchases found.',
    );
  }, []);

  const handleManageSubscription = useCallback(async () => {
    await presentCustomerCenter();
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
            resetGame();
            resetDailyChallenge();
            trackProgressReset();
            Alert.alert('Done', 'Your progress has been reset.');
          },
        },
      ]
    );
  }, [resetGame, resetDailyChallenge]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />
      <ScreenHeader title="Settings" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <CTABannerCarousel promos={['rate']} />

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

        {/* Learn */}
        <SettingsSection title="Learn">
          <SettingsLinkRow
            label="How to play"
            onPress={() => navigate('/tutorial')}
            icon="help-circle"
            accessibilityHint="Open the interactive tutorial"
          />
          <SettingsLinkRow
            label="Advanced techniques"
            onPress={() => navigate('/techniques')}
            icon="award"
          />
          <SettingsLinkRow
            label="Sudoku rules"
            onPress={() => navigate({ url: RULES_URL, trackKey: 'rules' })}
            icon="book"
            isExternal
            isLast
          />
        </SettingsSection>

        {/* Premium */}
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

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsLinkRow
            label="Send feedback"
            onPress={() => navigate('/feedback')}
            icon="message-circle"
            accessibilityHint="Send feedback to the developers"
          />
          <SettingsLinkRow
            label="Privacy preferences"
            onPress={() => navigate({ url: PRIVACY_URL, trackKey: 'privacy' })}
            icon="shield"
            isExternal
          />
          <SettingsLinkRow
            label="App info"
            onPress={() => navigate('/info')}
            icon="info"
            accessibilityHint="View app information"
            isLast
          />
        </SettingsSection>

        {/* Reset Progress */}
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
    paddingTop: 0,
    paddingBottom: 120,
  },
  resetContainer: {
    marginBottom: spacing.xl,
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
