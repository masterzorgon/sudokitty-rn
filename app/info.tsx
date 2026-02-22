import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { colors, useColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { BackButton } from '../src/components/ui/BackButton';
import { MochiCat } from '../src/components/home';

const INFO_ROWS: { label: string; getValue: (version: string) => string }[] = [
  { label: 'App Name', getValue: () => 'sudokitty' },
  { label: 'Version', getValue: (v) => v },
  { label: 'Developer', getValue: () => "Bridgeful, LLC" },
];

export default function InfoScreen() {
  const c = useColors();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
      </View>

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <MochiCat size={120} />
          <Text style={styles.appName}>sudokitty</Text>
          <Text style={styles.versionSubtitle}>Version {appVersion}</Text>
        </View>

        <View style={styles.infoCard}>
          {INFO_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                i < INFO_ROWS.length - 1 && styles.infoRowBorder,
              ]}
            >
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.getValue(appVersion)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Bridgeful, LLC. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  appName: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  versionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  infoLabel: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  infoValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  copyright: {
    ...typography.caption,
    color: colors.textLight,
  },
});
