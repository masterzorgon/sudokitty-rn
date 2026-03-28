// Swordfish - Level 4 Technique
// A generalization of X-Wing to three rows/columns.
// When a candidate appears in 2-3 cells in each of three rows,
// and those cells occupy exactly three columns, the candidate can be
// eliminated from other cells in those columns (and vice versa).

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, combinations } from "../Technique";

export class Swordfish extends BaseTechnique {
  readonly name = "Swordfish";
  readonly level: TechniqueLevel = 4;
  readonly description = "Three rows have a candidate in exactly the same three columns";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check for row-based Swordfish (eliminate from columns)
    for (let candidate = 1; candidate <= 9; candidate++) {
      const rowResult = this.findRowSwordfish(grid, candidate);
      if (rowResult) return rowResult;

      const colResult = this.findColumnSwordfish(grid, candidate);
      if (colResult) return colResult;
    }

    return null;
  }

  private findRowSwordfish(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find rows where the candidate appears in 2-3 cells
    const eligibleRows: { row: number; cols: Set<number> }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: "row", index: row },
        candidate,
      );

      if (cellsWithCandidate.length >= 2 && cellsWithCandidate.length <= 3) {
        eligibleRows.push({
          row,
          cols: new Set(cellsWithCandidate.map((p) => p.col)),
        });
      }
    }

    if (eligibleRows.length < 3) return null;

    // Check all combinations of 3 rows
    const rowTriples = combinations(eligibleRows, 3);

    for (const [rowInfo1, rowInfo2, rowInfo3] of rowTriples) {
      // Union of all columns
      const allCols = new Set([...rowInfo1.cols, ...rowInfo2.cols, ...rowInfo3.cols]);

      // For Swordfish, the union must have exactly 3 columns
      if (allCols.size !== 3) continue;

      const rows = [rowInfo1.row, rowInfo2.row, rowInfo3.row];
      const cols = [...allCols].sort((a, b) => a - b);

      // Found a Swordfish pattern! Now find eliminations in the columns
      const swordfishCells: Position[] = [];
      for (const row of rows) {
        for (const col of cols) {
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            swordfishCells.push({ row, col });
          }
        }
      }

      const eliminations: { position: Position; candidates: number[] }[] = [];

      // Eliminate from all three columns (except the Swordfish cells)
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
          `Swordfish: ${candidate} in rows ${rows.map((r) => r + 1).join(", ")} aligns in columns ${cols.map((c) => c + 1).join(", ")}`,
          swordfishCells,
        );
      }
    }

    return null;
  }

  private findColumnSwordfish(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Find columns where the candidate appears in 2-3 cells
    const eligibleCols: { col: number; rows: Set<number> }[] = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellsWithCandidate = grid.findCellsWithCandidate(
        { type: "column", index: col },
        candidate,
      );

      if (cellsWithCandidate.length >= 2 && cellsWithCandidate.length <= 3) {
        eligibleCols.push({
          col,
          rows: new Set(cellsWithCandidate.map((p) => p.row)),
        });
      }
    }

    if (eligibleCols.length < 3) return null;

    // Check all combinations of 3 columns
    const colTriples = combinations(eligibleCols, 3);

    for (const [colInfo1, colInfo2, colInfo3] of colTriples) {
      // Union of all rows
      const allRows = new Set([...colInfo1.rows, ...colInfo2.rows, ...colInfo3.rows]);

      // For Swordfish, the union must have exactly 3 rows
      if (allRows.size !== 3) continue;

      const cols = [colInfo1.col, colInfo2.col, colInfo3.col];
      const rows = [...allRows].sort((a, b) => a - b);

      // Found a Swordfish pattern! Now find eliminations in the rows
      const swordfishCells: Position[] = [];
      for (const row of rows) {
        for (const col of cols) {
          if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
            swordfishCells.push({ row, col });
          }
        }
      }

      const eliminations: { position: Position; candidates: number[] }[] = [];

      // Eliminate from all three rows (except the Swordfish cells)
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
          `Swordfish: ${candidate} in columns ${cols.map((c) => c + 1).join(", ")} aligns in rows ${rows.map((r) => r + 1).join(", ")}`,
          swordfishCells,
        );
      }
    }

    return null;
  }
}
