import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { Difficulty, MAX_MISTAKES } from '../../engine/types';
import { formatTime } from '../../utils/formatTime';
import { StatCard } from '../home/StatCard';
import { ActivityCalendar } from '../home/ActivityCalendar';
import { SettingsSection } from './SettingsSection';
import { StatRow } from './StatRow';
import {
  useUserStats,
  useLongestWinStreak,
  useTotalGamesWon,
  useTotalHintFreeWins,
  useTotalPerfectWins,
} from '../../stores/userStatsStore';
import { useCurrentStreak, usePlayerStreakStore } from '../../stores/playerStreakStore';
import { useGlobalRank } from '../../hooks/useGlobalRank';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function TimeBadges({ lives, hints }: { lives: number; hints: number }) {
  return (
    <View style={badgeStyles.container}>
      <View style={badgeStyles.badge}>
        <Ionicons name="heart" size={14} color={colors.coral} />
        <Text style={badgeStyles.text}>{lives}</Text>
      </View>
      <View style={badgeStyles.badge}>
        <Ionicons name="bulb-outline" size={14} color={colors.textSecondary} />
        <Text style={badgeStyles.text}>{hints}</Text>
      </View>
    </View>
  );
}

export function StatsOverview() {
  const c = useColors();
  const stats = useUserStats();
  const longestWinStreak = useLongestWinStreak();
  const totalGamesWon = useTotalGamesWon();
  const totalHintFreeWins = useTotalHintFreeWins();
  const totalPerfectWins = useTotalPerfectWins();
  const currentStreak = useCurrentStreak();
  const { globalRank, avgTimePercentiles } = useGlobalRank();
  const completedDates = usePlayerStreakStore((s) => s.completedDates);
  const frozenDates = usePlayerStreakStore((s) => s.frozenDates);
  const gamesPlayedByDate = usePlayerStreakStore((s) => s.gamesPlayedByDate);

  return (
    <>
      <View style={[styles.calendarCard, { backgroundColor: c.cardBackground }]}>
        <ActivityCalendar completedDates={completedDates} frozenDates={frozenDates} gamesPlayedByDate={gamesPlayedByDate} />
      </View>

      <SettingsSection title="Your Stats">
        <View style={styles.highlightRow}>
          <StatCard label="Day Streak" value={currentStreak} />
          <StatCard label="Rank" value={globalRank ?? '—'} />
          <StatCard label="Win Streak" value={longestWinStreak} />
        </View>
        <StatRow label="Perfect Games" value={`${totalPerfectWins}`} />
        <StatRow label="Hint-Free Wins" value={`${totalHintFreeWins}`} />
        <StatRow label="Games Won" value={`${totalGamesWon}`} isLast />
      </SettingsSection>

      <SettingsSection title="Best Times">
        {DIFFICULTIES.map((d, i) => {
          const record = stats[d].bestTime;
          return (
            <StatRow
              key={d}
              label={capitalize(d)}
              value={record ? formatTime(record.timeSeconds) : '—'}
              right={record ? (
                <TimeBadges
                  lives={MAX_MISTAKES - record.mistakeCount}
                  hints={record.hintsUsed}
                />
              ) : undefined}
              isLast={i === DIFFICULTIES.length - 1}
            />
          );
        })}
      </SettingsSection>

      <SettingsSection title="Average Times">
        {DIFFICULTIES.map((d, i) => {
          const diffStats = stats[d];
          const avgTime = diffStats.gamesWon > 0
            ? formatTime(Math.round(diffStats.totalTimeSeconds / diffStats.gamesWon))
            : '—';
          const percentile = avgTimePercentiles[d];

          return (
            <StatRow
              key={d}
              label={capitalize(d)}
              value={avgTime}
              right={percentile ? (
                <Text style={styles.percentile}>{percentile}</Text>
              ) : undefined}
              isLast={i === DIFFICULTIES.length - 1}
            />
          );
        })}
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  percentile: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
