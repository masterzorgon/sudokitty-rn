// 9x9 Sudoku grid container
// Matches iOS SudokuGridView.swift

import React, { useCallback, memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SudokuCell, CELL_SIZE } from './SudokuCell';
import { useGameStore, useRelatedCells } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { shadows, borderRadius } from '../../theme';
import { BOARD_SIZE } from '../../engine/types';
import { positionKey } from '../../engine/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;

export const SudokuBoard = memo(() => {
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
    <View style={styles.container}>
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

              return (
                <SudokuCell
                  key={`${row}-${col}`}
                  cell={cell}
                  isSelected={isSelected}
                  isRelated={isRelated}
                  isHighlighted={isHighlighted}
                  onPress={handleCellPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const BOARD_WIDTH = CELL_SIZE * 9 + 8; // 9 cells + box borders

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: BOARD_PADDING,
  },
  board: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.boxBorder,
    ...shadows.large,
  },
  row: {
    flexDirection: 'row',
  },
});
