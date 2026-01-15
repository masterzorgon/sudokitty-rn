// Home screen - hero stat, chart, stats grid, and daily challenge CTA
// Scrollable layout with staggered entrance animations

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import {
  useDailyChallengeStore,
  useCurrentStreak,
  useTotalMochiPoints,
} from '../../src/stores/dailyChallengeStore';
import { ChartTimePeriod } from '../../src/engine/types';
import {
  MochiHeroStat,
  MochiChart,
  TimePeriodTabs,
  StatsCardGrid,
  DailyChallengeCTA,
} from '../../src/components/home';

// Static placeholder for global rank (until backend integration)
const STATIC_GLOBAL_RANK = 4521;

// Nav bar height estimate: paddingV (14) * 2 + content (~24) = ~52px
// Nav bar bottomOffset: 16px
// Gap above nav bar: 20px
const CTA_BOTTOM_OFFSET = 16 + 52 + 20; // 88px from safe area bottom

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<ChartTimePeriod>('1W');

  // Store hooks
  const loadState = useDailyChallengeStore((s) => s.loadState);
  const totalMochis = useTotalMochiPoints();
  const currentStreak = useCurrentStreak();
  const getMochiEarnedToday = useDailyChallengeStore((s) => s.getMochiEarnedToday);
  const getMochiHistory = useDailyChallengeStore((s) => s.getMochiHistory);
  const getTodayChallenge = useDailyChallengeStore((s) => s.getTodayChallenge);
  const isTodayCompleted = useDailyChallengeStore((s) => s.isTodayCompleted);
  const getSimulatedParticipants = useDailyChallengeStore((s) => s.getSimulatedParticipants);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Derived values
  const earnedToday = getMochiEarnedToday();
  const chartData = getMochiHistory(selectedPeriod);
  const challenge = getTodayChallenge();
  const isCompleted = isTodayCompleted();
  const participants = getSimulatedParticipants();

  const handleDailyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/daily');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.title}>Home</Text>
        </Animated.View>

        {/* Hero Mochi Stat */}
        {/* <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <MochiHeroStat totalMochis={totalMochis} earnedToday={earnedToday} />
        </Animated.View> */}

        {/* Chart Section */}
        {/* <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.chartSection}
        >
          <TimePeriodTabs
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
          />
          <View style={styles.chartContainer}>
            <MochiChart data={chartData} period={selectedPeriod} height={140} />
          </View>
        </Animated.View> */}

        {/* Stats Card Grid */}
        {/* <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.statsSection}
        >
          <StatsCardGrid streak={currentStreak} globalRank={STATIC_GLOBAL_RANK} />
        </Animated.View> */}
      </ScrollView>

      {/* Daily Challenge CTA - fixed 20px above nav bar */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={[
          styles.ctaSection,
          { bottom: insets.bottom + CTA_BOTTOM_OFFSET },
        ]}
      >
        <DailyChallengeCTA
          challenge={challenge}
          isCompleted={isCompleted}
          participantCount={participants}
          onPress={handleDailyPress}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  chartSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
  },
  statsSection: {
    marginTop: spacing.xl,
  },
  ctaSection: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
