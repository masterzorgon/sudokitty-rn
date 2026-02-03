// Individual Sudoku cell component with animations
// Redesigned: soft checkerboard tinting, improved selection states, warm typography

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
import { springConfigs, timingConfigs, scales } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Grid spans full screen width (edge-to-edge)
const BOARD_SIZE_PX = SCREEN_WIDTH;
export const CELL_SIZE = Math.floor((BOARD_SIZE_PX - 4) / 9); // Minimal grid spacing

interface SudokuCellProps {
  cell: Cell;
  isSelected: boolean;
  isRelated: boolean;
  isHighlighted: boolean;
  isInAltBox: boolean;
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
  isInAltBox,
  onPress,
}: SudokuCellProps) => {
  const { row, col, value, isGiven, isValid, notes } = cell;

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const backgroundProgress = useSharedValue(0);
  const errorShake = useSharedValue(0);

  // Determine border styling for 3x3 box separation - softer "quilted" feel
  const isRightBoxBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBoxBorder = (row + 1) % 3 === 0 && row < 8;

  // Base background color depends on checkerboard box
  const baseBackground = isInAltBox ? colors.cellBackgroundAlt : colors.cellBackground;

  // Update background animation when selection state changes
  useEffect(() => {
    const targetValue = isSelected ? 1 : isRelated ? 0.4 : isHighlighted ? 0.25 : 0;
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
      // Trigger pop-in animation: shrink → overshoot → settle
      scale.value = withSequence(
        withSpring(scales.popShrink, springConfigs.popShrink),    // Quick shrink (0.8)
        withSpring(scales.popOvershoot, springConfigs.bouncy),    // Overshoot (1.1)
        withSpring(1, springConfigs.gentle)                        // Settle to normal
      );
    }
  }, [value, isValid]);

  // Trigger shake on incorrect input
  useEffect(() => {
    if (value && !isGiven && !isValid) {
      errorShake.value = withSequence(
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(0, { duration: 40 })
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
      [0, 0.25, 0.4, 1],
      [
        baseBackground,
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

      {/* Selection glow effect - soft peach glow */}
      {isSelected && <View style={styles.selectionGlow} />}

      {/* Glow effect layer for correct answers */}
      <Animated.View style={[styles.glow, animatedGlowStyle]} />

      {/* Error background - softer */}
      {!isValid && value && (
        <View style={styles.errorBackground} />
      )}

      {/* Content */}
      {value ? (
        <Text
          style={[
            styles.value,
            isGiven ? styles.givenValue : styles.userValue,
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
    // Hairline borders in warm gray
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gridLine,
    overflow: 'hidden',
  },
  rightBoxBorder: {
    // Softer box border - "quilted" not "caged"
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
  errorBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cellError,
  },
  value: {
    ...typography.cellValue,
  },
  givenValue: {
    // Darker, more "printed" feel - confident and sturdy
    color: colors.givenText,
    fontWeight: '700',
  },
  userValue: {
    // Softer, warmer - feels "hand-placed"
    color: colors.userEntryText,
    fontWeight: '500',
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
