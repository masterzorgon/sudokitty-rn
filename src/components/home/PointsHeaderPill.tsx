// Compact currency pill for home header (cream/skeuomorphic): fishy or mochi icon + count; tap → store

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { useColors } from '../../theme/colors';
import { spacing } from '../../theme';
import type { CustomSkeuColors } from '../ui/Skeuomorphic';
import { SkeuButton } from '../ui/Skeuomorphic';
import FishyPointIcon from '../../../assets/images/icons/fishy-point.svg';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

const PILL_WIDTH_RATIO = 0.18; // was 0.2, reduced by 20%
const PILL_HEIGHT = 34; // was 40, reduced by 15%
const ICON_SIZE = 18;
const ICON_CIRCLE_SIZE = 26;
const FONT_SIZE = 14;
const PILL_BORDER_RADIUS = 999;

export type PointsHeaderPillType = 'fishies' | 'mochis';

export interface PointsHeaderPillProps {
  type: PointsHeaderPillType;
  value: number;
  onPress: () => void;
}

export function PointsHeaderPill({ type, value, onPress }: PointsHeaderPillProps) {
  const c = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const pillWidth = Math.max(52, screenWidth * PILL_WIDTH_RATIO);

  const iconCircleStyle = {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: c.mochiPillBorder + '50',
  };

  const skeuColors: CustomSkeuColors = {
    gradient: [c.cream, c.cream, c.cream] as readonly [string, string, string],
    edge: c.mochiPillBorder + '99',
    borderLight: 'rgba(255, 255, 255, 0.4)',
    borderDark: c.mochiPillBorder + '99',
    textColor: c.mochiPillText,
  };

  const faceStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    height: PILL_HEIGHT,
    width: pillWidth,
  };

  const Icon = type === 'fishies' ? FishyPointIcon : MochiPointIcon;
  const label = type === 'fishies' ? 'Fishies' : 'Mochis';

  return (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={PILL_BORDER_RADIUS}
      style={StyleSheet.flatten([styles.container, { width: pillWidth, borderRadius: PILL_BORDER_RADIUS }])}
      contentStyle={faceStyle}
      accessibilityLabel={`${value} ${label}, open store`}
    >
      <View style={[styles.iconCircle, iconCircleStyle]}>
        <Icon width={ICON_SIZE} height={ICON_SIZE} />
      </View>
      <Text style={[styles.countText, { color: c.mochiPillText }]}>{value}</Text>
    </SkeuButton>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: 'Pally-Bold',
    fontSize: FONT_SIZE,
    marginRight: spacing.sm,
  },
});
