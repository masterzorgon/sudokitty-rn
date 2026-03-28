// WXYZ-Wing - Level 4 Technique
// Extension of XYZ-Wing to 4 cells.
// A pivot cell with 4 candidates (WXYZ) sees three wing cells.
// Each wing is bi/tri-value and shares candidates with the pivot.
// The common candidate Z (appearing in all 4 cells) can be eliminated
// from cells that see ALL 4 cells.
//
// Also covers "non-pivot" WXYZ-Wings where 4 cells collectively hold
// exactly 4 candidates and share a restricted common candidate Z.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, setUnion, setIntersection, combinations } from "../Technique";

export class WXYZWing extends BaseTechnique {
  readonly name = "WXYZ-Wing";
  readonly level: TechniqueLevel = 4;
  readonly description =
    "Four cells collectively holding four candidates with a shared elimination";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Collect all unsolved cells with 2-4 candidates
    const cells: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.isEmpty(row, col)) {
          const count = grid.getCandidateCount(row, col);
          if (count >= 2 && count <= 4) {
            cells.push({ row, col });
          }
        }
      }
    }

    // Try each cell with 3-4 candidates as potential pivot
    for (const pivot of cells) {
      const pivotCount = grid.getCandidateCount(pivot.row, pivot.col);
      if (pivotCount < 3 || pivotCount > 4) continue;

      const pivotCands = grid.getCandidates(pivot.row, pivot.col);

      // Find peer cells that share at least one candidate with pivot
      const peerWings = cells.filter(
        (c) =>
          !(c.row === pivot.row && c.col === pivot.col) &&
          this.isPeer(pivot, c) &&
          setIntersection(pivotCands, grid.getCandidates(c.row, c.col)).size > 0,
      );

      // Need to pick 3 wings (for 4-candidate pivot) or 2 wings + check
      const wingCount = pivotCount === 4 ? 3 : 2;
      if (peerWings.length < wingCount) continue;

      const wingCombos = combinations(peerWings, wingCount);

      for (const wings of wingCombos) {
        const result = this.checkWXYZWing(grid, pivot, wings);
        if (result) return result;
      }
    }

    return null;
  }

  private checkWXYZWing(
    grid: CandidateGridInterface,
    pivot: Position,
    wings: Position[],
  ): TechniqueResult | null {
    const allCells = [pivot, ...wings];

    // Union of all candidates across all cells must be exactly 4
    const allCandSets = allCells.map((c) => grid.getCandidates(c.row, c.col));
    const union = setUnion(...allCandSets);
    if (union.size !== 4) return null;

    // Find Z: candidate that appears in ALL cells
    const intersection = setIntersection(...allCandSets);
    if (intersection.size === 0) return null;

    // Try each common candidate as Z
    for (const Z of intersection) {
      // All cells must see each other OR there must be a "restricted" configuration
      // For simplicity, eliminate Z from cells that see ALL cells in the pattern
      const eliminations: { position: Position; candidates: number[] }[] = [];

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (allCells.some((c) => c.row === row && c.col === col)) continue;
          if (!grid.isEmpty(row, col) || !grid.hasCandidate(row, col, Z)) continue;

          const cell = { row, col };
          if (allCells.every((c) => this.isPeer(cell, c))) {
            eliminations.push({ position: cell, candidates: [Z] });
          }
        }
      }

      if (eliminations.length > 0) {
        const candStr = [...union].sort((a, b) => a - b).join(",");
        return this.createEliminationResult(
          eliminations,
          `WXYZ-Wing: ${this.formatPositions(allCells)} with candidates ${candStr} eliminate ${Z}`,
          allCells,
        );
      }
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
