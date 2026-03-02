// Stats screen — Analytics dashboard with stat cards and activity calendar

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, useColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import {
  usePlayerStreakStore,
  useCurrentStreak,
  useLongestStreak,
} from '../../src/stores/playerStreakStore';
import { useCompletionCount } from '../../src/stores/techniqueProgressStore';
import {
  StatCard,
  ActivityCalendar,
} from '../../src/components/home';
import { ScreenBackground, ScreenContent, ScreenHeader } from '../../src/components/ui/Layout';

export default function ProfileScreen() {
  const c = useColors();
  // Store selectors (reactive)
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const totalGamesWon = usePlayerStreakStore((s) => s.totalGamesWon);
  const techniquesMastered = useCompletionCount();

  // Activity data: from first completion to today
  const completedDates = usePlayerStreakStore((s) => s.completedDates);
  const frozenDates = usePlayerStreakStore((s) => s.frozenDates);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />
      <ScreenHeader />
      <ScreenContent contentStyle={styles.scrollContent}>

        {/* Activity Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarCard}>
            <ActivityCalendar completedDates={completedDates} frozenDates={frozenDates} />
          </View>
        </View>

        {/* Stats Grid (2x2) */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <StatCard
              label="Current streak"
              value={currentStreak}
            />
            <StatCard
              label="Longest streak"
              value={longestStreak}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Games won"
              value={totalGamesWon}
            />
            <StatCard
              label="Techniques"
              value={techniquesMastered}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScreenContent>
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
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 120,
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
