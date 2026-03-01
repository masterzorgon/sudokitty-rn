// Reusable rewards pill component
// Displays a reward amount or earned amount with primary-color face and sheen (like StreakPill)

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../theme';
import { fontFamilies } from '../../theme/typography';
import { SKEU_VARIANTS } from '../../theme/skeuomorphic';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';
import { SkeuButton, Skeu3D } from './Skeuomorphic';

export interface RewardsPillProps {
  mochis: number;
  label?: string | null;
  size?: 'small' | 'medium' | 'large';
  variant?: 'reward' | 'balance';
  icon?: React.ComponentType<{ width: number; height: number }>;
  onPress?: () => void;
}

const SIZE_CONFIG = {
  small: {
    height: 32,
    iconSize: 14,
    fontSize: 12,
    iconCircle: 22,
    paddingH: spacing.sm,
    paddingV: 4,
  },
  medium: {
    height: 40,
    iconSize: 18,
    fontSize: 15,
    iconCircle: 28,
    paddingH: spacing.md,
    paddingV: 6,
  },
  large: {
    height: 48,
    iconSize: 22,
    fontSize: 18,
    iconCircle: 36,
    paddingH: spacing.lg,
    paddingV: 8,
  },
} as const;

function mochiLabel(count: number): string {
  return count === 1 ? 'mochi' : 'mochis';
}

export function RewardsPill({
  mochis,
  label,
  size = 'medium',
  variant = 'reward',
  icon: Icon = MochiPointIcon,
  onPress,
}: RewardsPillProps) {
  const cfg = SIZE_CONFIG[size];

  const displayText =
    variant === 'balance'
      ? `${mochis}`
      : label !== null && label !== undefined
        ? `${label} ${mochis} ${mochiLabel(mochis)}`
        : `earn ${mochis} ${mochiLabel(mochis)}`;

  const iconCircleStyle: ViewStyle = {
    width: cfg.iconCircle,
    height: cfg.iconCircle,
    borderRadius: cfg.iconCircle / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const faceStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: cfg.height,
    paddingHorizontal: cfg.paddingH,
    paddingVertical: cfg.paddingV,
  };

  const content = (
    <>
      {variant === 'balance' && onPress && (
        <View style={iconCircleStyle}>
          <Feather name="plus" size={cfg.iconSize - 4} color="#FFFFFF" />
        </View>
      )}
      <View style={iconCircleStyle}>
        <Icon width={cfg.iconSize} height={cfg.iconSize} />
      </View>
      <Text style={[styles.text, styles.primaryText, { fontSize: cfg.fontSize }]}>
        {displayText}
      </Text>
    </>
  );

  const isPressable = variant === 'balance' && typeof onPress === 'function';

  if (isPressable) {
    return (
      <SkeuButton
        onPress={onPress}
        variant="primary"
        sheen
        borderRadius={999}
        style={styles.container}
        contentStyle={faceStyle}
      >
        {content}
      </SkeuButton>
    );
  }

  return (
    <Skeu3D
      customColors={SKEU_VARIANTS.primary}
      borderRadius={999}
      showHighlight={false}
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
  text: {
    fontFamily: fontFamilies.bold,
  },
  primaryText: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
});
