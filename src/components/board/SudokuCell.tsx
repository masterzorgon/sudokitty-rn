// Individual Sudoku cell component with optional animations
// Props-driven: works for both the main game (full animations) and technique practice (static)

import React, { useEffect, useRef, memo } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { springConfigs, timingConfigs, scales } from '../../theme/animations';
import type { CellAnimationState } from '../../engine/types';

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
  completionAnimations,
}: SudokuCellProps) => {
  const c = useColors();
  const cellSize = compact ? COMPACT_CELL_SIZE : CELL_SIZE;
  const displayValue = value === 0 ? null : value;

  // Animation shared values (always created for hook consistency, but only driven when enabled)
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const backgroundProgress = useSharedValue(0);
  const errorShake = useSharedValue(0);

  // Wave completion animation shared values
  const waveGlow = useSharedValue(0);
  const waveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
      scale.value = withSequence(
        withSpring(scales.popShrink, springConfigs.popShrink),
        withSpring(scales.popOvershoot, springConfigs.bouncy),
        withSpring(1, springConfigs.gentle),
      );
    }
  }, [displayValue, isValid, animateValues]);

  // Trigger shake on incorrect input (game mode only)
  useEffect(() => {
    if (!animateValues) return;
    if (displayValue && !isGiven && !isValid) {
      errorShake.value = withSequence(
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [isValid, animateValues]);

  // Trigger completion wave animations (staggered per cell)
  useEffect(() => {
    // Clear previous wave timers
    waveTimersRef.current.forEach(clearTimeout);
    waveTimersRef.current = [];

    if (!completionAnimations?.length || !animateValues) return;

    // Cancel any in-flight pop/shake so only the glow runs during a completion wave
    scale.value = 1;
    errorShake.value = 0;

    for (const anim of completionAnimations) {
      const timer = setTimeout(() => {
        waveGlow.value = withSequence(
          withTiming(1, timingConfigs.wave),
          withTiming(0, timingConfigs.waveFade),
        );
      }, anim.delay);
      waveTimersRef.current.push(timer);
    }

    return () => {
      waveTimersRef.current.forEach(clearTimeout);
      waveTimersRef.current = [];
    };
  }, [completionAnimations, animateValues]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: errorShake.value },
    ],
  }));

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
        animatedContainerStyle,
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
