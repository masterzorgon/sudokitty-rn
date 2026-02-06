// Jellyfish - Level 4 Technique
// A generalization of Swordfish to four rows/columns.
// When a candidate appears in 2-4 cells in each of four rows,
// and those cells occupy exactly four columns, the candidate can be
// eliminated from other cells in those columns (and vice versa).

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class Jellyfish extends BaseTechnique {
  readonly name = 'Jellyfish';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Four rows have a candidate in exactly the same four columns';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const rowResult = this.findRowJellyfish(grid, candidate);
      if (rowResult) return rowResult;

      const colResult = this.findColumnJellyfish(grid, candidate);
      if (colResult) return colResult;
    }

    return null;
  }

  private findRowJellyfish(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find rows where the candidate appears in 2-4 cells
    const eligibleRows: Array<{ row: number; cols: Set<number> }> = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: 'row', index: row },
        candidate,
      );

      if (cellsWithCandidate.length >= 2 && cellsWithCandidate.length <= 4) {
        eligibleRows.push({
          row,
          cols: new Set(cellsWithCandidate.map((p) => p.col)),
        });
      }
    }

    if (eligibleRows.length < 4) return null;

    // Check all combinations of 4 rows
    const rowQuads = combinations(eligibleRows, 4);

    for (const [r1, r2, r3, r4] of rowQuads) {
      // Union of all columns
      const allCols = new Set([...r1.cols, ...r2.cols, ...r3.cols, ...r4.cols]);

      // For Jellyfish, the union must have exactly 4 columns
      if (allCols.size !== 4) continue;

      const rows = [r1.row, r2.row, r3.row, r4.row];
      const cols = [...allCols].sort((a, b) => a - b);

      // Found a Jellyfish pattern! Collect pattern cells
      const patternCells: Position[] = [];
      for (const row of rows) {
        for (const col of cols) {
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            patternCells.push({ row, col });
          }
        }
      }

      // Find eliminations in the 4 columns (outside the pattern rows)
      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      for (const col of cols) {
        for (let row = 0; row < BOARD_SIZE; row++) {
          if (rows.includes(row)) continue;
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            eliminations.push({
              position: { row, col },
              candidates: [candidate],
            });
          }
        }
      }

      if (eliminations.length > 0) {
        return this.createEliminationResult(
          eliminations,
          `Jellyfish: ${candidate} in rows ${rows.map((r) => r + 1).join(', ')} aligns in columns ${cols.map((c) => c + 1).join(', ')}`,
          patternCells,
        );
      }
    }

    return null;
  }

  private findColumnJellyfish(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find columns where the candidate appears in 2-4 cells
    const eligibleCols: Array<{ col: number; rows: Set<number> }> = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: 'column', index: col },
        candidate,
      );

      if (cellsWithCandidate.length >= 2 && cellsWithCandidate.length <= 4) {
        eligibleCols.push({
          col,
          rows: new Set(cellsWithCandidate.map((p) => p.row)),
        });
      }
    }

    if (eligibleCols.length < 4) return null;

    // Check all combinations of 4 columns
    const colQuads = combinations(eligibleCols, 4);

    for (const [c1, c2, c3, c4] of colQuads) {
      // Union of all rows
      const allRows = new Set([...c1.rows, ...c2.rows, ...c3.rows, ...c4.rows]);

      // For Jellyfish, the union must have exactly 4 rows
      if (allRows.size !== 4) continue;

      const cols = [c1.col, c2.col, c3.col, c4.col];
      const rows = [...allRows].sort((a, b) => a - b);

      // Found a Jellyfish pattern! Collect pattern cells
      const patternCells: Position[] = [];
      for (const row of rows) {
        for (const col of cols) {
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            patternCells.push({ row, col });
          }
        }
      }

      // Find eliminations in the 4 rows (outside the pattern columns)
      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      for (const row of rows) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (cols.includes(col)) continue;
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            eliminations.push({
              position: { row, col },
              candidates: [candidate],
            });
          }
        }
      }

      if (eliminations.length > 0) {
        return this.createEliminationResult(
          eliminations,
          `Jellyfish: ${candidate} in columns ${cols.map((c) => c + 1).join(', ')} aligns in rows ${rows.map((r) => r + 1).join(', ')}`,
          patternCells,
        );
      }
    }

    return null;
  }
}
