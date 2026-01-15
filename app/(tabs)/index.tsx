// Home screen - welcome view with Daily Challenge card
// Game actions are handled via the split nav bar

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import { springConfigs } from '../../src/theme/animations';
import {
  useDailyChallengeStore,
  useCurrentStreak,
} from '../../src/stores/dailyChallengeStore';
import { DIFFICULTY_CONFIG } from '../../src/engine/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const router = useRouter();
  const loadState = useDailyChallengeStore((s) => s.loadState);
  const getTodayChallenge = useDailyChallengeStore((s) => s.getTodayChallenge);
  const isTodayCompleted = useDailyChallengeStore((s) => s.isTodayCompleted);
  const getSimulatedParticipants = useDailyChallengeStore(
    (s) => s.getSimulatedParticipants
  );
  const currentStreak = useCurrentStreak();

  // Load daily challenge state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  const challenge = getTodayChallenge();
  const isCompleted = isTodayCompleted();
  const participants = getSimulatedParticipants();
  const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];

  // Card press animation
  const cardScale = useSharedValue(1);

  const handleCardPressIn = () => {
    cardScale.value = withSpring(0.98, springConfigs.quick);
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, springConfigs.quick);
  };

  const handleDailyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/daily');
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP ZONE - Header area */}
      <View style={styles.topZone}>
        <Text style={styles.title}>sudokitty</Text>
      </View>

      {/* MIDDLE ZONE - Content area */}
      <View style={styles.middleZone}>
        {/* Welcome message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            welcome back!{'\n'}ready to play?
          </Text>
        </View>

        {/* Daily Challenge Card */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <AnimatedPressable
            style={[styles.dailyCard, cardAnimatedStyle]}
            onPress={handleDailyPress}
            onPressIn={handleCardPressIn}
            onPressOut={handleCardPressOut}
          >
            <View style={styles.dailyCardHeader}>
              <View style={styles.dailyBadge}>
                <Feather name="calendar" size={14} color={colors.softOrange} />
                <Text style={styles.dailyBadgeText}>Daily Challenge</Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Feather name="check" size={12} color={colors.mint} />
                  <Text style={styles.completedText}>Done!</Text>
                </View>
              )}
            </View>

            <View style={styles.dailyContent}>
              <View style={styles.difficultyInfo}>
                <Text style={styles.difficultyLabel}>
                  {difficultyConfig.name}
                </Text>
              </View>

              <View style={styles.statsRow}>
                {currentStreak > 0 && (
                  <View style={styles.statItem}>
                    <Feather name="zap" size={14} color={colors.softOrange} />
                    <Text style={styles.statText}>{currentStreak} day streak</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Feather name="users" size={14} color={colors.textLight} />
                  <Text style={styles.statText}>
                    {participants.toLocaleString()} playing today
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Feather name="chevron-right" size={20} color={colors.textLight} />
            </View>
          </AnimatedPressable>
        </Animated.View>
      </View>

      {/* BOTTOM ZONE - Spacer for nav bar */}
      <View style={styles.bottomZone} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topZone: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  middleZone: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.title,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 36,
  },
  dailyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.medium,
  },
  dailyCardHeader: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dailyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.softOrange,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(184, 230, 208, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mint,
  },
  dailyContent: {
    flex: 1,
    paddingTop: 28,
  },
  difficultyInfo: {
    marginBottom: spacing.sm,
  },
  difficultyLabel: {
    ...typography.headline,
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  mochiComment: {
    fontSize: 13,
    color: colors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  arrowContainer: {
    marginLeft: spacing.sm,
  },
  bottomZone: {
    height: 100,
  },
});
