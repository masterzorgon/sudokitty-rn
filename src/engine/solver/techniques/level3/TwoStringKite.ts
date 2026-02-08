// 2-String Kite - Level 3 Single Digit Pattern
// A row conjugate pair and a column conjugate pair are connected when
// one cell from the row pair and one cell from the column pair share the same box.
// The two remaining cells (endpoints) force an elimination: any cell
// that sees both endpoints can have the candidate removed.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

interface ConjugatePair {
  unitType: 'row' | 'column';
  unitIndex: number;
  cells: [Position, Position];
}

export class TwoStringKite extends BaseTechnique {
  readonly name = '2-String Kite';
  readonly level: TechniqueLevel = 3;
  readonly description = 'Row and column conjugate pairs linked through a shared box';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findTwoStringKite(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findTwoStringKite(
    grid: CandidateGridInterface,
    candidate: number
  ): TechniqueResult | null {
    // Collect row conjugate pairs
    const rowPairs: ConjugatePair[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const cells = grid.findCellsWithCandidate({ type: 'row', index: row }, candidate);
      if (cells.length === 2) {
        rowPairs.push({
          unitType: 'row',
          unitIndex: row,
          cells: [cells[0], cells[1]],
        });
      }
    }

    // Collect column conjugate pairs
    const colPairs: ConjugatePair[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cells = grid.findCellsWithCandidate({ type: 'column', index: col }, candidate);
      if (cells.length === 2) {
        colPairs.push({
          unitType: 'column',
          unitIndex: col,
          cells: [cells[0], cells[1]],
        });
      }
    }

    // Try each combination of (row pair, column pair)
    for (const rowPair of rowPairs) {
      for (const colPair of colPairs) {
        // Check if one cell from row pair and one from col pair share a box
        for (let ri = 0; ri < 2; ri++) {
          for (let ci = 0; ci < 2; ci++) {
            const rowCell = rowPair.cells[ri];
            const colCell = colPair.cells[ci];

            // Skip if they are the same cell
            if (rowCell.row === colCell.row && rowCell.col === colCell.col) continue;

            // Check if they share a box (this is the connection)
            if (grid.getBoxIndex(rowCell.row, rowCell.col) !== grid.getBoxIndex(colCell.row, colCell.col)) {
              continue;
            }

            // The endpoints are the OTHER cells in each pair
            const rowEndpoint = rowPair.cells[1 - ri];
            const colEndpoint = colPair.cells[1 - ci];

            // Skip if the endpoints are the same cell
            if (rowEndpoint.row === colEndpoint.row && rowEndpoint.col === colEndpoint.col) continue;

            // Find eliminations: cells that see both endpoints and have the candidate
            const eliminations: Array<{ position: Position; candidates: number[] }> = [];

            for (let row = 0; row < BOARD_SIZE; row++) {
              for (let col = 0; col < BOARD_SIZE; col++) {
                // Skip the four kite cells themselves
                if (this.isPosition(row, col, rowPair.cells[0])) continue;
                if (this.isPosition(row, col, rowPair.cells[1])) continue;
                if (this.isPosition(row, col, colPair.cells[0])) continue;
                if (this.isPosition(row, col, colPair.cells[1])) continue;

                if (!grid.isEmpty(row, col)) continue;
                if (!grid.hasCandidate(row, col, candidate)) continue;

                if (
                  this.sees(row, col, rowEndpoint, grid) &&
                  this.sees(row, col, colEndpoint, grid)
                ) {
                  eliminations.push({
                    position: { row, col },
                    candidates: [candidate],
                  });
                }
              }
            }

            if (eliminations.length > 0) {
              const highlightCells: Position[] = [
                rowPair.cells[0],
                rowPair.cells[1],
                colPair.cells[0],
                colPair.cells[1],
              ];

              return this.createEliminationResult(
                eliminations,
                `2-String Kite: ${candidate} in row ${rowPair.unitIndex + 1} and column ${colPair.unitIndex + 1} connected in box ${grid.getBoxIndex(rowCell.row, rowCell.col) + 1}`,
                highlightCells
              );
            }
          }
        }
      }
    }

    return null;
  }

  private isPosition(row: number, col: number, pos: Position): boolean {
    return row === pos.row && col === pos.col;
  }

  private sees(row: number, col: number, target: Position, grid: CandidateGridInterface): boolean {
    if (row === target.row) return true;
    if (col === target.col) return true;
    if (grid.getBoxIndex(row, col) === grid.getBoxIndex(target.row, target.col)) return true;
    return false;
  }
}
