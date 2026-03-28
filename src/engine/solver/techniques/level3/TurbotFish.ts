// Turbot Fish - Level 3 Single Digit Pattern
// A general pattern: two conjugate pairs (strong links) for the same candidate
// connected by a weak link. The chain endpoints force eliminations.
// This covers patterns NOT already handled by Skyscraper or 2-String Kite,
// such as box-box, box-row, and box-column connections.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from "../../types";
import { BaseTechnique } from "../Technique";

interface ConjugatePair {
  unit: Unit;
  cells: [Position, Position];
}

export class TurbotFish extends BaseTechnique {
  readonly name = "Turbot Fish";
  readonly level: TechniqueLevel = 3;
  readonly description = "Two conjugate pairs connected by a weak link form a chain";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findTurbotFish(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findTurbotFish(grid: CandidateGridInterface, candidate: number): TechniqueResult | null {
    // Collect ALL conjugate pairs (rows, columns, boxes)
    const pairs: ConjugatePair[] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      // Row conjugate pairs
      const rowCells = grid.findCellsWithCandidate({ type: "row", index: i }, candidate);
      if (rowCells.length === 2) {
        pairs.push({ unit: { type: "row", index: i }, cells: [rowCells[0], rowCells[1]] });
      }

      // Column conjugate pairs
      const colCells = grid.findCellsWithCandidate({ type: "column", index: i }, candidate);
      if (colCells.length === 2) {
        pairs.push({ unit: { type: "column", index: i }, cells: [colCells[0], colCells[1]] });
      }

      // Box conjugate pairs
      const boxCells = grid.findCellsWithCandidate({ type: "box", index: i }, candidate);
      if (boxCells.length === 2) {
        pairs.push({ unit: { type: "box", index: i }, cells: [boxCells[0], boxCells[1]] });
      }
    }

    if (pairs.length < 2) return null;

    // Try all combinations of two conjugate pairs
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const pair1 = pairs[i];
        const pair2 = pairs[j];

        // Skip if both pairs are in the same unit (would be the same pair)
        if (pair1.unit.type === pair2.unit.type && pair1.unit.index === pair2.unit.index) continue;

        // Skip Skyscraper patterns (both row-row or both column-column)
        if (pair1.unit.type === "row" && pair2.unit.type === "row") continue;
        if (pair1.unit.type === "column" && pair2.unit.type === "column") continue;

        // Skip 2-String Kite patterns (row-column)
        if (
          (pair1.unit.type === "row" && pair2.unit.type === "column") ||
          (pair1.unit.type === "column" && pair2.unit.type === "row")
        )
          continue;

        // Now we're looking at patterns involving at least one box pair.
        // Find a weak link: two cells (one from each pair) that see each other
        for (let pi = 0; pi < 2; pi++) {
          for (let pj = 0; pj < 2; pj++) {
            const linkCell1 = pair1.cells[pi];
            const linkCell2 = pair2.cells[pj];

            // Skip if same cell
            if (linkCell1.row === linkCell2.row && linkCell1.col === linkCell2.col) continue;

            // Check weak link: cells see each other (same row, column, or box)
            if (!this.sees(linkCell1.row, linkCell1.col, linkCell2, grid)) continue;

            // The endpoints are the OTHER cells in each pair
            const endpoint1 = pair1.cells[1 - pi];
            const endpoint2 = pair2.cells[1 - pj];

            // Skip if endpoints are the same cell
            if (endpoint1.row === endpoint2.row && endpoint1.col === endpoint2.col) continue;

            // Find eliminations: cells that see both endpoints
            const eliminations: { position: Position; candidates: number[] }[] = [];

            for (let row = 0; row < BOARD_SIZE; row++) {
              for (let col = 0; col < BOARD_SIZE; col++) {
                // Skip all four chain cells
                if (this.isPos(row, col, pair1.cells[0])) continue;
                if (this.isPos(row, col, pair1.cells[1])) continue;
                if (this.isPos(row, col, pair2.cells[0])) continue;
                if (this.isPos(row, col, pair2.cells[1])) continue;

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
                pair1.cells[0],
                pair1.cells[1],
                pair2.cells[0],
                pair2.cells[1],
              ];

              return this.createEliminationResult(
                eliminations,
                `Turbot Fish: ${candidate} chain through ${pair1.unit.type} ${pair1.unit.index + 1} and ${pair2.unit.type} ${pair2.unit.index + 1}`,
                highlightCells,
              );
            }
          }
        }
      }
    }

    return null;
  }

  private isPos(row: number, col: number, pos: Position): boolean {
    return row === pos.row && col === pos.col;
  }

  private sees(row: number, col: number, target: Position, grid: CandidateGridInterface): boolean {
    if (row === target.row) return true;
    if (col === target.col) return true;
    if (grid.getBoxIndex(row, col) === grid.getBoxIndex(target.row, target.col)) return true;
    return false;
  }
}
