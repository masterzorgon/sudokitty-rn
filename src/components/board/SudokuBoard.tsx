// 9x9 Sudoku grid container
// Props-driven: works for both the main game and technique practice.
// The game screen passes data via the useGameBoardProps() hook.
// The technique screen passes data directly from puzzle state.

import React, { useCallback, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SudokuCell } from './SudokuCell';
import { colors } from '../../theme/colors';
import { startGameAnimations } from '../../theme/animations';
import { BOARD_SIZE, Position, positionKey, CellAnimationState } from '../../engine/types';

// ============================================
// Types
// ============================================

/** Lightweight cell data that both game and technique screens can provide. */
export interface SudokuCellData {
  value: number | null;
  isGiven: boolean;
  isValid: boolean;
  notes: Set<number>;
}

export interface SudokuBoardProps {
  /** 9x9 grid of cell data */
  cells: SudokuCellData[][];
  /** Currently selected cell position */
  selectedCell?: Position | null;
  /** Primary highlight set (orange) — technique pattern cells or game number-highlights */
  highlightedCells?: Set<string>;
  /** Secondary highlight set (coral) — elimination target cells in technique practice */
  secondaryHighlightedCells?: Set<string>;
  /** Related cells (row/col/box peers of selected cell) */
  relatedCells?: Set<string>;
  /** Number-based highlighting: all cells with this value get highlighted */
  highlightedNumber?: number | null;
  /** Cell press handler */
  onCellPress?: (row: number, col: number) => void;
  /** Whether cells are interactive (pressable) */
  interactive?: boolean;
  /** Animate board entrance with fade-in */
  animateEntrance?: boolean;
  /** Animate cell values with pop/shake/glow (game mode) */
  animateValues?: boolean;
  /** Use smaller cell size for technique practice */
  compact?: boolean;
  /** Show checkerboard box tinting */
  showBoxTinting?: boolean;
  /** Active completion animations per cell (keyed by position key) */
  activeAnimations?: Map<string, CellAnimationState[]>;
}

// ============================================
// Helpers
// ============================================

/** Boxes 1, 3, 5, 7 get alt background (checkerboard pattern) */
const isAltBox = (boxIndex: number): boolean => boxIndex % 2 === 1;

// ============================================
// Component
// ============================================

export const SudokuBoard = memo(({
  cells,
  selectedCell,
  highlightedCells,
  secondaryHighlightedCells,
  relatedCells,
  highlightedNumber,
  onCellPress,
  interactive = true,
  animateEntrance = false,
  animateValues = true,
  compact = false,
  showBoxTinting = true,
  activeAnimations,
}: SudokuBoardProps) => {
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      onCellPress?.(row, col);
    },
    [onCellPress],
  );

  return (
    <Animated.View
      entering={
        animateEntrance
          ? FadeIn.duration(startGameAnimations.boardContainerFadeIn.duration)
          : undefined
      }
      style={styles.container}
    >
      <View style={compact ? styles.cardOuterCompact : styles.cardOuter}>
        <View style={compact ? styles.cardCompact : styles.card}>
          <View style={styles.board}>
            {Array.from({ length: BOARD_SIZE }, (_, row) => (
              <View key={row} style={styles.row}>
                {Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const cellData = cells[row][col];
                  const key = positionKey({ row, col });

                  const isSelected =
                    selectedCell?.row === row && selectedCell?.col === col;
                  const isRelated = relatedCells?.has(key) ?? false;
                  const isPrimaryHighlight = highlightedCells?.has(key) ?? false;
                  const isSecondaryHighlight =
                    secondaryHighlightedCells?.has(key) ?? false;
                  const isNumberHighlighted =
                    highlightedNumber != null &&
                    cellData.value === highlightedNumber;
                  const isHighlighted = isPrimaryHighlight || isNumberHighlighted;

                  const boxRow = Math.floor(row / 3);
                  const boxCol = Math.floor(col / 3);
                  const boxIndex = boxRow * 3 + boxCol;
                  const isInAltBox = showBoxTinting && isAltBox(boxIndex);

                  const cellDelay =
                    (row + col) * startGameAnimations.cellCascade.delayPerCell;

                  const cellAnimations = activeAnimations?.get(key);

                  const cellContent = (
                    <SudokuCell
                      key={`${row}-${col}`}
                      row={row}
                      col={col}
                      value={cellData.value}
                      isGiven={cellData.isGiven}
                      isValid={cellData.isValid}
                      notes={cellData.notes}
                      isSelected={isSelected}
                      isRelated={isRelated}
                      isHighlighted={isHighlighted}
                      isSecondaryHighlight={isSecondaryHighlight}
                      isInAltBox={isInAltBox}
                      onPress={interactive ? handleCellPress : undefined}
                      animateValues={animateValues}
                      compact={compact}
                      completionAnimations={cellAnimations}
                    />
                  );

                  if (animateEntrance) {
                    return (
                      <Animated.View
                        key={`${row}-${col}`}
                        entering={FadeIn.delay(cellDelay).duration(
                          startGameAnimations.cellCascade.duration,
                        )}
                      >
                        {cellContent}
                      </Animated.View>
                    );
                  }

                  return cellContent;
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
  },
  cardOuter: {
    // borderWidth: 1,
    borderColor: colors.gridLineBold,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
  },
  card: {
    backgroundColor: colors.boardBackground,
  },
  cardOuterCompact: {},
  cardCompact: {
    backgroundColor: colors.boardBackground,
    borderWidth: 2,
    borderColor: colors.boxBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  board: {
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
  },
});
