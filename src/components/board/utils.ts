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
