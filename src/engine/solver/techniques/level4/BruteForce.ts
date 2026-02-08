// Brute Force - Level 4 Last Resort Technique
//
// Absolute last resort: pick the empty cell with fewest candidates,
// try each value, and check if the puzzle is solvable via recursive
// backtracking. Returns a single placement.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class BruteForce extends BaseTechnique {
  readonly name = 'Brute Force';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Trial and error — try a value and backtrack if it fails';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Find the empty cell with the fewest candidates (MRV heuristic)
    let bestCell: Position | null = null;
    let bestCount = 10;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const count = grid.getCandidateCount(row, col);
        if (count < bestCount && count > 0) {
          bestCount = count;
          bestCell = { row, col };
        }
      }
    }

    if (!bestCell) return null; // No empty cells

    // Clone grid state into mutable arrays
    const values: (number | null)[][] = [];
    const candidates: Set<number>[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      values[r] = [];
      candidates[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        values[r][c] = grid.getValue(r, c);
        candidates[r][c] = new Set(grid.getCandidates(r, c));
      }
    }

    // Try each candidate in the best cell
    const cellCandidates = Array.from(grid.getCandidates(bestCell.row, bestCell.col));

    for (const value of cellCandidates) {
      // Clone state
      const testValues = values.map((row) => [...row]);
      const testCandidates = candidates.map((row) => row.map((s) => new Set(s)));

      // Place value
      testValues[bestCell.row][bestCell.col] = value;
      testCandidates[bestCell.row][bestCell.col].clear();

      // Eliminate from peers
      this.eliminateFromPeers(testValues, testCandidates, bestCell.row, bestCell.col, value);

      // Check if solvable
      if (this.solve(testValues, testCandidates)) {
        return this.createPlacementResult(
          bestCell,
          value,
          `Brute Force: ${value} in ${this.formatPosition(bestCell)} (trial and error)`,
          [bestCell]
        );
      }
    }

    return null;
  }

  private eliminateFromPeers(
    values: (number | null)[][],
    candidates: Set<number>[][],
    row: number,
    col: number,
    value: number
  ): boolean {
    // Eliminate from same row, column, box
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c !== col) candidates[row][c].delete(value);
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (r !== row) candidates[r][col].delete(value);
    }
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if (r !== row || c !== col) candidates[r][c].delete(value);
      }
    }

    // Check for empty candidate sets (contradiction)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (values[r][c] === null && candidates[r][c].size === 0) return false;
      }
    }
    return true;
  }

  private solve(
    values: (number | null)[][],
    candidates: Set<number>[][]
  ): boolean {
    // Find the empty cell with fewest candidates
    let bestRow = -1;
    let bestCol = -1;
    let bestCount = 10;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (values[r][c] !== null) continue;
        const count = candidates[r][c].size;
        if (count === 0) return false; // Contradiction
        if (count < bestCount) {
          bestCount = count;
          bestRow = r;
          bestCol = c;
        }
      }
    }

    if (bestRow === -1) return true; // All cells filled — solved

    // Try each candidate
    for (const value of candidates[bestRow][bestCol]) {
      // Clone state
      const newValues = values.map((row) => [...row]);
      const newCandidates = candidates.map((row) => row.map((s) => new Set(s)));

      newValues[bestRow][bestCol] = value;
      newCandidates[bestRow][bestCol].clear();

      if (this.eliminateFromPeers(newValues, newCandidates, bestRow, bestCol, value)) {
        if (this.solve(newValues, newCandidates)) return true;
      }
    }

    return false;
  }
}
