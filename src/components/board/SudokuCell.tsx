// Individual Sudoku cell component with animations
// Matches iOS CellView.swift

import React, { useEffect, memo } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Cell } from '../../engine/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { springConfigs, timingConfigs } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;
export const CELL_SIZE = Math.floor((BOARD_SIZE - 8) / 9); // Account for grid spacing

interface SudokuCellProps {
  cell: Cell;
  isSelected: boolean;
  isRelated: boolean;
  isHighlighted: boolean;
  onPress: (row: number, col: number) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Notes grid component
const NotesGrid = memo(({ notes }: { notes: Set<number> }) => (
  <View style={styles.notesContainer}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
      <Text
        key={num}
        style={[styles.note, !notes.has(num) && styles.noteHidden]}
      >
        {num}
      </Text>
    ))}
  </View>
));

export const SudokuCell = memo(({
  cell,
  isSelected,
  isRelated,
  isHighlighted,
  onPress,
}: SudokuCellProps) => {
  const { row, col, value, isGiven, isValid, notes } = cell;

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const backgroundProgress = useSharedValue(0);
  const errorShake = useSharedValue(0);

  // Determine border styling for 3x3 box separation
  const isRightBoxBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBoxBorder = (row + 1) % 3 === 0 && row < 8;

  // Update background animation when selection state changes
  useEffect(() => {
    const targetValue = isSelected ? 1 : isRelated ? 0.5 : isHighlighted ? 0.3 : 0;
    backgroundProgress.value = withSpring(targetValue, springConfigs.default);
  }, [isSelected, isRelated, isHighlighted]);

  // Trigger glow effect on correct input
  useEffect(() => {
    if (value && !isGiven && isValid) {
      // Trigger glow animation
      glowOpacity.value = withSequence(
        withTiming(1, timingConfigs.glowIn),
        withTiming(0, timingConfigs.glowOut)
      );
      // Trigger scale bounce
      scale.value = withSequence(
        withSpring(1.1, springConfigs.bouncy),
        withSpring(1, springConfigs.default)
      );
    }
  }, [value, isValid]);

  // Trigger shake on incorrect input
  useEffect(() => {
    if (value && !isGiven && !isValid) {
      errorShake.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isValid]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: errorShake.value },
    ],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundProgress.value,
      [0, 0.3, 0.5, 1],
      [
        colors.cellBackground,
        colors.cellHighlighted,
        colors.cellRelated,
        colors.cellSelected,
      ]
    );
    return { backgroundColor };
  });

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => onPress(row, col);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.cell,
        isRightBoxBorder && styles.rightBoxBorder,
        isBottomBoxBorder && styles.bottomBoxBorder,
        animatedContainerStyle,
      ]}
    >
      {/* Background layer */}
      <Animated.View style={[styles.background, animatedBackgroundStyle]} />

      {/* Glow effect layer */}
      <Animated.View style={[styles.glow, animatedGlowStyle]} />

      {/* Error background */}
      {!isValid && value && (
        <View style={styles.errorBackground} />
      )}

      {/* Content */}
      {value ? (
        <Text
          style={[
            styles.value,
            isGiven && styles.givenValue,
            !isValid && styles.errorValue,
          ]}
        >
          {value}
        </Text>
      ) : notes.size > 0 ? (
        <NotesGrid notes={notes} />
      ) : null}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.gridLine,
    overflow: 'hidden',
  },
  rightBoxBorder: {
    borderRightWidth: 2,
    borderRightColor: colors.boxBorder,
  },
  bottomBoxBorder: {
    borderBottomWidth: 2,
    borderBottomColor: colors.boxBorder,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glowColor,
  },
  errorBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cellError,
  },
  value: {
    ...typography.cellValue,
    color: colors.textPrimary,
  },
  givenValue: {
    color: colors.givenText,
    fontWeight: '600',
  },
  errorValue: {
    color: colors.errorText,
  },
  notesContainer: {
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
    lineHeight: CELL_SIZE / 3 - 1,
  },
  noteHidden: {
    opacity: 0,
  },
});
