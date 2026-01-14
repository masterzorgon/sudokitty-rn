// Daily challenge screen (placeholder)
// Matches iOS DailyChallengeView.swift

import { StyleSheet, View, Text, SafeAreaView } from 'react-native';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';

export default function DailyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>daily challenge</Text>
        <Text style={styles.subtitle}>coming soon!</Text>
        <Text style={styles.description}>
          complete daily puzzles to build your streak{'\n'}
          and earn bonus mochi points
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.headline,
    color: colors.softOrange,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
