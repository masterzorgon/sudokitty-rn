// Compact currency pill for home header (cream/skeuomorphic): icon + count; tap → store

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import type { CustomSkeuColors } from '../ui/Skeuomorphic';
import { SkeuButton } from '../ui/Skeuomorphic';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

const PILL_WIDTH_RATIO = 0.18;
const PILL_HEIGHT = 34;
const ICON_SIZE = 18;
const ICON_CIRCLE_SIZE = 26;
const FONT_SIZE = 14;

export type HeaderPillType = 'mochis' | 'freezes';

export interface HeaderPillProps {
  type: HeaderPillType;
  value: number;
  onPress: () => void;
}

export function HeaderPill({ type, value, onPress }: HeaderPillProps) {
  const c = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const pillWidth = Math.max(52, screenWidth * PILL_WIDTH_RATIO);

  const isFreeze = type === 'freezes';

  const borderColor = isFreeze ? c.freezePillBorder : c.mochiPillBorder;
  const textColor = isFreeze ? c.freezePillText : c.mochiPillText;

  const iconCircleStyle = {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: borderColor + '50',
  };

  const skeuColors: CustomSkeuColors = {
    gradient: [c.cream, c.cream, c.cream] as readonly [string, string, string],
    edge: borderColor + '99',
    borderLight: 'rgba(255, 255, 255, 0.4)',
    borderDark: borderColor + '99',
    textColor,
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

  const label = isFreeze ? 'Streak Freezes' : 'Mochis';

  return (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={borderRadius.full}
      style={StyleSheet.flatten([styles.container, { width: pillWidth, borderRadius: borderRadius.full }])}
      contentStyle={faceStyle}
      accessibilityLabel={`${value} ${label}, open store`}
    >
      <View style={[styles.iconCircle, iconCircleStyle]}>
        {isFreeze ? (
          <Ionicons name="snow" size={ICON_SIZE} color={textColor} />
        ) : (
          <MochiPointIcon width={ICON_SIZE} height={ICON_SIZE} />
        )}
      </View>
      <Text style={[styles.countText, { color: textColor }]}>{value}</Text>
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
    fontFamily: fontFamilies.bold,
    fontSize: FONT_SIZE,
    marginRight: spacing.sm,
  },
});
