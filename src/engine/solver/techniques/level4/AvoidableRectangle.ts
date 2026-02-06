// Avoidable Rectangle Type 1 - Level 4 Technique
// Like Unique Rectangle, but 2 diagonal corners are already solved.
// If 2 solved corners have values A and B, and they form a rectangle
// across 2 boxes with 2 unsolved corners, and one unsolved corner is
// bivalue {A,B}, eliminate the value that would complete the deadly
// pattern from the other unsolved corner.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class AvoidableRectangle extends BaseTechnique {
  readonly name = 'Avoidable Rectangle';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Deadly rectangle with solved anchor cells';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Try all pairs of rows and columns to form potential rectangles
    for (let r1 = 0; r1 < BOARD_SIZE; r1++) {
      for (let r2 = r1 + 1; r2 < BOARD_SIZE; r2++) {
        for (let c1 = 0; c1 < BOARD_SIZE; c1++) {
          for (let c2 = c1 + 1; c2 < BOARD_SIZE; c2++) {
            const corners: Position[] = [
              { row: r1, col: c1 }, { row: r1, col: c2 },
              { row: r2, col: c1 }, { row: r2, col: c2 },
            ];

            // Must span exactly 2 boxes
            const boxes = new Set(
              corners.map((p) => Math.floor(p.row / 3) * 3 + Math.floor(p.col / 3)),
            );
            if (boxes.size !== 2) continue;

            const result = this.checkRectangle(grid, corners);
            if (result) return result;
          }
        }
      }
    }
    return null;
  }

  private checkRectangle(
    grid: CandidateGridInterface,
    corners: Position[],
  ): TechniqueResult | null {
    // Classify corners as solved or unsolved
    const solved: Array<{ pos: Position; value: number }> = [];
    const unsolved: Position[] = [];

    for (const pos of corners) {
      const val = grid.getValue(pos.row, pos.col);
      if (val !== null) {
        solved.push({ pos, value: val });
      } else if (grid.isEmpty(pos.row, pos.col)) {
        unsolved.push(pos);
      }
    }

    // Need exactly 2 solved and 2 unsolved
    if (solved.length !== 2 || unsolved.length !== 2) return null;

    // Solved corners must be on a diagonal (different rows and columns)
    if (solved[0].pos.row === solved[1].pos.row || solved[0].pos.col === solved[1].pos.col) return null;

    const valA = solved[0].value;
    const valB = solved[1].value;
    if (valA === valB) return null;

    // Check each unsolved corner
    // One must be bivalue {A,B}, the other must contain at least one of {A,B} with extras
    for (let i = 0; i < 2; i++) {
      const bivalueCorner = unsolved[i];
      const otherCorner = unsolved[1 - i];

      const bvCands = grid.getCandidates(bivalueCorner.row, bivalueCorner.col);
      if (bvCands.size !== 2 || !bvCands.has(valA) || !bvCands.has(valB)) continue;

      // The bivalue corner has exactly {A,B}.
      // To avoid the deadly pattern, the other corner must not have
      // the value that would complete the rectangle pattern.
      // The "completing" value for the other corner is the value
      // that the solved diagonal corner in the same row has.
      const otherCands = grid.getCandidates(otherCorner.row, otherCorner.col);

      // Find which solved corner shares the row with the other unsolved corner
      const sameRowSolved = solved.find((s) => s.pos.row === otherCorner.row);
      if (!sameRowSolved) continue;

      const dangerValue = sameRowSolved.value;
      if (!otherCands.has(dangerValue)) continue;
      if (otherCands.size <= 1) continue; // Can't eliminate the only candidate

      return this.createEliminationResult(
        [{ position: otherCorner, candidates: [dangerValue] }],
        `Avoidable Rectangle Type 1: ${valA}/${valB} in ${corners.map((p) => this.formatPosition(p)).join(',')} => ${this.formatPosition(otherCorner)}<>${dangerValue}`,
        corners,
      );
    }

    return null;
  }
}
