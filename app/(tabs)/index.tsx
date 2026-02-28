// Home screen - Landing page with mochi cat mascot and animated greeting

import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { playFeedback } from '../../src/utils/feedback';

import { useColors } from '../../src/theme/colors';
import { fontFamilies } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import {
  useDailyChallengeStore,
  useCurrentStreak,
} from '../../src/stores/dailyChallengeStore';
import {
  MochiCat,
  TechniquesCTA,
  StreakPill,
} from '../../src/components/home';
import { ScreenBackground } from '../../src/components/ui/ScreenBackground';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SpeechBubble } from '../../src/components/ui/SpeechBubble';
import { PurchaseSheet, type PurchaseSheetConfig } from '../../src/components/store/PurchaseSheet';
import { getRandomWelcomeMessage } from '../../src/constants/welcomeMessages';
import { runEconomyV2Migration } from '../../src/services/economyMigration';
import { getMochiPackProducts } from '../../src/lib/revenueCat';
import { MOCHI_PACK_AMOUNTS, type MochiPackProductId } from '../../src/constants/economy';

const MochiFreezeImg = require('../../assets/images/mochi/mochi-freeze.png');

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
  const currentStreak = useCurrentStreak();
  const streakLostInfo = useDailyChallengeStore((s) => s.streakLostInfo);
  const reigniteStreak = useDailyChallengeStore((s) => s.reigniteStreak);
  const clearStreakLostInfo = useDailyChallengeStore((s) => s.clearStreakLostInfo);
  const totalMochis = useDailyChallengeStore((s) => s.totalMochiPoints);

  // Purchase sheet for reigniting streak
  const [sheetConfig, setSheetConfig] = useState<PurchaseSheetConfig | null>(null);

  // Welcome message for speech bubble
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Run economy v2 migration, load state, then apply daily login bonus if new day
  useEffect(() => {
    (async () => {
      await runEconomyV2Migration();
      loadState();
      useDailyChallengeStore.getState().applyDailyLoginBonusIfNeeded();
    })();
  }, [loadState]);

  // Show reignite sheet when streak is lost
  const handleInsufficientFunds = useCallback(async (itemPrice: number) => {
    const deficit = itemPrice - totalMochis;
    const sortedAmounts = Object.entries(MOCHI_PACK_AMOUNTS)
      .sort(([, a], [, b]) => a - b);

    const targetPack = sortedAmounts.find(([, amount]) => amount >= deficit);
    const packId = (targetPack ? targetPack[0] : sortedAmounts[sortedAmounts.length - 1][0]) as MochiPackProductId;

    const packProducts = await getMochiPackProducts();
    const product = packProducts.find((p) => p.identifier === packId);
    if (!product) {
      router.push('/store');
      return;
    }

    router.push('/store');
  }, [totalMochis, router]);

  useEffect(() => {
    if (streakLostInfo) {
      setSheetConfig({
        image: <Image source={MochiFreezeImg} style={{ width: 160, height: 160 }} resizeMode="contain" />,
        title: `Reignite your ${streakLostInfo.previousStreak}-day streak?`,
        price: streakLostInfo.reigniteCost,
        currency: 'mochis',
        buttonLabel: `REIGNITE FOR ${streakLostInfo.reigniteCost}`,
        onConfirm: () => {
          reigniteStreak();
        },
        onInsufficientFunds: () => handleInsufficientFunds(streakLostInfo.reigniteCost),
      });
    }
  }, [streakLostInfo, reigniteStreak, handleInsufficientFunds]);

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
      <ScreenBackground />

      <Animated.View entering={FadeIn.duration(400)}>
        <ScreenHeader
          title="sudokitty"
          showFreezePill
          showMochiPill
        />
      </Animated.View>

      <View style={styles.content}>

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

      <PurchaseSheet
        config={sheetConfig}
        onDismiss={() => {
          setSheetConfig(null);
          clearStreakLostInfo();
        }}
      />
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
