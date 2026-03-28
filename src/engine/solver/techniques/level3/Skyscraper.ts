// Skyscraper - Level 3 Single Digit Pattern
// Two rows (or columns) each have a candidate in exactly 2 cells (conjugate pairs).
// The pairs share exactly one column (or row) — the "base."
// The two cells NOT in the shared column are the "endpoints."
// Any cell that sees BOTH endpoints and has the candidate can have it eliminated.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, combinations } from "../Technique";

export class Skyscraper extends BaseTechnique {
  readonly name = "Skyscraper";
  readonly level: TechniqueLevel = 3;
  readonly description =
    "Two conjugate pairs sharing one column, with endpoints that force eliminations";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const rowResult = this.findRowSkyscraper(grid, candidate);
      if (rowResult) return rowResult;

      const colResult = this.findColumnSkyscraper(grid, candidate);
      if (colResult) return colResult;
    }

    return null;
  }

  private findRowSkyscraper(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find rows where the candidate appears in exactly 2 cells (conjugate pairs)
    const conjugatePairs: { row: number; cols: [number, number] }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const cells = grid.findCellsWithCandidate({ type: "row", index: row }, candidate);
      if (cells.length === 2) {
        conjugatePairs.push({
          row,
          cols: [cells[0].col, cells[1].col],
        });
      }
    }

    if (conjugatePairs.length < 2) return null;

    // Check all pairs of conjugate pairs
    const pairs = combinations(conjugatePairs, 2);

    for (const [pair1, pair2] of pairs) {
      // Check if they share exactly ONE column (not both — that would be an X-Wing)
      const shared: number[] = [];
      const endpoints: Position[] = [];

      for (const c1 of pair1.cols) {
        for (const c2 of pair2.cols) {
          if (c1 === c2) {
            shared.push(c1);
          }
        }
      }

      if (shared.length !== 1) continue;

      const sharedCol = shared[0];

      // Find the endpoint from each pair (the cell NOT in the shared column)
      const endpoint1Col = pair1.cols[0] === sharedCol ? pair1.cols[1] : pair1.cols[0];
      const endpoint2Col = pair2.cols[0] === sharedCol ? pair2.cols[1] : pair2.cols[0];

      const endpoint1: Position = { row: pair1.row, col: endpoint1Col };
      const endpoint2: Position = { row: pair2.row, col: endpoint2Col };

      // The endpoints must be in the same band (top 3 rows, middle 3, bottom 3)
      // or at least be able to see common cells for eliminations to happen.
      // Find cells that can see BOTH endpoints and have the candidate.
      const eliminations: { position: Position; candidates: number[] }[] = [];

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (row === endpoint1.row && col === endpoint1.col) continue;
          if (row === endpoint2.row && col === endpoint2.col) continue;
          if (!grid.isEmpty(row, col)) continue;
          if (!grid.hasCandidate(row, col, candidate)) continue;

          // Check if this cell sees both endpoints
          if (this.sees(row, col, endpoint1, grid) && this.sees(row, col, endpoint2, grid)) {
            eliminations.push({
              position: { row, col },
              candidates: [candidate],
            });
          }
        }
      }

      if (eliminations.length > 0) {
        const baseCells: Position[] = [
          { row: pair1.row, col: sharedCol },
          { row: pair2.row, col: sharedCol },
        ];

        const highlightCells: Position[] = [
          { row: pair1.row, col: pair1.cols[0] },
          { row: pair1.row, col: pair1.cols[1] },
          { row: pair2.row, col: pair2.cols[0] },
          { row: pair2.row, col: pair2.cols[1] },
        ];

        return this.createEliminationResult(
          eliminations,
          `Skyscraper: ${candidate} in rows ${pair1.row + 1} and ${pair2.row + 1} connected by column ${sharedCol + 1}`,
          highlightCells,
        );
      }
    }

    return null;
  }

  private findColumnSkyscraper(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find columns where the candidate appears in exactly 2 cells (conjugate pairs)
    const conjugatePairs: { col: number; rows: [number, number] }[] = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      const cells = grid.findCellsWithCandidate({ type: "column", index: col }, candidate);
      if (cells.length === 2) {
        conjugatePairs.push({
          col,
          rows: [cells[0].row, cells[1].row],
        });
      }
    }

    if (conjugatePairs.length < 2) return null;

    const pairs = combinations(conjugatePairs, 2);

    for (const [pair1, pair2] of pairs) {
      const shared: number[] = [];

      for (const r1 of pair1.rows) {
        for (const r2 of pair2.rows) {
          if (r1 === r2) {
            shared.push(r1);
          }
        }
      }

      if (shared.length !== 1) continue;

      const sharedRow = shared[0];

      const endpoint1Row = pair1.rows[0] === sharedRow ? pair1.rows[1] : pair1.rows[0];
      const endpoint2Row = pair2.rows[0] === sharedRow ? pair2.rows[1] : pair2.rows[0];

      const endpoint1: Position = { row: endpoint1Row, col: pair1.col };
      const endpoint2: Position = { row: endpoint2Row, col: pair2.col };

      const eliminations: { position: Position; candidates: number[] }[] = [];

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (row === endpoint1.row && col === endpoint1.col) continue;
          if (row === endpoint2.row && col === endpoint2.col) continue;
          if (!grid.isEmpty(row, col)) continue;
          if (!grid.hasCandidate(row, col, candidate)) continue;

          if (this.sees(row, col, endpoint1, grid) && this.sees(row, col, endpoint2, grid)) {
            eliminations.push({
              position: { row, col },
              candidates: [candidate],
            });
          }
        }
      }

      if (eliminations.length > 0) {
        const highlightCells: Position[] = [
          { row: pair1.rows[0], col: pair1.col },
          { row: pair1.rows[1], col: pair1.col },
          { row: pair2.rows[0], col: pair2.col },
          { row: pair2.rows[1], col: pair2.col },
        ];

        return this.createEliminationResult(
          eliminations,
          `Skyscraper: ${candidate} in columns ${pair1.col + 1} and ${pair2.col + 1} connected by row ${sharedRow + 1}`,
          highlightCells,
        );
      }
    }

    return null;
  }

  /** Check if cell at (row, col) sees the target position (same row, column, or box). */
  private sees(row: number, col: number, target: Position, grid: CandidateGridInterface): boolean {
    if (row === target.row) return true;
    if (col === target.col) return true;
    if (grid.getBoxIndex(row, col) === grid.getBoxIndex(target.row, target.col)) return true;
    return false;
  }
}
