// Home screen - Landing page with mochi cat mascot and animated greeting
// Features split-flap animation for Japanese to English text transition

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, useColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import {
  useDailyChallengeStore,
  useTotalMochiPoints,
} from '../../src/stores/dailyChallengeStore';
import {
  MochiCat,
  ChatBubble,
  TechniquesCTA,
  StreakPill,
} from '../../src/components/home';
import { useCurrentStreak } from '../../src/stores/dailyChallengeStore';
import { MochiRewardPill } from '../../src/components/ui/MochiRewardPill';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';

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
  const totalMochis = useTotalMochiPoints();

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleTechniquesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/techniques');
  };

  const handleStreakPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile');
  };

  // MARK: - Render

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      {/* Atmospheric gradient background */}
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />

      <View style={styles.content}>
        {/* Header row: title + mochi balance */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
          <Text style={styles.title}>sudokitty</Text>
          <View style={styles.mochiPillOuter}>
            <MochiRewardPill 
              mochis={totalMochis} 
              variant="balance" 
              size="medium" 
            />
          </View>
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

          {/* Chat Bubble with dynamic random welcome message */}
          <ChatBubble appearDelay={400} />
        </View>

        {/* Streak Pill */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(400)}
          style={styles.streakContainer}
        >
          <StreakPill streakCount={currentStreak} onPress={handleStreakPress} />
        </Animated.View>
      </View>

      {/* Techniques CTA - fixed above nav bar */}
      <Animated.View
        entering={FadeInDown.delay(1000).duration(400)}
        style={[
          styles.ctaSection,
          { bottom: insets.bottom + CTA_BOTTOM_OFFSET },
        ]}
      >
        <TechniquesCTA onPress={handleTechniquesPress} />
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
    paddingTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  mochiPillOuter: {
    position: 'absolute',
    right: 0,
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
});
