// Activity Calendar — GitHub-style heatmap of completed days
// Starts from the user's first game completion, cells fill available width

import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';

import { colors, useColors } from '../../theme/colors';
import { ActivityDay } from '../../engine/types';

// ============================================
// Constants
// ============================================

const CELL_GAP = 3;
const ROWS = 7; // Sun-Sat
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const DAY_LABEL_WIDTH = 16;

// ============================================
// Types
// ============================================

interface ActivityCalendarProps {
  /** Array of YYYY-MM-DD date strings when the user completed a game */
  completedDates: string[];
  /** Array of YYYY-MM-DD date strings where a streak freeze was consumed */
  frozenDates?: string[];
}

// ============================================
// Helpers
// ============================================

function buildActivityGrid(completedDates: string[], frozenDates: string[] = []): ActivityDay[] {
  const completedSet = new Set(completedDates);
  const frozenSet = new Set(frozenDates);

  // Start from earliest completion, or 4 weeks ago if no completions yet
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let firstDate: Date;
  if (completedDates.length > 0) {
    const sorted = [...completedDates].sort();
    firstDate = new Date(sorted[0] + 'T00:00:00');
  } else {
    firstDate = new Date(today);
    firstDate.setDate(firstDate.getDate() - 27);
  }
  today.setHours(0, 0, 0, 0);

  // Align start to the beginning of the week (Sunday)
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: ActivityDay[] = [];
  const current = new Date(startDate);

  while (current <= today) {
    const dateString = current.toISOString().split('T')[0];
    days.push({
      date: dateString,
      completed: completedSet.has(dateString),
      frozen: frozenSet.has(dateString),
    });
    current.setDate(current.getDate() + 1);
  }

  // Pad the last week to fill the column
  while (days.length % ROWS !== 0) {
    days.push({ date: '', completed: false });
  }

  return days;
}

// ============================================
// Component
// ============================================

const FROZEN_COLOR = '#5DADE2';

export const ActivityCalendar = memo(({ completedDates, frozenDates = [] }: ActivityCalendarProps) => {
  const c = useColors();
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const activityData = useMemo(() => buildActivityGrid(completedDates, frozenDates), [completedDates, frozenDates]);

  // Organize into columns (weeks)
  const columns = useMemo(() => {
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
      while (currentCol.length < ROWS) {
        currentCol.push({ date: '', completed: false });
      }
      cols.push(currentCol);
    }

    return cols;
  }, [activityData]);

  // Calculate how many columns fit the screen at the target cell size
  const TARGET_CELL_SIZE = 14;
  const gridWidth = containerWidth - DAY_LABEL_WIDTH - CELL_GAP;
  const maxCols = Math.floor((gridWidth + CELL_GAP) / (TARGET_CELL_SIZE + CELL_GAP));
  // Use all available columns, or pad to fill the screen
  const numCols = Math.max(columns.length, maxCols);
  const cellSize = Math.floor((gridWidth - CELL_GAP * (numCols - 1)) / numCols);

  // 30 days ago for opacity
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <>
          {/* Day labels column */}
          <View style={[styles.dayLabels, { width: DAY_LABEL_WIDTH }]}>
            {DAY_LABELS.map((label, i) => (
              <View key={i} style={{ height: cellSize, marginBottom: CELL_GAP, justifyContent: 'center' as const }}>
                <Text style={styles.dayLabelText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {Array.from({ length: ROWS }, (_, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {Array.from({ length: numCols }, (_, colIndex) => {
                  const day = columns[colIndex]?.[rowIndex];
                  const isCompleted = day?.completed ?? false;
                  const isFrozen = day?.frozen ?? false;
                  const isRecent = day?.date ? day.date >= thirtyDaysAgo : false;

                  let bgColor: string;
                  if (isFrozen) {
                    bgColor = isRecent ? FROZEN_COLOR : FROZEN_COLOR + '66';
                  } else if (isCompleted) {
                    bgColor = isRecent ? c.accent : c.accent + '66';
                  } else {
                    bgColor = colors.gridLine;
                  }

                  return (
                    <View
                      key={colIndex}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: cellSize > 10 ? 3 : 2,
                        marginRight: CELL_GAP,
                        marginBottom: CELL_GAP,
                        backgroundColor: bgColor,
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}
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
  },
  dayLabelText: {
    fontSize: 9,
    color: colors.textLight,
    fontFamily: 'Pally-Medium',
  },
  grid: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
});
