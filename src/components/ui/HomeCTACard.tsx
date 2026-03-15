import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuButton } from './Skeuomorphic';
import type { CustomSkeuColors } from './Skeuomorphic';

export interface HomeCTACardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  customColors?: CustomSkeuColors;
}

export const HomeCTACard = memo(({
  title,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
  customColors: customColorsProp,
}: HomeCTACardProps) => {
  const c = useColors();

  const skeuColors: CustomSkeuColors = customColorsProp ?? {
    gradient: [c.mochiPillBg, c.mochiPillBg, c.mochiPillBg] as readonly [string, string, string],
    edge: c.mochiPillEdge,
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: c.mochiPillBorder + '80',
    textColor: c.mochiPillText,
  };

  return (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={borderRadius.lg}
      showHighlight={false}
      style={styles.container}
      contentStyle={styles.face}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: c.mochiPillBorder + '40' }]}>
          {icon}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Feather name="chevron-right" size={24} color={c.textSecondary} />
      </View>
    </SkeuButton>
  );
});

HomeCTACard.displayName = 'HomeCTACard';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
