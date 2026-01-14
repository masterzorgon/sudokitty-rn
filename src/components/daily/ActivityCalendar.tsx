// GitHub-style activity calendar component
// Shows 52 weeks of completion history in a horizontal scrolling grid

import React, { memo, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

import { ActivityDay } from '../../engine/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';

interface ActivityCalendarProps {
  activityData: ActivityDay[];
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Get short month name
const getMonthName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short' });
};

interface WeekData {
  days: ActivityDay[];
  weekIndex: number;
}

export const ActivityCalendar = memo(({ activityData }: ActivityCalendarProps) => {
  // Group activity data into weeks
  const { weeks, monthLabels } = useMemo(() => {
    const weeksArr: WeekData[] = [];
    const labels: { month: string; weekIndex: number }[] = [];

    for (let i = 0; i < activityData.length; i += DAYS_IN_WEEK) {
      const weekDays = activityData.slice(i, i + DAYS_IN_WEEK);
      const weekIndex = Math.floor(i / DAYS_IN_WEEK);
      weeksArr.push({ days: weekDays, weekIndex });

      // Check if this week starts a new month
      if (weekDays.length > 0) {
        const firstDay = weekDays[0];
        const dayOfMonth = new Date(firstDay.date).getDate();
        // If the first day of the week is early in the month, show label
        if (dayOfMonth <= 7) {
          labels.push({ month: getMonthName(firstDay.date), weekIndex });
        }
      }
    }

    return { weeks: weeksArr, monthLabels: labels };
  }, [activityData]);

  // Get color for a cell based on completion
  const getCellColor = (completed: boolean, isToday: boolean): string => {
    if (isToday) {
      return completed ? colors.softOrange : colors.peach;
    }
    return completed ? colors.softOrange : colors.cellBackground;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Day labels on the left */}
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.dayLabel}>
            {index % 2 === 0 ? label : ''}
          </Text>
        ))}
      </View>

      {/* Scrollable calendar grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            {weeks.map(({ weekIndex }) => {
              const label = monthLabels.find((l) => l.weekIndex === weekIndex);
              return (
                <View key={weekIndex} style={styles.monthLabelCell}>
                  {label && <Text style={styles.monthLabel}>{label.month}</Text>}
                </View>
              );
            })}
          </View>

          {/* Grid of weeks */}
          <View style={styles.grid}>
            {weeks.map(({ days, weekIndex }) => (
              <View key={weekIndex} style={styles.week}>
                {days.map((day, dayIndex) => {
                  const isToday = day.date === today;
                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: getCellColor(day.completed, isToday),
                        },
                        isToday && styles.todayCell,
                      ]}
                    />
                  );
                })}
                {/* Fill empty cells for incomplete weeks */}
                {days.length < DAYS_IN_WEEK &&
                  Array(DAYS_IN_WEEK - days.length)
                    .fill(null)
                    .map((_, i) => (
                      <View key={`empty-${i}`} style={styles.emptyCell} />
                    ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

ActivityCalendar.displayName = 'ActivityCalendar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  dayLabels: {
    marginRight: spacing.xs,
    paddingTop: 16, // Align with grid (account for month labels)
  },
  dayLabel: {
    height: CELL_SIZE + CELL_GAP,
    fontSize: 9,
    color: colors.textLight,
    textAlign: 'right',
    lineHeight: CELL_SIZE + CELL_GAP,
  },
  scrollContent: {
    paddingRight: spacing.lg,
  },
  monthLabels: {
    flexDirection: 'row',
    height: 14,
    marginBottom: 2,
  },
  monthLabelCell: {
    width: CELL_SIZE + CELL_GAP,
  },
  monthLabel: {
    fontSize: 9,
    color: colors.textLight,
  },
  grid: {
    flexDirection: 'row',
  },
  week: {
    flexDirection: 'column',
    marginRight: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: borderRadius.xs,
    marginBottom: CELL_GAP,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.coral,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
  },
});
