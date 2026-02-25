// Reusable rewards pill component
// Displays a points balance or reward amount with a skeuomorphic pill style

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme/colors';
import { spacing } from '../../theme';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';
import { Skeu3D, SkeuButton } from './Skeuomorphic';
import type { CustomSkeuColors } from './Skeuomorphic';

export interface RewardsPillProps {
  mochis: number;
  label?: string | null; // null = show only number (for balance display)
  size?: 'small' | 'medium' | 'large';
  variant?: 'reward' | 'balance'; // reward shows "earn X mochis", balance shows just number
  icon?: React.ComponentType<{ width: number; height: number }>;
  onPress?: () => void; // balance variant only: renders a tappable + badge on the left
}

export function RewardsPill({
  mochis,
  label,
  size = 'medium',
  variant = 'reward',
  icon: Icon = MochiPointIcon,
  onPress,
}: RewardsPillProps) {
  const c = useColors();

  // Size configurations
  const sizeConfig = {
    small: { iconSize: 14, fontSize: 13, badgeSize: 22 },
    medium: { iconSize: 20, fontSize: 16, badgeSize: 28 },
    large: { iconSize: 24, fontSize: 18, badgeSize: 30 },
  }[size];

  // Determine display text
  const displayText =
    variant === 'balance'
      ? `${mochis}`
      : label !== null && label !== undefined
        ? `${label} ${mochis} mochis`
        : `earn ${mochis} mochis`;

  const badgeStyle = {
    backgroundColor: c.mochiPillBorder + '40',
    width: sizeConfig.badgeSize,
    height: sizeConfig.badgeSize,
    borderRadius: sizeConfig.badgeSize / 2,
  };

  const skeuColors: CustomSkeuColors = {
    gradient: [c.mochiPillBg, c.mochiPillBg, c.mochiPillBg] as readonly [string, string, string],
    edge: c.mochiPillEdge,
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: c.mochiPillBorder + '80',
    textColor: c.mochiPillText,
  };

  const faceStyle = StyleSheet.flatten([
    styles.face,
    size === 'large' && styles.faceLarge,
  ]) as ViewStyle;

  const content = (
    <>
      {variant === 'balance' && onPress && (
        <View style={[styles.iconBadge, badgeStyle]}>
          <Feather name="plus" size={sizeConfig.iconSize - 4} color={c.mochiPillText} />
        </View>
      )}
      <Text style={[styles.text, { color: c.mochiPillText, fontSize: sizeConfig.fontSize }]}>
        {displayText}
      </Text>
      <View style={[styles.iconBadge, badgeStyle]}>
        <Icon width={sizeConfig.iconSize} height={sizeConfig.iconSize} />
      </View>
    </>
  );

  if (variant === 'balance' && onPress) {
    return (
      <SkeuButton
        onPress={onPress}
        customColors={skeuColors}
        borderRadius={100}
        style={styles.container}
        contentStyle={faceStyle}
      >
        {content}
      </SkeuButton>
    );
  }

  return (
    <Skeu3D
      customColors={skeuColors}
      borderRadius={100}
      style={styles.container}
      faceStyle={faceStyle}
    >
      {content}
    </Skeu3D>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    gap: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'space-between',
  },
  faceLarge: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Pally-Bold',
  },
});
