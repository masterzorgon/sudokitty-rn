// Stats screen — Analytics dashboard with activity calendar and game stats

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, useColors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme';
import { usePlayerStreakStore } from '../../src/stores/playerStreakStore';
import { ActivityCalendar } from '../../src/components/home';
import { StatsOverview } from '../../src/components/settings';
import { ScreenBackground, ScreenContent, ScreenHeader } from '../../src/components/ui/Layout';

export default function StatsScreen() {
  const c = useColors();
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

        <StatsOverview />

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
  calendarCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
