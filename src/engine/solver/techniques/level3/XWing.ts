// X-Wing - Level 3 Technique
// When a candidate appears in exactly two cells in each of two rows,
// and those cells are in the same two columns, the candidate can be
// eliminated from other cells in those columns (and vice versa for columns/rows).

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class XWing extends BaseTechnique {
  readonly name = 'X-Wing';
  readonly level: TechniqueLevel = 3;
  readonly description = 'Two rows have a candidate in exactly the same two columns';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check for row-based X-Wings (eliminate from columns)
    for (let candidate = 1; candidate <= 9; candidate++) {
      const rowResult = this.findRowXWing(grid, candidate);
      if (rowResult) return rowResult;

      const colResult = this.findColumnXWing(grid, candidate);
      if (colResult) return colResult;
    }

    return null;
  }

  private findRowXWing(
    grid: CandidateGridInterface,
    candidate: number
  ): TechniqueResult | null {
    // Find rows where the candidate appears in exactly 2 cells
    const rowsWithTwoCells: Array<{ row: number; cols: number[] }> = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: 'row', index: row },
        candidate
      );

      if (cellsWithCandidate.length === 2) {
        rowsWithTwoCells.push({
          row,
          cols: cellsWithCandidate.map((p) => p.col).sort((a, b) => a - b),
        });
      }
    }

    if (rowsWithTwoCells.length < 2) return null;

    // Check all pairs of such rows
    const rowPairs = combinations(rowsWithTwoCells, 2);

    for (const [rowInfo1, rowInfo2] of rowPairs) {
      // Check if they share the same columns
      if (
        rowInfo1.cols[0] !== rowInfo2.cols[0] ||
        rowInfo1.cols[1] !== rowInfo2.cols[1]
      ) {
        continue;
      }

      const col1 = rowInfo1.cols[0];
      const col2 = rowInfo1.cols[1];
      const row1 = rowInfo1.row;
      const row2 = rowInfo2.row;

      // Found an X-Wing pattern! Now find eliminations in the columns
      const xWingCells: Position[] = [
        { row: row1, col: col1 },
        { row: row1, col: col2 },
        { row: row2, col: col1 },
        { row: row2, col: col2 },
      ];

      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      // Eliminate from column 1 (except the X-Wing cells)
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (row === row1 || row === row2) continue;
        if (grid.isEmpty(row, col1) && grid.hasCandidate(row, col1, candidate)) {
          eliminations.push({
            position: { row, col: col1 },
            candidates: [candidate],
          });
        }
      }

      // Eliminate from column 2 (except the X-Wing cells)
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (row === row1 || row === row2) continue;
        if (grid.isEmpty(row, col2) && grid.hasCandidate(row, col2, candidate)) {
          eliminations.push({
            position: { row, col: col2 },
            candidates: [candidate],
          });
        }
      }

      if (eliminations.length > 0) {
        return this.createEliminationResult(
          eliminations,
          `X-Wing: ${candidate} in rows ${row1 + 1} and ${row2 + 1} aligns in columns ${col1 + 1} and ${col2 + 1}`,
          xWingCells
        );
      }
    }

    return null;
  }

  private findColumnXWing(
    grid: CandidateGridInterface,
    candidate: number
  ): TechniqueResult | null {
    // Find columns where the candidate appears in exactly 2 cells
    const colsWithTwoCells: Array<{ col: number; rows: number[] }> = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: 'column', index: col },
        candidate
      );

      if (cellsWithCandidate.length === 2) {
        colsWithTwoCells.push({
          col,
          rows: cellsWithCandidate.map((p) => p.row).sort((a, b) => a - b),
        });
      }
    }

    if (colsWithTwoCells.length < 2) return null;

    // Check all pairs of such columns
    const colPairs = combinations(colsWithTwoCells, 2);

    for (const [colInfo1, colInfo2] of colPairs) {
      // Check if they share the same rows
      if (
        colInfo1.rows[0] !== colInfo2.rows[0] ||
        colInfo1.rows[1] !== colInfo2.rows[1]
      ) {
        continue;
      }

      const row1 = colInfo1.rows[0];
      const row2 = colInfo1.rows[1];
      const col1 = colInfo1.col;
      const col2 = colInfo2.col;

      // Found an X-Wing pattern! Now find eliminations in the rows
      const xWingCells: Position[] = [
        { row: row1, col: col1 },
        { row: row1, col: col2 },
        { row: row2, col: col1 },
        { row: row2, col: col2 },
      ];

      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      // Eliminate from row 1 (except the X-Wing cells)
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (col === col1 || col === col2) continue;
        if (grid.isEmpty(row1, col) && grid.hasCandidate(row1, col, candidate)) {
          eliminations.push({
            position: { row: row1, col },
            candidates: [candidate],
          });
        }
      }

      // Eliminate from row 2 (except the X-Wing cells)
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (col === col1 || col === col2) continue;
        if (grid.isEmpty(row2, col) && grid.hasCandidate(row2, col, candidate)) {
          eliminations.push({
            position: { row: row2, col },
            candidates: [candidate],
          });
        }
      }

      if (eliminations.length > 0) {
        return this.createEliminationResult(
          eliminations,
          `X-Wing: ${candidate} in columns ${col1 + 1} and ${col2 + 1} aligns in rows ${row1 + 1} and ${row2 + 1}`,
          xWingCells
        );
      }
    }

    return null;
  }
}
