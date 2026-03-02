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
): { box: SudokuCellData[][]; localRow: number; localCol: number; startRow: number; startCol: number } {
  const startRow = Math.floor(targetRow / 3) * 3;
  const startCol = Math.floor(targetCol / 3) * 3;
  const box = Array.from({ length: 3 }, (_, r) =>
    cells[startRow + r].slice(startCol, startCol + 3),
  );
  return {
    box,
    localRow: targetRow - startRow,
    localCol: targetCol - startCol,
    startRow,
    startCol,
  };
}

/**
 * Extract the two 3-cell column bands outside the target cell's box.
 * Returns two 3×1 SudokuCellData[][] grids (compatible with MiniBoard) and
 * their absolute startRow so callers can resolve highlight positions.
 */
export function sliceColumn(
  cells: SudokuCellData[][],
  targetRow: number,
  targetCol: number,
): { cells: SudokuCellData[][]; startRow: number }[] {
  const boxBand = Math.floor(targetRow / 3);
  return [0, 1, 2]
    .filter((b) => b !== boxBand)
    .map((band) => ({
      cells: Array.from({ length: 3 }, (_, r) => [cells[band * 3 + r][targetCol]]),
      startRow: band * 3,
    }));
}

/**
 * Extract the two 3-cell row segments outside the target cell's box.
 * Returns two 1×3 SudokuCellData[][] grids (compatible with MiniBoard) and
 * their absolute startCol so callers can resolve highlight positions.
 */
export function sliceRow(
  cells: SudokuCellData[][],
  targetRow: number,
  targetCol: number,
): { cells: SudokuCellData[][]; startCol: number }[] {
  const boxBand = Math.floor(targetCol / 3);
  return [0, 1, 2]
    .filter((b) => b !== boxBand)
    .map((band) => ({
      cells: [cells[targetRow].slice(band * 3, band * 3 + 3)],
      startCol: band * 3,
    }));
}
