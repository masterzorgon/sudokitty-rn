// Individual Sudoku cell component with optional animations
// Props-driven: works for both the main game (full animations) and technique practice (static)

import React, { useEffect, memo } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { springConfigs, timingConfigs } from '../../theme/animations';
import { positionKey, type CellAnimationState } from '../../engine/types';
import { useBoardAnimationsForCell } from '../../hooks/useBoardAnimations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Grid spans full screen width (edge-to-edge) for the main game
export const CELL_SIZE = SCREEN_WIDTH / 9;
export const COMPACT_CELL_SIZE = 36;

export interface SudokuCellProps {
  row: number;
  col: number;
  value: number | null; // null or 0 = empty
  isGiven: boolean;
  isValid: boolean;
  notes: Set<number>;
  isSelected: boolean;
  isRelated: boolean;
  isHighlighted: boolean; // Number-highlight (game) or primary technique highlight
  isSecondaryHighlight: boolean; // Elimination target highlight (technique practice)
  isInAltBox: boolean;
  onPress?: (row: number, col: number) => void;
  // Feature flags
  animateValues?: boolean; // Enable pop/shake/glow (default: true)
  compact?: boolean; // Smaller cell size for technique practice
  // Completion wave animations
  completionAnimations?: CellAnimationState[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NotesGrid = memo(({ notes, cellSize }: { notes: Set<number>; cellSize: number }) => (
  <View style={noteStyles.container}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
      <Text
        key={num}
        style={[
          noteStyles.note,
          { lineHeight: cellSize / 3 - 1 },
          !notes.has(num) && noteStyles.noteHidden,
        ]}
      >
        {num}
      </Text>
    ))}
  </View>
));

