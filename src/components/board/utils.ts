// Board utility functions

import type { SudokuCellData } from './SudokuBoard';

const EMPTY_NOTES = new Set<number>();

/**
 * Convert a raw number[][] puzzle grid to SudokuCellData[][] for the board.
 * Used by the technique practice screen which works with number[][] instead of Cell[][].
 *
 * - 0 is treated as empty (value = null)
 * - All non-zero cells are treated as givens
 * - All cells are valid (no error state in practice mode)
 * - No notes (practice mode doesn't use pencil marks)
 */
export function puzzleToCellData(puzzle: number[][]): SudokuCellData[][] {
  return puzzle.map((row) =>
    row.map((value) => ({
      value: value === 0 ? null : value,
      isGiven: value !== 0,
      isValid: true,
      notes: EMPTY_NOTES,
    })),
  );
}

/**
 * Slice the 3x3 box containing a target cell out of a full 9x9 SudokuCellData grid.
 * Returns the 3x3 slice and the target cell's local coordinates within it.
 */
export function sliceBox(
  cells: SudokuCellData[][],
  targetRow: number,
  targetCol: number,
): { box: SudokuCellData[][]; localRow: number; localCol: number } {
  const startRow = Math.floor(targetRow / 3) * 3;
  const startCol = Math.floor(targetCol / 3) * 3;
  const box = Array.from({ length: 3 }, (_, r) =>
    cells[startRow + r].slice(startCol, startCol + 3),
  );
  return {
    box,
    localRow: targetRow - startRow,
    localCol: targetCol - startCol,
  };
}
