// Reusable mochi reward pill component
// Matches the styling of the home screen mochi balance pill

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme/colors';
import { spacing } from '../../theme';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

export interface MochiRewardPillProps {
  mochis: number;
  label?: string | null; // null = show only number (for balance display)
  size?: 'small' | 'medium' | 'large';
  variant?: 'reward' | 'balance'; // reward shows "earn X mochis", balance shows just number
  icon?: React.ComponentType<{ width: number; height: number }>;
  onPress?: () => void; // balance variant only: renders a tappable + badge on the left
}

export function MochiRewardPill({
  mochis,
  label,
  size = 'medium',
  variant = 'reward',
  icon: Icon = MochiPointIcon,
  onPress,
}: MochiRewardPillProps) {
  const c = useColors();
  
  // Size configurations
  const sizeConfig = {
    small: { iconSize: 14, fontSize: 13, badgeSize: 22 },
    medium: { iconSize: 20, fontSize: 16, badgeSize: 28 },
    large: { iconSize: 24, fontSize: 18, badgeSize: 30 },
  }[size];

  // Determine display text
  const displayText = variant === 'balance' 
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

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: c.mochiPillBg, borderColor: c.mochiPillBorder },
        size === 'large' && styles.pillLarge,
      ]}
    >
      {variant === 'balance' && onPress && (
        <Pressable onPress={onPress} hitSlop={8} style={[styles.iconBadge, badgeStyle]}>
          <Feather name="plus" size={sizeConfig.iconSize - 4} color={c.mochiPillText} />
        </Pressable>
      )}
      <Text style={[styles.text, { color: c.mochiPillText, fontSize: sizeConfig.fontSize }]}>
        {displayText}
      </Text>
      <View style={[styles.iconBadge, badgeStyle]}>
        <Icon width={sizeConfig.iconSize} height={sizeConfig.iconSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    gap: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    alignSelf: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  pillLarge: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Pally-Bold',
  },
});
