// Time period tabs for chart filtering
// Horizontal row of 1D, 1W, 1M, 6M, 1Y options

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ChartTimePeriod } from '../../engine/types';
import { triggerHaptic, ImpactFeedbackStyle } from '../../utils/haptics';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { springConfigs } from '../../theme/animations';

const PERIODS: ChartTimePeriod[] = ['1D', '1W', '1M', '6M', '1Y'];

interface TimePeriodTabsProps {
  selectedPeriod: ChartTimePeriod;
  onSelectPeriod: (period: ChartTimePeriod) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Tab = memo(({
  period,
  isSelected,
  onPress,
  accentColor,
}: {
  period: ChartTimePeriod;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfigs.quick);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.quick);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.tab,
        isSelected && { backgroundColor: accentColor },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[
        styles.tabText,
        isSelected && styles.tabTextSelected,
      ]}>
        {period}
      </Text>
    </AnimatedPressable>
  );
});

Tab.displayName = 'Tab';

export const TimePeriodTabs = memo(({
  selectedPeriod,
  onSelectPeriod,
}: TimePeriodTabsProps) => {
  const c = useColors();
  const handlePress = (period: ChartTimePeriod) => {
    if (period !== selectedPeriod) {
      triggerHaptic(ImpactFeedbackStyle.Light);
      onSelectPeriod(period);
    }
  };

  return (
    <View style={styles.container}>
      {PERIODS.map((period) => (
        <Tab
          key={period}
          period={period}
          isSelected={period === selectedPeriod}
          onPress={() => handlePress(period)}
          accentColor={c.accent}
        />
      ))}
    </View>
  );
});

TimePeriodTabs.displayName = 'TimePeriodTabs';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
});
