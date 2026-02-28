import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuCard } from './Skeuomorphic';

export interface StoreItemRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing: React.ReactNode;
  onPress?: () => void;
}

export function StoreItemRow({ icon, title, subtitle, trailing, onPress }: StoreItemRowProps) {
  const c = useColors();

  const content = (
    <View style={itemStyles.row}>
      <View style={itemStyles.iconArea}>{icon}</View>
      <View style={itemStyles.body}>
        <Text style={[itemStyles.title, { color: c.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[itemStyles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={itemStyles.trailing}>{trailing}</View>
    </View>
  );

  return (
    <SkeuCard
      borderRadius={borderRadius.lg}
      contentStyle={itemStyles.card}
      style={itemStyles.wrapper}
      onPress={onPress}
      accessibilityLabel={title}
    >
      {content}
    </SkeuCard>
  );
}

const itemStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArea: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
  },
});
