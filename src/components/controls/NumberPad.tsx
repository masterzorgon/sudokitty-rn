// Number pad for inputting numbers 1-9
// Single row layout with skeuomorphic 3D styling

import React, { memo, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";

import { useGameStore, useRemainingCounts } from "../../stores/gameStore";
import { colors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { playFeedback } from "../../utils/feedback";
import { SkeuButton } from "../ui/Skeuomorphic";
import { BUTTON_HEIGHT, BUTTON_GAP, BUTTON_RADIUS, whiteSkeuColorsPrimary } from "./constants";

const whiteColors = whiteSkeuColorsPrimary;

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

RemainingDots.displayName = "RemainingDots";

const NumberButton = memo(
  ({ number, onPress, isHighlighted, remaining, disabled = false }: NumberButtonProps) => {
    const handlePress = useCallback(() => {
      onPress(number);
    }, [number, onPress]);

    return (
      <View style={styles.buttonWrapper}>
        <SkeuButton
          onPress={handlePress}
          variant={isHighlighted && !disabled ? "primary" : "secondary"}
          customColors={isHighlighted && !disabled ? undefined : whiteColors}
          borderRadius={BUTTON_RADIUS}
          showHighlight={false}
          disabled={disabled}
          contentStyle={styles.buttonFace}
          accessibilityLabel={
            remaining === 0
              ? `Number ${number}, all placed`
              : `Number ${number}, ${remaining} remaining`
          }
        >
          <Text
            style={[
              styles.buttonText,
              isHighlighted && !disabled && styles.buttonTextHighlighted,
              disabled && styles.buttonTextMuted,
            ]}
          >
            {number}
          </Text>
        </SkeuButton>
        <RemainingDots count={remaining} />
      </View>
    );
  },
);

NumberButton.displayName = "NumberButton";

export const NumberPad = memo(() => {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const isNotesMode = useGameStore((s) => s.isNotesMode);
  const remainingCounts = useRemainingCounts();

  const handleNumberPress = useCallback(
    (num: number) => {
      if (gameStatus !== "playing") return;
      if (remainingCounts[num] === 0) return;
      // Notes mode: subtle pencil-mark haptic
      if (isNotesMode) {
        inputNumber(num);
        playFeedback("pencilMark");
        return;
      }
      const result = inputNumber(num);
      // Priority: gameWon > gameLost > unitComplete > correct > mistake
      if (result.isGameWon) playFeedback("gameWon");
      else if (result.isGameLost) playFeedback("gameLost");
      else if (result.completedUnits.length > 0) playFeedback("unitComplete");
      else if (result.isCorrect) playFeedback("correct");
      else if (!result.isCorrect && result.completedUnits.length === 0) playFeedback("mistake");
    },
    [gameStatus, inputNumber, remainingCounts, isNotesMode],
  );

  // Mute entire pad only when not in an active in-session state (playing or paused).
  // Paused (e.g. settings open) still blocks input via handleNumberPress, but keeps visuals.
  const padDisabled = gameStatus !== "playing" && gameStatus !== "paused";

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <NumberButton
          key={num}
          number={num}
          onPress={handleNumberPress}
          isHighlighted={highlightedNumber === num}
          remaining={remainingCounts[num]}
          disabled={padDisabled || remainingCounts[num] === 0}
        />
      ))}
    </View>
  );
});

NumberPad.displayName = "NumberPad";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: BUTTON_GAP,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonFace: {
    height: BUTTON_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 24,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  buttonTextHighlighted: {
    color: colors.white,
  },
  buttonTextMuted: {
    color: colors.textLight,
    opacity: 0.55,
  },
  dotsContainer: {
    alignItems: "center",
    marginTop: 10,
    minHeight: 6,
    gap: 3,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2.5,
    backgroundColor: colors.textLight,
  },
});
