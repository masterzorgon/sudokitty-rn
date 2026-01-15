// Number pad for inputting numbers 1-9
// OP-1 style concave well buttons in 3x3 grid

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { borderRadius, shadows } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const BUTTON_SIZE = 60;
const GRID_GAP = 10;
const GRID_WIDTH = BUTTON_SIZE * 3 + GRID_GAP * 2;

const timingConfig = {
  duration: 120,
  easing: Easing.out(Easing.ease),
};

interface NumberButtonProps {
  number: number;
  onPress: (num: number) => void;
  isHighlighted: boolean;
  disabled?: boolean;
}

const NumberButton = memo(({ number, onPress, isHighlighted, disabled = false }: NumberButtonProps) => {
  const pressProgress = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(1, timingConfig);
  }, [disabled, pressProgress]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(0, timingConfig);
  }, [disabled, pressProgress]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(number);
  }, [disabled, number, onPress]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    const scale = 1 - pressProgress.value * 0.04; // 1 -> 0.96
    const backgroundColor = isHighlighted
      ? colors.softOrange
      : interpolateColor(
          pressProgress.value,
          [0, 1],
          [colors.numberPadBase, colors.numberPadPressed]
        );

    return {
      transform: [{ scale }],
      backgroundColor,
    };
  });

  const animatedGradientStyle = useAnimatedStyle(() => {
    // Deepen the concave shadow on press (0.08 -> 0.15 opacity)
    // When highlighted, we don't show the concave gradient
    const opacity = isHighlighted ? 0 : 0.08 + pressProgress.value * 0.07;
    return { opacity };
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        animatedButtonStyle,
        disabled && styles.buttonDisabled,
        isHighlighted && styles.buttonHighlighted,
      ]}
    >
      {/* Concave inner shadow gradient */}
      <AnimatedLinearGradient
        colors={['rgba(0,0,0,0.12)', 'transparent']}
        locations={[0, 0.35]}
        style={[styles.concaveOverlay, animatedGradientStyle]}
        pointerEvents="none"
      />

      {/* Number text */}
      <Text
        style={[
          styles.buttonText,
          isHighlighted && styles.buttonTextHighlighted,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {number}
      </Text>
    </AnimatedPressable>
  );
});

export const NumberPad = memo(() => {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const handleNumberPress = useCallback(
    (num: number) => {
      if (gameStatus !== 'playing') return;
      inputNumber(num);
    },
    [gameStatus, inputNumber]
  );

  const isDisabled = gameStatus !== 'playing';

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <NumberButton
          key={num}
          number={num}
          onPress={handleNumberPress}
          isHighlighted={highlightedNumber === num}
          disabled={isDisabled}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    width: GRID_WIDTH,
    alignSelf: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: borderRadius.md + 1, // 13px
    backgroundColor: colors.numberPadBase,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.small,
  },
  buttonHighlighted: {
    ...shadows.medium,
    shadowColor: colors.softOrange,
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  concaveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.md + 1,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.numberPadText,
  },
  buttonTextHighlighted: {
    color: colors.cardBackground,
  },
  buttonTextDisabled: {
    color: colors.textLight,
  },
});
