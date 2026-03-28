// BUG (Bivalue Universal Grave) + 1 - Level 4 Technique
// If every unsolved cell has exactly 2 candidates except one cell with 3,
// the extra candidate in that cell must be the solution (to avoid
// a deadly BUG state which implies multiple solutions).
//
// The "extra" candidate is the one that, if removed, would leave a
// BUG state. It's identified as the candidate that appears an odd
// number of times in its row, column, and box among unsolved cells.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique } from "../Technique";

export class BUG extends BaseTechnique {
  readonly name = "BUG";
  readonly level: TechniqueLevel = 4;
  readonly description = "All unsolved cells are bivalue except one with three candidates";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    let triValueCell: Position | null = null;
    let triValueCandidates: number[] = [];

    // Check all unsolved cells: every one must be bivalue except at most one trivalue
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;

        const count = grid.getCandidateCount(row, col);

        if (count === 2) continue; // bivalue - good

        if (count === 3 && triValueCell === null) {
          triValueCell = { row, col };
          triValueCandidates = [...grid.getCandidates(row, col)];
          continue;
        }

        // More than one trivalue cell, or a cell with 4+ candidates - not a BUG
        return null;
      }
    }

    if (!triValueCell || triValueCandidates.length !== 3) return null;

    // Find the "extra" candidate - the one that appears 3 times (odd)
    // in row, column, AND box. In a BUG state, each candidate appears
    // exactly twice in each unit. The extra candidate breaks this.
    const extraCandidate = this.findExtraCandidate(grid, triValueCell, triValueCandidates);
    if (extraCandidate === null) return null;

    // Eliminate the two non-extra candidates from this cell
    const toEliminate = triValueCandidates.filter((c) => c !== extraCandidate);

    return this.createEliminationResult(
      [{ position: triValueCell, candidates: toEliminate }],
      `BUG+1: ${this.formatPosition(triValueCell)} must be ${extraCandidate} to avoid a Bivalue Universal Grave`,
      [triValueCell],
    );
  }

  private findExtraCandidate(
    grid: CandidateGridInterface,
    cell: Position,
    candidates: number[],
  ): number | null {
    for (const candidate of candidates) {
      // Count how many times this candidate appears in the cell's row, column, and box
      const rowCount = grid.findCellsWithCandidate(
        { type: "row", index: cell.row },
        candidate,
      ).length;
      const colCount = grid.findCellsWithCandidate(
        { type: "column", index: cell.col },
        candidate,
      ).length;
      const boxIndex = Math.floor(cell.row / 3) * 3 + Math.floor(cell.col / 3);
      const boxCount = grid.findCellsWithCandidate(
        { type: "box", index: boxIndex },
        candidate,
      ).length;

      // The extra candidate appears an odd number of times in all three units
      if (rowCount % 2 === 1 && colCount % 2 === 1 && boxCount % 2 === 1) {
        return candidate;
      }
    }
    return null;
  }
}
