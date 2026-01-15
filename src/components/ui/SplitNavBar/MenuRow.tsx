// Individual menu row for the secondary menu
// Shows label with icon

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { MenuRowProps, LAYOUT } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_DURATION = 120;

export function MenuRow({
  item,
  index,
  onPress,
  isVisible,
  isLast,
}: MenuRowProps) {
  const isPressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    isPressed.value = withTiming(1, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePressOut = useCallback(() => {
    isPressed.value = withTiming(0, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor:
      isPressed.value === 1 ? 'rgba(245, 237, 229, 0.5)' : 'transparent',
  }));

  if (!isVisible) return null;

  return (
    <AnimatedPressable
      style={[styles.row, animatedStyle, isLast && styles.lastRow]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* menu item icon */}
      <View style={styles.iconContainer}>
        <Feather
          name={item.icon as keyof typeof Feather.glyphMap}
          size={24}
          color={colors.softOrange}
        />
      </View>
      {/* menu item label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{item.label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 100,
    paddingVertical: 12,
    paddingHorizontal: 1,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gridLine,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  iconContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
