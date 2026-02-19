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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { springConfigs, timingConfigs, scales } from '../../theme/animations';
import type { CellAnimationState } from '../../engine/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Grid spans full screen width (edge-to-edge) for the main game
const BOARD_SIZE_PX = SCREEN_WIDTH;
export const CELL_SIZE = Math.floor((BOARD_SIZE_PX - 4) / 9);
export const COMPACT_CELL_SIZE = 36;

// ============================================
// Types
// ============================================

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

// ============================================
// Subcomponents
// ============================================

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

// ============================================
// Main Component
// ============================================

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

  // Determine border styling for 3x3 box separation
  const isRightBoxBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBoxBorder = (row + 1) % 3 === 0 && row < 8;

  // Base background color depends on checkerboard box
  const baseBackground = isInAltBox ? colors.cellBackgroundAlt : colors.cellBackground;

  // Update background animation when selection state changes
  useEffect(() => {
    if (isSecondaryHighlight) {
      // Secondary highlight (elimination) gets a distinct progress value
      backgroundProgress.value = animateValues
        ? withSpring(0.6, springConfigs.default)
        : 0.6;
    } else {
      const targetValue = isSelected ? 1 : isRelated ? 0.4 : isHighlighted ? 0.25 : 0;
      backgroundProgress.value = animateValues
        ? withSpring(targetValue, springConfigs.default)
        : targetValue;
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

    for (const anim of completionAnimations) {
      const timer = setTimeout(() => {
        // Brief orange glow overlay (no scale — avoids displacing cells and border artifacts)
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

  // Use higher-contrast highlights in technique mode (animateValues=false)
  const highlightColor = animateValues ? colors.cellHighlighted : colors.techniqueHighlight;
  const secondaryColor = animateValues ? 'rgba(255, 92, 80, 0.15)' : colors.techniqueHighlightSecondary;

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundProgress.value,
      [0, 0.25, 0.4, 0.6, 1],
      [
        baseBackground,
        highlightColor,
        colors.cellRelated,
        secondaryColor,
        colors.cellSelected,
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
        isRightBoxBorder && staticStyles.rightBoxBorder,
        isBottomBoxBorder && staticStyles.bottomBoxBorder,
        animatedContainerStyle,
      ]}
    >
      {/* Background layer */}
      <Animated.View style={[staticStyles.background, animatedBackgroundStyle]} />

      {/* Selection glow effect - soft peach glow */}
      {isSelected && <View style={staticStyles.selectionGlow} />}

      {/* Glow effect layer for correct answers */}
      {animateValues && <Animated.View style={[staticStyles.glow, animatedGlowStyle]} />}

      {/* Wave glow effect layer for completion animations */}
      {animateValues && <Animated.View style={[staticStyles.waveGlow, animatedWaveGlowStyle]} />}

      {/* Error background */}
      {!isValid && displayValue && <View style={staticStyles.errorBackground} />}

      {/* Content */}
      {displayValue ? (
        <Text
          style={[
            compact ? staticStyles.compactValue : staticStyles.value,
            isGiven ? staticStyles.givenValue : staticStyles.userValue,
            !isValid && staticStyles.errorValue,
            isHighlighted && !isSecondaryHighlight && staticStyles.highlightedValue,
            isSecondaryHighlight && staticStyles.secondaryValue,
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

// ============================================
// Styles
// ============================================

const staticStyles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gridLine,
    overflow: 'hidden',
  },
  rightBoxBorder: {
    borderRightWidth: 1.5,
    borderRightColor: colors.gridLineBold,
  },
  bottomBoxBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.gridLineBold,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cellSelectedGlow,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glowColor,
  },
  waveGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 107, 157, 0.30)', // softPink at 30% opacity
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
    fontFamily: 'Pally-Bold',
  },
  givenValue: {
    color: colors.givenText,
    fontFamily: 'Pally-Bold',
  },
  userValue: {
    color: colors.userEntryText,
    fontFamily: 'Pally-Medium',
  },
  errorValue: {
    color: colors.errorText,
  },
  highlightedValue: {
    color: colors.softPink,
  },
  secondaryValue: {
    color: '#FF5C50', // coral
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