export const SudokuCell = memo(({
  row,
  col,
  value,
  isGiven,
  isValid,
  notes,
  isSelected,
  isRelated,
  isHighlighted,
  isSecondaryHighlight,
  isInAltBox,
  onPress,
  animateValues = true,
  compact = false,
  completionAnimations: completionAnimationsProp,
}: SudokuCellProps) => {
  const c = useColors();
  const cellSize = compact ? COMPACT_CELL_SIZE : CELL_SIZE;
  const displayValue = value === 0 ? null : value;

  // Subscribe to completion animations from store (main game) or use prop (technique practice)
  const key = positionKey({ row, col });
  const completionAnimationsFromStore = useBoardAnimationsForCell(key);
  const completionAnimations =
    completionAnimationsProp ?? completionAnimationsFromStore;

  // Animation shared values. Initialize backgroundProgress from props to avoid flash on resume:
  // first frame shows correct highlight state instead of default then effect-update.
  const initialBackground = isSecondaryHighlight
    ? 0.6
    : isSelected
      ? 1
      : isRelated
        ? 0.4
        : isHighlighted
          ? 0.25
          : 0;
  const glowOpacity = useSharedValue(0);
  const backgroundProgress = useSharedValue(initialBackground);

  // Wave completion animation shared value
  const waveGlow = useSharedValue(0);

  // Single-edge border strategy: each cell only draws right + bottom borders.
  // The board container provides the outer frame (top, left, right, bottom).
  const isLastCol = col === 8;
  const isLastRow = row === 8;
  const isRightBoxBorder = (col + 1) % 3 === 0 && !isLastCol;
  const isBottomBoxBorder = (row + 1) % 3 === 0 && !isLastRow;

  const borderStyle = {
    borderRightWidth: isLastCol ? 0 : isRightBoxBorder ? 2 : 1,
    borderBottomWidth: isLastRow ? 0 : isBottomBoxBorder ? 2 : 1,
    borderRightColor: isRightBoxBorder ? colors.gridLineBold : colors.gridLine,
    borderBottomColor: isBottomBoxBorder ? colors.gridLineBold : colors.gridLine,
  };

  // Base background color depends on checkerboard box
  const baseBackground = isInAltBox ? c.cellBackgroundAlt : colors.cellBackground;

  // Update background animation when selection state changes
  useEffect(() => {
    if (isSecondaryHighlight) {
      // Secondary highlight (elimination) gets a distinct progress value
      backgroundProgress.value = animateValues
        ? withSpring(0.6, springConfigs.default)
        : 0.6;
    } else {
      const targetValue = isSelected ? 1 : isRelated ? 0.4 : isHighlighted ? 0.25 : 0;
      backgroundProgress.value = targetValue;
    }
  }, [isSelected, isRelated, isHighlighted, isSecondaryHighlight, animateValues]);

  // Trigger glow effect on correct input (game mode only)
  useEffect(() => {
    if (!animateValues) return;
    if (displayValue && !isGiven && isValid) {
      glowOpacity.value = withSequence(
        withTiming(1, timingConfigs.glowIn),
        withTiming(0, timingConfigs.glowOut),
      );
    }
  }, [displayValue, isValid, animateValues]);

  // Trigger completion wave animation entirely on the UI thread via withDelay.
  // When overlapping units complete (e.g. row + column), use the earliest delay.
  useEffect(() => {
    if (!completionAnimations?.length || !animateValues) return;

    const minDelay = Math.min(...completionAnimations.map((a) => a.delay));
    waveGlow.value = withDelay(
      minDelay,
      withSequence(
        withTiming(1, timingConfigs.wave),
        withTiming(0, timingConfigs.waveFade),
      ),
    );
  }, [completionAnimations, animateValues]);


  const highlightColor = animateValues ? c.cellHighlighted : c.techniqueHighlight;
  const secondaryColor = animateValues ? `${colors.coral}26` : c.techniqueHighlightSecondary;

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundProgress.value,
      [0, 0.25, 0.4, 0.6, 1],
      [
        baseBackground,
        highlightColor,
        c.cellHighlighted,
        secondaryColor,
        c.cellSelected,
      ],
    );
    return { backgroundColor };
  });

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedWaveGlowStyle = useAnimatedStyle(() => ({
    opacity: waveGlow.value,
  }));

  const handlePress = onPress ? () => onPress(row, col) : undefined;

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={!onPress}
      style={[
        staticStyles.cell,
        { width: cellSize, height: cellSize },
        borderStyle,
      ]}
    >
      {/* Background layer */}
      <Animated.View style={[staticStyles.background, animatedBackgroundStyle]} />

      {/* Glow effect layer for correct answers */}
      {animateValues && <Animated.View style={[staticStyles.glow, animatedGlowStyle]} />}

      {/* Wave glow effect layer for completion animations */}
      {animateValues && <Animated.View style={[staticStyles.waveGlow, { backgroundColor: `${c.accent}4D` }, animatedWaveGlowStyle]} />}

      {/* Error background */}
      {!isValid && displayValue && <View style={staticStyles.errorBackground} />}

      {/* Content */}
      {displayValue ? (
        <Text
          style={[
            compact ? staticStyles.compactValue : staticStyles.value,
            isGiven ? staticStyles.givenValue : staticStyles.userValue,
            !isValid && staticStyles.errorValue,
            isHighlighted && !isSecondaryHighlight && { color: c.accent },
            isSecondaryHighlight && { color: c.coral },
          ]}
        >
          {displayValue}
        </Text>
      ) : notes.size > 0 ? (
        <NotesGrid notes={notes} cellSize={cellSize} />
      ) : null}
    </AnimatedPressable>
  );
});

const staticStyles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  waveGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  errorBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cellError,
  },
  value: {
    ...typography.cellValue,
  },
  compactValue: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  givenValue: {
    color: colors.givenText,
    fontFamily: fontFamilies.bold,
  },
  userValue: {
    color: colors.userEntryText,
    fontFamily: fontFamilies.medium,
  },
  errorValue: {
    color: colors.errorText,
  },
});

const noteStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 1,
  },
  note: {
    width: '33.33%',
    height: '33.33%',
    ...typography.cellNotes,
    color: colors.noteText,
  },
  noteHidden: {
    opacity: 0,
  },
});
