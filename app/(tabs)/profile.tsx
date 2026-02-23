// Stats screen — Analytics dashboard with stat cards and activity calendar

import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, useColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import {
  useDailyChallengeStore,
  useCurrentStreak,
  useLongestStreak,
} from '../../src/stores/dailyChallengeStore';
import { useCompletionCount } from '../../src/stores/techniqueProgressStore';
import {
  StatCard,
  ActivityCalendar,
} from '../../src/components/home';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';

export default function ProfileScreen() {
  const c = useColors();
  // Store selectors (reactive)
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const totalGamesWon = useDailyChallengeStore((s) => s.totalGamesWon);
  const techniquesMastered = useCompletionCount();

  // Activity data: from first completion to today
  const completedDates = useDailyChallengeStore((s) => s.completedDates);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />
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
          <View style={styles.calendarCard}>
            <ActivityCalendar completedDates={completedDates} />
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
