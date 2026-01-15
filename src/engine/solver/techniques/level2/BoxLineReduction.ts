// Box/Line Reduction - Level 2 Technique
// When a candidate in a row or column is confined to a single box,
// that candidate can be eliminated from other cells in that box.
// (This is the inverse of Pointing Pair)

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE, BOX_SIZE } from '../../../types';

export class BoxLineReduction extends BaseTechnique {
  readonly name = 'Box/Line Reduction';
  readonly level: TechniqueLevel = 2;
  readonly description = 'Candidates in a row/column confined to one box eliminate from that box';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check each row
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let candidate = 1; candidate <= 9; candidate++) {
        const result = this.checkRow(grid, row, candidate);
        if (result) return result;
      }
    }

    // Check each column
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let candidate = 1; candidate <= 9; candidate++) {
        const result = this.checkColumn(grid, col, candidate);
        if (result) return result;
      }
    }

    return null;
  }

  private checkRow(
    grid: CandidateGridInterface,
    row: number,
    candidate: number
  ): TechniqueResult | null {
    // Find all cells in this row that have this candidate
    const cellsWithCandidate = grid.findCellsWithCandidate(
      { type: 'row', index: row },
      candidate
    );

    if (cellsWithCandidate.length < 2 || cellsWithCandidate.length > 3) {
      return null;
    }

    // Check if all cells are in the same box
    const boxes = new Set(cellsWithCandidate.map((p) => grid.getBoxIndex(p.row, p.col)));
    if (boxes.size !== 1) return null;

    const boxIndex = [...boxes][0];
    return this.eliminateFromBox(grid, cellsWithCandidate, boxIndex, candidate, 'row', row);
  }

  private checkColumn(
    grid: CandidateGridInterface,
    col: number,
    candidate: number
  ): TechniqueResult | null {
    // Find all cells in this column that have this candidate
    const cellsWithCandidate = grid.findCellsWithCandidate(
      { type: 'column', index: col },
      candidate
    );

    if (cellsWithCandidate.length < 2 || cellsWithCandidate.length > 3) {
      return null;
    }

    // Check if all cells are in the same box
    const boxes = new Set(cellsWithCandidate.map((p) => grid.getBoxIndex(p.row, p.col)));
    if (boxes.size !== 1) return null;

    const boxIndex = [...boxes][0];
    return this.eliminateFromBox(grid, cellsWithCandidate, boxIndex, candidate, 'column', col);
  }

  private eliminateFromBox(
    grid: CandidateGridInterface,
    lineCells: Position[],
    boxIndex: number,
    candidate: number,
    lineType: 'row' | 'column',
    lineIndex: number
  ): TechniqueResult | null {
    const eliminations: Array<{ position: Position; candidates: number[] }> = [];

    // Get all cells in the box
    const boxStartRow = Math.floor(boxIndex / 3) * BOX_SIZE;
    const boxStartCol = (boxIndex % 3) * BOX_SIZE;

    for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
      for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
        // Skip cells that are part of the line
        const isLineCell = lineCells.some((p) => p.row === r && p.col === c);
        if (isLineCell) continue;

        if (grid.isEmpty(r, c) && grid.hasCandidate(r, c, candidate)) {
          eliminations.push({
            position: { row: r, col: c },
            candidates: [candidate],
          });
        }
      }
    }

    if (eliminations.length > 0) {
      const lineName = lineType === 'row' ? `row ${lineIndex + 1}` : `column ${lineIndex + 1}`;
      return this.createEliminationResult(
        eliminations,
        `${candidate} in ${lineName} is confined to box ${boxIndex + 1}, eliminating from rest of box`,
        lineCells
      );
    }

    return null;
  }
}
