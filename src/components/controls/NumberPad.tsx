// Number pad for inputting numbers 1-9
// Single row layout with skeuomorphic 3D styling

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { useGameStore, useRemainingCounts } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { playFeedback } from '../../utils/feedback';
import { SkeuButton } from '../ui/Skeuomorphic';

const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 4; // Reduced from 8 to make buttons ~5% wider
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
  remaining: number;
  disabled?: boolean;
}

const DOTS_PER_ROW = 3;

const RemainingDots = memo(({ count }: { count: number }) => {
  if (count <= 0) return <View style={styles.dotsContainer} />;

  const rows: number[] = [];
  let left = count;
  while (left > 0) {
    rows.push(Math.min(left, DOTS_PER_ROW));
    left -= DOTS_PER_ROW;
  }

  return (
    <View style={styles.dotsContainer}>
      {rows.map((dotsInRow, rowIdx) => (
        <View key={rowIdx} style={styles.dotsRow}>
          {Array.from({ length: dotsInRow }, (_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      ))}
    </View>
  );
});

const NumberButton = memo(({ number, onPress, isHighlighted, remaining, disabled = false }: NumberButtonProps) => {
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
        accessibilityLabel={`Number ${number}, ${remaining} remaining`}
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
      <RemainingDots count={remaining} />
    </View>
  );
});

export const NumberPad = memo(() => {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const isNotesMode = useGameStore((s) => s.isNotesMode);
  const remainingCounts = useRemainingCounts();

  const handleNumberPress = useCallback(
    (num: number) => {
      if (gameStatus !== 'playing') return;
      // Intentional silence: tapping fully-placed number (remaining=0) gets no feedback
      if (remainingCounts[num] === 0) {
        inputNumber(num);
        return;
      }
      // Notes mode: selection tick (haptic only) per plan
      if (isNotesMode) {
        inputNumber(num);
        playFeedback('selection');
        return;
      }
      const result = inputNumber(num);
      // Priority: gameWon > gameLost > unitComplete > correct > mistake
      if (result.isGameWon) playFeedback('gameWon');
      else if (result.isGameLost) playFeedback('gameLost');
      else if (result.completedUnits.length > 0) playFeedback('unitComplete');
      else if (result.isCorrect) playFeedback('correct');
      else if (!result.isCorrect && result.completedUnits.length === 0)
        playFeedback('mistake');
    },
    [gameStatus, inputNumber, remainingCounts, isNotesMode]
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
          remaining={remainingCounts[num]}
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
    fontFamily: 'Pally-Bold',
    color: colors.textPrimary,
  },
  buttonTextHighlighted: {
    color: '#FFFFFF',
  },
  dotsContainer: {
    alignItems: 'center',
    marginTop: 10,
    minHeight: 6,
    gap: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2.5,
    backgroundColor: colors.textLight,
  },
});
