// Number pad for inputting numbers 1-9
// Single row layout with skeuomorphic 3D styling

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { SkeuButton } from '../ui/Skeuomorphic';

const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 8;
const BUTTON_RADIUS = 12;

// White custom colors for non-highlighted buttons
const whiteColors = {
  gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  edge: '#E0E0E0',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  borderDark: 'rgba(0, 0, 0, 0.1)',
  textColor: colors.textPrimary,
};

interface NumberButtonProps {
  number: number;
  onPress: (num: number) => void;
  isHighlighted: boolean;
  disabled?: boolean;
}

const NumberButton = memo(({ number, onPress, isHighlighted, disabled = false }: NumberButtonProps) => {
  const handlePress = useCallback(() => {
    onPress(number);
  }, [number, onPress]);

  return (
    <View style={styles.buttonWrapper}>
      <SkeuButton
        onPress={handlePress}
        variant={isHighlighted ? 'primary' : 'secondary'}
        customColors={isHighlighted ? undefined : whiteColors}
        borderRadius={BUTTON_RADIUS}
        showHighlight={false}
        disabled={disabled}
        contentStyle={styles.buttonFace}
        accessibilityLabel={`Number ${number}`}
      >
        <Text
          style={[
            styles.buttonText,
            isHighlighted && styles.buttonTextHighlighted,
          ]}
        >
          {number}
        </Text>
      </SkeuButton>
    </View>
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
