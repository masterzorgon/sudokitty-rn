// Pointing Pair - Level 2 Technique
// When a candidate in a box appears only in cells that share a row or column,
// that candidate can be eliminated from other cells in that row or column.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class PointingPair extends BaseTechnique {
  readonly name = 'Pointing Pair';
  readonly level: TechniqueLevel = 2;
  readonly description = 'Candidates in a box aligned in a row/column eliminate from that row/column';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check each box
    for (let boxIndex = 0; boxIndex < BOARD_SIZE; boxIndex++) {
      // Check each candidate
      for (let candidate = 1; candidate <= 9; candidate++) {
        const result = this.findPointingPair(grid, boxIndex, candidate);
        if (result) return result;
      }
    }

    return null;
  }

  private findPointingPair(
    grid: CandidateGridInterface,
    boxIndex: number,
    candidate: number
  ): TechniqueResult | null {
    // Find all cells in this box that have this candidate
    const cellsWithCandidate = grid.findCellsWithCandidate(
      { type: 'box', index: boxIndex },
      candidate
    );

    // Need at least 2 cells to form a pointing pair
    if (cellsWithCandidate.length < 2 || cellsWithCandidate.length > 3) {
      return null;
    }

    // Check if all cells are in the same row
    const rows = new Set(cellsWithCandidate.map((p) => p.row));
    if (rows.size === 1) {
      const row = cellsWithCandidate[0].row;
      return this.eliminateFromRow(grid, cellsWithCandidate, row, candidate, boxIndex);
    }

    // Check if all cells are in the same column
    const cols = new Set(cellsWithCandidate.map((p) => p.col));
    if (cols.size === 1) {
      const col = cellsWithCandidate[0].col;
      return this.eliminateFromColumn(grid, cellsWithCandidate, col, candidate, boxIndex);
    }

    return null;
  }

  private eliminateFromRow(
    grid: CandidateGridInterface,
    pointingCells: Position[],
    row: number,
    candidate: number,
    boxIndex: number
  ): TechniqueResult | null {
    const eliminations: Array<{ position: Position; candidates: number[] }> = [];

    // Find cells in the same row but different box
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellBoxIndex = grid.getBoxIndex(row, col);
      if (cellBoxIndex === boxIndex) continue; // Skip cells in the same box

      if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
        eliminations.push({
          position: { row, col },
          candidates: [candidate],
        });
      }
    }

    if (eliminations.length > 0) {
      return this.createEliminationResult(
        eliminations,
        `${candidate} in box ${boxIndex + 1} is confined to row ${row + 1}, eliminating from rest of row`,
        pointingCells
      );
    }

    return null;
  }

  private eliminateFromColumn(
    grid: CandidateGridInterface,
    pointingCells: Position[],
    col: number,
    candidate: number,
    boxIndex: number
  ): TechniqueResult | null {
    const eliminations: Array<{ position: Position; candidates: number[] }> = [];

    // Find cells in the same column but different box
    for (let row = 0; row < BOARD_SIZE; row++) {
      const cellBoxIndex = grid.getBoxIndex(row, col);
      if (cellBoxIndex === boxIndex) continue; // Skip cells in the same box

      if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
        eliminations.push({
          position: { row, col },
          candidates: [candidate],
        });
      }
    }

    if (eliminations.length > 0) {
      return this.createEliminationResult(
        eliminations,
        `${candidate} in box ${boxIndex + 1} is confined to column ${col + 1}, eliminating from rest of column`,
        pointingCells
      );
    }

    return null;
  }
}
