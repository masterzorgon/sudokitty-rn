// Home screen - Landing page with mochi cat mascot and animated greeting
// Features split-flap animation for Japanese to English text transition

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { playFeedback } from '../../src/utils/feedback';

import { colors, useColors } from '../../src/theme/colors';
import { typography, fontFamilies } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import {
  useDailyChallengeStore,
  useTotalMochiPoints,
  useCurrentStreak,
} from '../../src/stores/dailyChallengeStore';
import { useFishyStore, useTotalFishyPoints } from '../../src/stores/fishyStore';
import {
  MochiCat,
  TechniquesCTA,
  StreakPill,
  PointsHeaderPill,
} from '../../src/components/home';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';
import { SpeechBubble } from '../../src/components/ui/SpeechBubble';
import { getRandomWelcomeMessage } from '../../src/constants/welcomeMessages';
import { runEconomyV2Migration } from '../../src/services/economyMigration';

// MARK: - Constants

// Nav bar height estimate: paddingV (14) * 2 + content (~24) = ~52px
// Nav bar bottomOffset: 16px
// Gap above nav bar: 20px
const CTA_BOTTOM_OFFSET = 16 + 52 + 20; // 88px from safe area bottom

// MARK: - Component

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Store hooks
  const loadState = useDailyChallengeStore((s) => s.loadState);
  const loadFishyState = useFishyStore((s) => s.loadState);
  const currentStreak = useCurrentStreak();
  const totalFishies = useTotalFishyPoints();
  const totalMochis = useTotalMochiPoints();

  // Welcome message for speech bubble
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Run economy v2 migration, load state, then apply daily login bonus if new day
  useEffect(() => {
    (async () => {
      await runEconomyV2Migration();
      loadState();
      loadFishyState();
      useDailyChallengeStore.getState().applyDailyLoginBonusIfNeeded();
    })();
  }, [loadState, loadFishyState]);

  useEffect(() => {
    getRandomWelcomeMessage().then(setWelcomeMessage);
  }, []);

  const handleTechniquesPress = () => {
    playFeedback('tap');
    router.push('/techniques');
  };

  const handleStreakPress = () => {
    playFeedback('tap');
    router.push('/profile');
  };

  const handleStorePress = () => {
    playFeedback('tap');
    router.push('/store');
  };

  const handleDailyChallengePress = () => {
    playFeedback('tap');
    const dailyStore = useDailyChallengeStore.getState();
    if (dailyStore.isTodayCompleted()) {
      Alert.alert(
        'Daily challenge',
        "You've already completed today's puzzle. Come back tomorrow!",
      );
      return;
    }
    const challenge = dailyStore.getTodayChallenge();
    router.push({
      pathname: '/game',
      params: { difficulty: challenge.difficulty, isDaily: 'true' },
    });
  };

  // MARK: - Render

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      {/* Atmospheric gradient background */}
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />

      <View style={styles.content}>
        {/* Header row: fishy pill | title | mochi pill */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
          <PointsHeaderPill type="fishies" value={totalFishies} onPress={handleStorePress} />
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>sudokitty</Text>
          <PointsHeaderPill type="mochis" value={totalMochis} onPress={handleStorePress} />
        </Animated.View>

        {/* Mochi Cat Hero Section */}
        <View style={styles.heroSection}>
          {/* Mochi Cat Character */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={styles.catContainer}
          >
            <MochiCat size={180} variant="welcome" />
          </Animated.View>

          {/* Speech bubble with dynamic random welcome message */}
          {welcomeMessage ? (
            <Animated.View
              entering={FadeInUp.delay(400).duration(400).springify()}
              style={styles.bubbleContainer}
            >
              <SpeechBubble
                text={welcomeMessage}
                pointerDirection="up"
                textStyle={styles.bubbleText}
              />
            </Animated.View>
          ) : null}
        </View>

        {/* Streak pill */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(400)}
          style={styles.streakContainer}
        >
          <StreakPill streakCount={currentStreak} onPress={handleStreakPress} />
        </Animated.View>
      </View>

      {/* CTA cards - fixed above nav bar */}
      <Animated.View
        entering={FadeInDown.delay(1000).duration(400)}
        style={[
          styles.ctaSection,
          { bottom: insets.bottom + CTA_BOTTOM_OFFSET },
        ]}
      >
        <View style={styles.ctaStack}>
          <TechniquesCTA onPress={handleTechniquesPress} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    ...typography.largeTitle,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  catContainer: {},
  streakContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  ctaSection: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  ctaStack: {
    gap: spacing.md,
  },
  bubbleContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bubbleText: {
    fontFamily: fontFamilies.medium,
    fontSize: 20,
    color: '#8b7878',
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: 24,
  },
});
