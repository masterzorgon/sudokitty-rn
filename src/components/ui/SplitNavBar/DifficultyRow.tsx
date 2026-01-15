// Individual difficulty row for the unfurl menu
// Shows difficulty label with Mochi face icon

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
import { DIFFICULTY_CONFIG, Difficulty } from '@/src/engine/types';
import { DifficultyRowProps, DIFFICULTY_ICONS, LAYOUT } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_DURATION = 120;

export function DifficultyRow({
  difficulty,
  index,
  onPress,
  isVisible,
  isLast,
}: DifficultyRowProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const iconName = DIFFICULTY_ICONS[difficulty];
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
      {/* difficulty icon */}
      <View style={styles.iconContainer}>
        <Feather
          name={iconName as keyof typeof Feather.glyphMap}
          size={24}
          color={colors.softOrange}
        />
      </View>
      {/* difficulty name label */}
      <View style={styles.labelContainer}>
        <Text style={styles.difficultyName}>{config.name}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 1,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gridLine,
  },
  labelContainer: {
    flex: 1,
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  mochiComment: {
    fontSize: 13,
    color: colors.textLight,
  },
  iconContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
