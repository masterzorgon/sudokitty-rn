// 9x9 Sudoku grid container
// Redesigned: soft dimensional card with warm shadow

import React, { useCallback, memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SudokuCell, CELL_SIZE } from './SudokuCell';
import { useGameStore, useRelatedCells } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme';
import { startGameAnimations } from '../../theme/animations';
import { BOARD_SIZE } from '../../engine/types';
import { positionKey } from '../../engine/types';

// Helper to determine if a box should have alt background (checkerboard pattern)
// Boxes are numbered 0-8, left to right, top to bottom
// Pattern: boxes 1, 3, 5, 7 get alt background (center cross + corners alternate)
const isAltBox = (boxIndex: number): boolean => {
  return boxIndex % 2 === 1;
};

interface SudokuBoardProps {
  animateEntrance?: boolean;
}

export const SudokuBoard = memo(({ animateEntrance = false }: SudokuBoardProps) => {
  const board = useGameStore((s) => s.board);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const selectCell = useGameStore((s) => s.selectCell);
  const relatedCells = useRelatedCells();

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      selectCell({ row, col });
    },
    [selectCell]
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
      {/* Outer card with warm shadow */}
      <View style={styles.cardOuter}>
        <View style={styles.card}>
          <View style={styles.board}>
            {Array.from({ length: BOARD_SIZE }, (_, row) => (
              <View key={row} style={styles.row}>
                {Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const cell = board[row][col];
                  const isSelected =
                    selectedCell?.row === row && selectedCell?.col === col;
                  const isRelated = relatedCells.has(positionKey({ row, col }));
                  const isHighlighted =
                    highlightedNumber !== null && cell.value === highlightedNumber;

                  // Determine which 3x3 box this cell belongs to
                  const boxRow = Math.floor(row / 3);
                  const boxCol = Math.floor(col / 3);
                  const boxIndex = boxRow * 3 + boxCol;
                  const isInAltBox = isAltBox(boxIndex);

                  // Calculate staggered delay for cascade effect
                  const cellDelay =
                    (row + col) * startGameAnimations.cellCascade.delayPerCell;

                  const cellContent = (
                    <SudokuCell
                      key={`${row}-${col}`}
                      cell={cell}
                      isSelected={isSelected}
                      isRelated={isRelated}
                      isHighlighted={isHighlighted}
                      isInAltBox={isInAltBox}
                      onPress={handleCellPress}
                    />
                  );

                  // Wrap in Animated.View for cascade effect when animating
                  if (animateEntrance) {
                    return (
                      <Animated.View
                        key={`${row}-${col}`}
                        entering={FadeIn.delay(cellDelay).duration(
                          startGameAnimations.cellCascade.duration
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

const BOARD_WIDTH = CELL_SIZE * 9;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // No padding - grid spans edge-to-edge
  },
  cardOuter: {
    // No rounded corners - edge-to-edge
    // Warm shadow - subtle y-offset, low blur
    shadowColor: colors.boardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    backgroundColor: colors.boardBackground,
    padding: 2,
    // Inner subtle border
    borderWidth: 1,
    borderColor: colors.gridLineBold,
  },
  board: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
