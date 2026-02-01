// Daily challenge screen
// Matches iOS DailyChallengeView.swift

import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import { StreakDisplay, ActivityCalendar, ChallengeCard } from '../../src/components/daily';
import { GameButton } from '../../src/components/ui/GameButton';
import {
  useDailyChallengeStore,
  useCurrentStreak,
  useLongestStreak,
  useIsLoaded,
} from '../../src/stores/dailyChallengeStore';

export default function DailyScreen() {
  const router = useRouter();

  // Store state and actions
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const isLoaded = useIsLoaded();
  const loadState = useDailyChallengeStore((state) => state.loadState);
  const getTodayChallenge = useDailyChallengeStore((state) => state.getTodayChallenge);
  const getActivityData = useDailyChallengeStore((state) => state.getActivityData);
  const isTodayCompleted = useDailyChallengeStore((state) => state.isTodayCompleted);
  const getSimulatedParticipants = useDailyChallengeStore(
    (state) => state.getSimulatedParticipants
  );

  // Local state for participant count (updates periodically)
  const [participantCount, setParticipantCount] = useState(0);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Update participant count periodically
  useEffect(() => {
    if (!isLoaded) return;

    const updateCount = () => {
      setParticipantCount(getSimulatedParticipants());
    };

    updateCount();
    const interval = setInterval(updateCount, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLoaded, getSimulatedParticipants]);

  // Get derived state
  const challenge = getTodayChallenge();
  const activityData = getActivityData(52);
  const isCompleted = isTodayCompleted();

  const handleStartChallenge = () => {
    router.push({
      pathname: '/game',
      params: {
        difficulty: challenge.difficulty,
        isDaily: 'true',
        seed: challenge.seed.toString(),
      },
    });
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>daily challenge</Text>

        {/* Streak Display */}
        <StreakDisplay currentStreak={currentStreak} longestStreak={longestStreak} />

        {/* Activity Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionLabel}>activity</Text>
          <ActivityCalendar activityData={activityData} />
        </View>

        {/* Today's Challenge Card */}
        <ChallengeCard
          challenge={challenge}
          isCompleted={isCompleted}
          participantCount={participantCount}
          onPress={handleStartChallenge}
        />

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          {isCompleted ? (
            <View style={styles.completedMessage}>
              <Text style={styles.completedEmoji}>✨</Text>
              <Text style={styles.completedText}>you've completed today's challenge!</Text>
              <Text style={styles.completedSubtext}>come back tomorrow for a new puzzle</Text>
            </View>
          ) : (
            <GameButton
              label="start challenge"
              subtext={`earn ${challenge.mochiPoints} mochi points`}
              onPress={handleStartChallenge}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  calendarSection: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  completedMessage: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  completedText: {
    ...typography.headline,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completedSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
