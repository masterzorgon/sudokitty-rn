// Stats screen — Analytics dashboard with mochi chart, stat cards, and activity calendar
// Replaces the placeholder profile screen

import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import { ChartTimePeriod } from '../../src/engine/types';
import {
  useDailyChallengeStore,
  useCurrentStreak,
  useLongestStreak,
  useTotalMochiPoints,
} from '../../src/stores/dailyChallengeStore';
import { useCompletionCount } from '../../src/stores/techniqueProgressStore';
import {
  MochiHeroStat,
  TimePeriodTabs,
  MochiChart,
  StatCard,
  ActivityCalendar,
} from '../../src/components/home';

export default function ProfileScreen() {
  // Chart period state (local)
  const [period, setPeriod] = useState<ChartTimePeriod>('1M');

  // Store selectors (reactive)
  const totalMochis = useTotalMochiPoints();
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const totalGamesWon = useDailyChallengeStore((s) => s.totalGamesWon);
  const techniquesMastered = useCompletionCount();

  // Store methods (computed per render)
  const store = useDailyChallengeStore.getState();
  const earnedToday = store.getMochiEarnedToday();
  const mochiHistory = store.getMochiHistory(period);
  const activityData = store.getActivityData(16);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Header */}
        <Text style={styles.title}>stats</Text>

         {/* Activity Calendar */}
         <View style={styles.section}>
          <Text style={styles.sectionLabel}>activity</Text>
          <View style={styles.calendarCard}>
            <ActivityCalendar activityData={activityData} />
          </View>
        </View>

        {/* Mochi Hero Stat */}
        <View style={styles.section}>
          <MochiHeroStat totalMochis={totalMochis} earnedToday={earnedToday} />
        </View>

        {/* Mochi Chart */}
        <View style={styles.section}>
          <TimePeriodTabs selectedPeriod={period} onSelectPeriod={setPeriod} />
          <View style={styles.chartContainer}>
            <MochiChart data={mochiHistory} period={period} />
          </View>
        </View>

        {/* Stats Grid (2x2) */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <StatCard
              label="current streak"
              value={currentStreak}
            />
            <StatCard
              label="longest streak"
              value={longestStreak}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="games won"
              value={totalGamesWon}
            />
            <StatCard
              label="techniques"
              value={techniquesMastered}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

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
    paddingTop: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    marginTop: spacing.md,
    height: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  calendarCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
