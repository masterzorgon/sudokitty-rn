// Profile screen (placeholder)
// Matches iOS ProfileView.swift

import { StyleSheet, View, Text, SafeAreaView } from 'react-native';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>profile</Text>

        <View style={styles.statsGrid}>
          <StatCard label="games played" value="0" />
          <StatCard label="games won" value="0" />
          <StatCard label="current streak" value="0" />
          <StatCard label="mochi points" value="0" />
        </View>

        <Text style={styles.comingSoon}>
          more stats and settings coming soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '45%',
    ...shadows.small,
  },
  statValue: {
    ...typography.largeTitle,
    color: colors.softOrange,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  comingSoon: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
