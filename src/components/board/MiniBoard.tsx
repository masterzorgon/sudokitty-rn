// MiniBoard — renders a small NxN grid of SudokuCells in compact, static mode.
// Used by HintModal to preview the 3x3 box containing the hinted cell.

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { SudokuCell, COMPACT_CELL_SIZE } from './SudokuCell';
import type { SudokuCellData } from './SudokuBoard';

export interface MiniBoardProps {
  cells: SudokuCellData[][];
  /** Local coordinates (within this slice) of the cell to highlight */
  highlightCell?: { row: number; col: number };
}

export function MiniBoard({ cells, highlightCell }: MiniBoardProps) {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const boardSize = COMPACT_CELL_SIZE * cols;

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize }]}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: cols }, (_, col) => {
            const cell = cells[row][col];
            const isHighlighted =
              highlightCell?.row === row && highlightCell?.col === col;

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
                isSecondaryHighlight={false}
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
