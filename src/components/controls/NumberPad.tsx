// Number pad for inputting numbers 1-9
// Single row layout with skeuomorphic 3D styling

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme';
import { Pill3DContainer, Pill3DFace } from '../ui/Skeuomorphic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 8;
const BUTTON_RADIUS = 12;
const PRESS_DEPTH = 2;

const timingConfig = {
  duration: 100,
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

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressProgress.value * PRESS_DEPTH }],
    opacity: disabled ? 0.5 : 1,
  }));

  // Use highlighted colors (orange) or white background
  const customColors = isHighlighted
    ? undefined // Use primary variant
    : {
        gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
        edge: '#E0E0E0',
        borderLight: 'rgba(255, 255, 255, 0.5)',
        borderDark: 'rgba(0, 0, 0, 0.1)',
        textColor: colors.textPrimary,
      };

  return (
    <Animated.View style={[styles.buttonWrapper, animatedContainerStyle]}>
      <Pill3DContainer
        variant={isHighlighted ? 'primary' : 'secondary'}
        customColors={customColors}
        borderRadius={BUTTON_RADIUS}
        edgeHeight={4}
      >
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.buttonPressable}
        >
          <Pill3DFace
            variant={isHighlighted ? 'primary' : 'secondary'}
            customColors={customColors}
            borderRadius={BUTTON_RADIUS}
            showHighlight={false}
            style={styles.buttonFace}
          >
            <Text
              style={[
                styles.buttonText,
                isHighlighted && styles.buttonTextHighlighted,
              ]}
            >
              {number}
            </Text>
          </Pill3DFace>
        </AnimatedPressable>
      </Pill3DContainer>
    </Animated.View>
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
    gap: BUTTON_GAP,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonPressable: {
    height: BUTTON_HEIGHT,
  },
  buttonFace: {
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  buttonTextHighlighted: {
    color: '#FFFFFF',
  },
});
