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
} from '../../src/stores/dailyChallengeStore';
import {
  MochiCat,
  ChatBubble,
  TechniquesCTA,
  StreakPill,
} from '../../src/components/home';
import { useCurrentStreak } from '../../src/stores/dailyChallengeStore';

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

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleTechniquesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/techniques');
  };

  // MARK: - Render

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <View style={styles.content}>
        {/* App Title */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.title}>sudokitty</Text>
        </Animated.View>

        {/* Mochi Cat Hero Section */}
        <View style={styles.heroSection}>
          {/* Mochi Cat Character */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={styles.catContainer}
          >
            <MochiCat size={180} />
          </Animated.View>

          {/* Chat Bubble with Japanese greeting */}
          <ChatBubble text="こんにちは！" appearDelay={400} />
        </View>

        {/* Streak Pill */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(400)}
          style={styles.streakContainer}
        >
          <StreakPill streakCount={currentStreak} />
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  catContainer: {
    // Shadow for the cat to make it pop
    shadowColor: colors.boardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
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
