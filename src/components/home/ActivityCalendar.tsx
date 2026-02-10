// Activity Calendar — GitHub-style heatmap of completed days
// Shows 16 weeks of activity with colored squares

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme';
import { ActivityDay } from '../../engine/types';

// ============================================
// Constants
// ============================================

const CELL_SIZE = 12;
const CELL_GAP = 3;
const ROWS = 7; // Sun-Sat
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

// ============================================
// Types
// ============================================

interface ActivityCalendarProps {
  activityData: ActivityDay[];
}

// ============================================
// Component
// ============================================

export const ActivityCalendar = memo(({ activityData }: ActivityCalendarProps) => {
  // Organize data into columns (weeks) of 7 days each
  const { columns, monthLabels } = useMemo(() => {
    const cols: ActivityDay[][] = [];
    let currentCol: ActivityDay[] = [];

    for (let i = 0; i < activityData.length; i++) {
      currentCol.push(activityData[i]);
      if (currentCol.length === ROWS) {
        cols.push(currentCol);
        currentCol = [];
      }
    }
    if (currentCol.length > 0) {
      // Pad incomplete last column
      while (currentCol.length < ROWS) {
        currentCol.push({ date: '', completed: false });
      }
      cols.push(currentCol);
    }

    // Compute month labels for columns where a new month starts
    const labels: { colIndex: number; label: string }[] = [];
    let lastMonth = '';
    for (let c = 0; c < cols.length; c++) {
      // Use the first day of the week to determine the month
      const firstDay = cols[c][0];
      if (firstDay.date) {
        const month = firstDay.date.substring(0, 7); // YYYY-MM
        if (month !== lastMonth) {
          const date = new Date(firstDay.date + 'T00:00:00');
          labels.push({
            colIndex: c,
            label: date.toLocaleDateString('en-US', { month: 'short' }),
          });
          lastMonth = month;
        }
      }
    }

    return { columns: cols, monthLabels: labels };
  }, [activityData]);

  // Check if a day is within the last 30 days (for opacity)
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  return (
    <View style={styles.container}>
      {/* Day labels column */}
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.dayLabelCell}>
            <Text style={styles.dayLabelText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {/* Month labels row */}
        <View style={styles.monthLabelsRow}>
          {columns.map((_, colIndex) => {
            const monthLabel = monthLabels.find((m) => m.colIndex === colIndex);
            return (
              <View key={colIndex} style={styles.monthLabelCell}>
                {monthLabel && (
                  <Text style={styles.monthLabelText}>{monthLabel.label}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Activity rows */}
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {columns.map((col, colIndex) => {
              const day = col[rowIndex];
              const isCompleted = day?.completed ?? false;
              const isRecent = day?.date ? day.date >= thirtyDaysAgo : false;

              return (
                <View
                  key={colIndex}
                  style={[
                    styles.cell,
                    isCompleted && styles.cellCompleted,
                    isCompleted && !isRecent && styles.cellCompletedOld,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

ActivityCalendar.displayName = 'ActivityCalendar';

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: CELL_GAP,
    justifyContent: 'flex-end', // Align with grid rows (skip month label row)
  },
  dayLabelCell: {
    width: 14,
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 9,
    color: colors.textLight,
    fontFamily: 'OpenRunde-Medium',
  },
  grid: {
    flex: 1,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    marginBottom: CELL_GAP,
  },
  monthLabelCell: {
    width: CELL_SIZE,
    marginRight: CELL_GAP,
  },
  monthLabelText: {
    fontSize: 9,
    color: colors.textLight,
    fontFamily: 'OpenRunde-Medium',
  },
  row: {
    flexDirection: 'row',
    marginBottom: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    backgroundColor: colors.gridLine,
    marginRight: CELL_GAP,
  },
  cellCompleted: {
    backgroundColor: colors.softOrange,
  },
  cellCompletedOld: {
    opacity: 0.4,
  },
});
