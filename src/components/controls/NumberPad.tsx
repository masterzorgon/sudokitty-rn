// Number pad for inputting numbers 1-9
// Matches iOS NumberPadView.swift

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { springConfigs } from '../../theme/animations';
import { borderRadius, shadows, spacing } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NumberButtonProps {
  number: number;
  onPress: (num: number) => void;
  isHighlighted: boolean;
}

const NumberButton = memo(({ number, onPress, isHighlighted }: NumberButtonProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springConfigs.quick);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.default);
  };

  const handlePress = () => {
    onPress(number);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        isHighlighted && styles.buttonHighlighted,
        animatedStyle,
      ]}
    >
      <Text style={[styles.buttonText, isHighlighted && styles.buttonTextHighlighted]}>
        {number}
      </Text>
    </AnimatedPressable>
  );
});

export const NumberPad = memo(() => {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const handleNumberPress = (num: number) => {
    if (gameStatus !== 'playing') return;
    inputNumber(num);
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <NumberButton
          key={num}
          number={num}
          onPress={handleNumberPress}
          isHighlighted={highlightedNumber === num}
        />
      ))}
    </View>
  );
});

const BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  buttonHighlighted: {
    backgroundColor: colors.softOrange,
  },
  buttonText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  buttonTextHighlighted: {
    color: colors.cardBackground,
  },
});
