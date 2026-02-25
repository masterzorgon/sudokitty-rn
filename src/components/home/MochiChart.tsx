// Custom Skia-based chart for displaying mochi history
// Smooth line chart with gradient fill and animated transitions

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Line,
} from '@shopify/react-native-skia';

import { MochiHistoryEntry, ChartTimePeriod } from '../../engine/types';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';

const CHART_PADDING = { top: 16, bottom: 24, left: 0, right: 0 };

interface MochiChartProps {
  data: MochiHistoryEntry[];
  period: ChartTimePeriod;
  height?: number;
}

// Aggregate data points by appropriate intervals based on period
const aggregateData = (
  data: MochiHistoryEntry[],
  period: ChartTimePeriod
): { x: number; y: number; value: number }[] => {
  if (data.length === 0) return [];

  // Sort by timestamp
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // For simpler rendering, just use cumulative totals over time
  const points = sorted.map((entry, index) => ({
    x: index / Math.max(1, sorted.length - 1),
    y: 0, // Will be normalized later
    value: entry.cumulativeTotal,
  }));

  // Normalize Y values
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const minValue = Math.min(...points.map((p) => p.value), 0);
  const range = maxValue - minValue || 1;

  return points.map((p) => ({
    ...p,
    y: (p.value - minValue) / range,
  }));
};

// Generate smooth cubic bezier path for the line
const generateLinePath = (
  points: { x: number; y: number }[],
  width: number,
  height: number
): string => {
  if (points.length < 2) return '';

  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  // Scale points to canvas
  const scaledPoints = points.map((p) => ({
    x: CHART_PADDING.left + p.x * chartWidth,
    y: CHART_PADDING.top + (1 - p.y) * chartHeight, // Invert Y
  }));

  // Build path with smooth curves
  let path = `M ${scaledPoints[0].x} ${scaledPoints[0].y}`;

  for (let i = 1; i < scaledPoints.length; i++) {
    const prev = scaledPoints[i - 1];
    const curr = scaledPoints[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return path;
};

// Generate area path (line path + bottom close)
const generateAreaPath = (
  points: { x: number; y: number }[],
  width: number,
  height: number
): string => {
  if (points.length < 2) return '';

  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const bottomY = CHART_PADDING.top + chartHeight;

  // Scale points to canvas
  const scaledPoints = points.map((p) => ({
    x: CHART_PADDING.left + p.x * chartWidth,
    y: CHART_PADDING.top + (1 - p.y) * chartHeight,
  }));

  // Build path with smooth curves
  let path = `M ${scaledPoints[0].x} ${bottomY}`;
  path += ` L ${scaledPoints[0].x} ${scaledPoints[0].y}`;

  for (let i = 1; i < scaledPoints.length; i++) {
    const prev = scaledPoints[i - 1];
    const curr = scaledPoints[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Close the area
  const lastPoint = scaledPoints[scaledPoints.length - 1];
  path += ` L ${lastPoint.x} ${bottomY}`;
  path += ' Z';

  return path;
};

export const MochiChart = memo(({
  data,
  period,
  height = 140,
}: MochiChartProps) => {
  const c = useColors();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.md * 2; // Account for screen and card padding

  const points = useMemo(() => aggregateData(data, period), [data, period]);

  const linePath = useMemo(
    () => (points.length >= 2 ? Skia.Path.MakeFromSVGString(generateLinePath(points, chartWidth, height)) : null),
    [points, chartWidth, height]
  );

  const areaPath = useMemo(
    () => (points.length >= 2 ? Skia.Path.MakeFromSVGString(generateAreaPath(points, chartWidth, height)) : null),
    [points, chartWidth, height]
  );

  // Get current value for display
  const currentValue = points.length > 0 ? points[points.length - 1].value : 0;
  const displayValue = data.length > 0 ? data[data.length - 1]?.cumulativeTotal ?? 0 : 0;

  // Empty state
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>complete puzzles to see your mochi history</Text>
          <Canvas style={{ width: chartWidth, height: 2 }}>
            <Line
              p1={vec(0, 1)}
              p2={vec(chartWidth, 1)}
              color={colors.gridLine}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
            />
          </Canvas>
        </View>
      </View>
    );
  }

  // Single point - show horizontal line
  if (points.length === 1) {
    const y = CHART_PADDING.top + (height - CHART_PADDING.top - CHART_PADDING.bottom) * 0.5;
    return (
      <View style={[styles.container, { height }]}>
        <Canvas style={{ width: chartWidth, height }}>
          <Line
            p1={vec(CHART_PADDING.left, y)}
            p2={vec(chartWidth - CHART_PADDING.right, y)}
            color={c.accent}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
          />
        </Canvas>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Canvas style={{ width: chartWidth, height }}>
        {/* Gradient area fill */}
        {areaPath && (
          <Path path={areaPath} style="fill">
            <LinearGradient
              start={vec(0, CHART_PADDING.top)}
              end={vec(0, height - CHART_PADDING.bottom)}
              colors={[`${c.accentSecondary}66`, `${c.accentSecondary}00`]}
            />
          </Path>
        )}

        {/* Line stroke */}
        {linePath && (
          <Path
            path={linePath}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            strokeJoin="round"
            color={c.accent}
          />
        )}

        {/* Horizontal grid lines (subtle) */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = CHART_PADDING.top + (height - CHART_PADDING.top - CHART_PADDING.bottom) * ratio;
          return (
            <Line
              key={ratio}
              p1={vec(CHART_PADDING.left, y)}
              p2={vec(chartWidth - CHART_PADDING.right, y)}
              color={colors.gridLine}
              style="stroke"
              strokeWidth={1}
            />
          );
        })}
      </Canvas>
    </View>
  );
});

MochiChart.displayName = 'MochiChart';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
});
