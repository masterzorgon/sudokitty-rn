// XYZ-Wing - Level 4 Technique
// Similar to XY-Wing, but the pivot has three candidates (XYZ) instead of two.
// - The pivot cell has exactly three candidates: XYZ
// - One wing cell has candidates XZ (shares X with pivot, sees pivot)
// - Other wing cell has candidates YZ (shares Y with pivot, sees pivot)
// - Z is the common candidate across all three cells
// Result: Z can be eliminated from any cell that sees all three cells
//         (pivot AND both wings).

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, setIntersection } from "../Technique";

export class XYZWing extends BaseTechnique {
  readonly name = "XYZ-Wing";
  readonly level: TechniqueLevel = 4;
  readonly description =
    "Three cells form a chain where a three-candidate pivot eliminates a common candidate";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Find all cells with exactly 3 candidates (potential pivots)
    const triValueCells: Position[] = [];
    // Find all cells with exactly 2 candidates (potential wings)
    const biValueCells: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const count = grid.getCandidateCount(row, col);
        if (count === 3) triValueCells.push({ row, col });
        if (count === 2) biValueCells.push({ row, col });
      }
    }

    if (triValueCells.length === 0 || biValueCells.length < 2) return null;

    // Try each tri-value cell as a potential pivot
    for (const pivot of triValueCells) {
      const result = this.findXYZWingWithPivot(grid, pivot, biValueCells);
      if (result) return result;
    }

    return null;
  }

  private findXYZWingWithPivot(
    grid: CandidateGridInterface,
    pivot: Position,
    biValueCells: Position[],
  ): TechniqueResult | null {
    const pivotCandidates = [...grid.getCandidates(pivot.row, pivot.col)];
    if (pivotCandidates.length !== 3) return null;

    const [X, Y, Z_candidate] = pivotCandidates;

    // For XYZ-Wing, we need to try all 3 possible assignments of which
    // candidate is Z (the one to be eliminated)
    const candidateAssignments = [
      { Z: X, others: [Y, Z_candidate] },
      { Z: Y, others: [X, Z_candidate] },
      { Z: Z_candidate, others: [X, Y] },
    ];

    for (const { Z, others } of candidateAssignments) {
      // Find wings among bi-value peers of the pivot
      // Wing1 must have Z and one of the "others"
      // Wing2 must have Z and the other "other"
      const [A, B] = others;

      const wingsWithAZ: Position[] = [];
      const wingsWithBZ: Position[] = [];

      for (const wing of biValueCells) {
        if (wing.row === pivot.row && wing.col === pivot.col) continue;
        if (!this.isPeer(pivot, wing)) continue;

        const wingCands = grid.getCandidates(wing.row, wing.col);
        if (wingCands.size !== 2) continue;

        if (wingCands.has(A) && wingCands.has(Z) && !wingCands.has(B)) {
          wingsWithAZ.push(wing);
        }
        if (wingCands.has(B) && wingCands.has(Z) && !wingCands.has(A)) {
          wingsWithBZ.push(wing);
        }
      }

      // Try all combinations of valid wing pairs
      for (const wing1 of wingsWithAZ) {
        for (const wing2 of wingsWithBZ) {
          if (wing1.row === wing2.row && wing1.col === wing2.col) continue;

          const result = this.checkXYZWing(grid, pivot, wing1, wing2, Z, A, B);
          if (result) return result;
        }
      }
    }

    return null;
  }

  private checkXYZWing(
    grid: CandidateGridInterface,
    pivot: Position,
    wing1: Position,
    wing2: Position,
    Z: number,
    A: number,
    B: number,
  ): TechniqueResult | null {
    // Z can be eliminated from cells that see ALL three cells (pivot + both wings)
    const eliminations: { position: Position; candidates: number[] }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Skip the pivot and wings
        if (row === pivot.row && col === pivot.col) continue;
        if (row === wing1.row && col === wing1.col) continue;
        if (row === wing2.row && col === wing2.col) continue;

        if (!grid.isEmpty(row, col)) continue;
        if (!grid.hasCandidate(row, col, Z)) continue;

        const cell = { row, col };

        // Cell must see ALL three: pivot AND both wings
        if (this.isPeer(cell, pivot) && this.isPeer(cell, wing1) && this.isPeer(cell, wing2)) {
          eliminations.push({
            position: cell,
            candidates: [Z],
          });
        }
      }
    }

    if (eliminations.length > 0) {
      const pivotCands = [...grid.getCandidates(pivot.row, pivot.col)].sort((a, b) => a - b);
      const wing1Cands = [...grid.getCandidates(wing1.row, wing1.col)].sort((a, b) => a - b);
      const wing2Cands = [...grid.getCandidates(wing2.row, wing2.col)].sort((a, b) => a - b);

      return this.createEliminationResult(
        eliminations,
        `XYZ-Wing: Pivot ${this.formatPosition(pivot)} (${pivotCands.join(",")}), wings ${this.formatPosition(wing1)} (${wing1Cands.join(",")}) and ${this.formatPosition(wing2)} (${wing2Cands.join(",")}) eliminate ${Z}`,
        [pivot, wing1, wing2],
      );
    }

    return null;
  }

  private isPeer(a: Position, b: Position): boolean {
    if (a.row === b.row) return true;
    if (a.col === b.col) return true;
    const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
    const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
    return boxA === boxB;
  }
}
