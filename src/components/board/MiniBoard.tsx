// MiniBoard — renders a small NxN grid of SudokuCells in compact, static mode.
// Used by HintModal to preview the 3x3 box containing the hinted cell.

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { SudokuCell, COMPACT_CELL_SIZE } from './SudokuCell';
import type { SudokuCellData } from './SudokuBoard';

export interface MiniBoardProps {
  cells: SudokuCellData[][];
  /** Local coordinates (within this slice) of the primary-highlighted cell */
  highlightCell?: { row: number; col: number };
  /** Absolute board positions (positionKey format "row-col") to secondary-highlight */
  highlightSet?: Set<string>;
  /** Absolute board position of cells[0][0]; required for highlightSet lookups */
  offset?: { row: number; col: number };
}

export function MiniBoard({ cells, highlightCell, highlightSet, offset }: MiniBoardProps) {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const boardWidth = COMPACT_CELL_SIZE * cols;
  const boardHeight = COMPACT_CELL_SIZE * rows;

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: cols }, (_, col) => {
            const cell = cells[row][col];
            const isHighlighted =
              highlightCell?.row === row && highlightCell?.col === col;
            const absRow = (offset?.row ?? 0) + row;
            const absCol = (offset?.col ?? 0) + col;
            const isSecondary = highlightSet
              ? highlightSet.has(`${absRow}-${absCol}`)
              : false;

            return (
              <SudokuCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={cell.value}
                isGiven={cell.isGiven}
                isValid={cell.isValid}
                notes={cell.notes}
                isSelected={false}
                isRelated={false}
                isHighlighted={isHighlighted}
                isSecondaryHighlight={isSecondary}
                isInAltBox={false}
                compact
                animateValues={false}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 1.5,
    borderColor: colors.gridLineBold,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
