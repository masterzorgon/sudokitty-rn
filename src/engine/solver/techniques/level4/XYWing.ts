// XY-Wing - Level 4 Technique
// Three cells form a chain where:
// - The pivot cell has exactly two candidates: XY
// - One wing cell has candidates XZ (shares X with pivot)
// - Other wing cell has candidates YZ (shares Y with pivot)
// - The pivot sees both wings
// - Wings may or may not see each other
// Result: Z can be eliminated from any cell that sees both wings.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, setIntersection } from "../Technique";

export class XYWing extends BaseTechnique {
  readonly name = "XY-Wing";
  readonly level: TechniqueLevel = 4;
  readonly description = "Three cells form a chain where the pivot eliminates a common candidate";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Find all cells with exactly 2 candidates (potential pivots and wings)
    const biValueCells: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.isEmpty(row, col) && grid.getCandidateCount(row, col) === 2) {
          biValueCells.push({ row, col });
        }
      }
    }

    if (biValueCells.length < 3) return null;

    // Try each bi-value cell as a potential pivot
    for (const pivot of biValueCells) {
      const result = this.findXYWingWithPivot(grid, pivot, biValueCells);
      if (result) return result;
    }

    return null;
  }

  private findXYWingWithPivot(
    grid: CandidateGridInterface,
    pivot: Position,
    biValueCells: Position[],
  ): TechniqueResult | null {
    const pivotCandidates = [...grid.getCandidates(pivot.row, pivot.col)];
    if (pivotCandidates.length !== 2) return null;

    const [X, Y] = pivotCandidates;

    // Find potential wings (bi-value cells that the pivot can see)
    const potentialWings = biValueCells.filter(
      (cell) => cell.row !== pivot.row || cell.col !== pivot.col, // Not the pivot
    );

    // Find wings that share exactly one candidate with pivot
    const wingsWithX: Position[] = [];
    const wingsWithY: Position[] = [];

    for (const wing of potentialWings) {
      // Wing must be a peer of pivot
      if (!this.isPeer(pivot, wing)) continue;

      const wingCandidates = grid.getCandidates(wing.row, wing.col);
      if (wingCandidates.size !== 2) continue;

      const hasX = wingCandidates.has(X);
      const hasY = wingCandidates.has(Y);

      // Wing must share exactly one candidate with pivot
      if (hasX && !hasY) {
        wingsWithX.push(wing);
      } else if (hasY && !hasX) {
        wingsWithY.push(wing);
      }
    }

    // Try all combinations of wings
    for (const wingX of wingsWithX) {
      for (const wingY of wingsWithY) {
        const result = this.checkXYWing(grid, pivot, wingX, wingY, X, Y);
        if (result) return result;
      }
    }

    return null;
  }

  private checkXYWing(
    grid: CandidateGridInterface,
    pivot: Position,
    wingX: Position,
    wingY: Position,
    X: number,
    Y: number,
  ): TechniqueResult | null {
    // wingX has candidates {X, Z} for some Z
    // wingY has candidates {Y, Z} for the same Z
    const wingXCandidates = grid.getCandidates(wingX.row, wingX.col);
    const wingYCandidates = grid.getCandidates(wingY.row, wingY.col);

    // Find Z (the common candidate between wings that's not in pivot)
    const Z_candidates = setIntersection(wingXCandidates, wingYCandidates);

    // Should have exactly one common candidate (Z)
    if (Z_candidates.size !== 1) return null;

    const Z = [...Z_candidates][0];

    // Verify: wingX should have {X, Z} and wingY should have {Y, Z}
    if (!wingXCandidates.has(X) || !wingXCandidates.has(Z)) return null;
    if (!wingYCandidates.has(Y) || !wingYCandidates.has(Z)) return null;

    // Find cells that see both wings and have Z as a candidate
    const eliminations: { position: Position; candidates: number[] }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Skip the pivot and wings
        if (row === pivot.row && col === pivot.col) continue;
        if (row === wingX.row && col === wingX.col) continue;
        if (row === wingY.row && col === wingY.col) continue;

        if (!grid.isEmpty(row, col)) continue;
        if (!grid.hasCandidate(row, col, Z)) continue;

        const cell = { row, col };

        // Cell must see both wings
        if (this.isPeer(cell, wingX) && this.isPeer(cell, wingY)) {
          eliminations.push({
            position: cell,
            candidates: [Z],
          });
        }
      }
    }

    if (eliminations.length > 0) {
      return this.createEliminationResult(
        eliminations,
        `XY-Wing: Pivot ${this.formatPosition(pivot)} (${X},${Y}), wings ${this.formatPosition(wingX)} (${X},${Z}) and ${this.formatPosition(wingY)} (${Y},${Z}) eliminate ${Z}`,
        [pivot, wingX, wingY],
      );
    }

    return null;
  }

  private isPeer(a: Position, b: Position): boolean {
    // Same row
    if (a.row === b.row) return true;
    // Same column
    if (a.col === b.col) return true;
    // Same box
    const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
    const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
    return boxA === boxB;
  }
}
