// Unique Rectangle Type 1 - Level 4 Technique
// If 4 cells form a rectangle across exactly 2 boxes, and 3 corners are
// bivalue with the same 2 candidates, the 4th corner must NOT have only
// those 2 candidates (or the puzzle would have multiple solutions).
// Eliminate the 2 rectangle candidates from the 4th corner.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique } from "../Technique";

export class UniqueRectangle extends BaseTechnique {
  readonly name = "Unique Rectangle";
  readonly level: TechniqueLevel = 4;
  readonly description = "Four cells forming a deadly rectangle pattern";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Find all bivalue cells
    const bivalueCells: { pos: Position; cands: number[] }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.isEmpty(row, col) && grid.getCandidateCount(row, col) === 2) {
          bivalueCells.push({
            pos: { row, col },
            cands: [...grid.getCandidates(row, col)].sort((a, b) => a - b),
          });
        }
      }
    }

    // Group bivalue cells by their candidate pair
    const groups: Map<string, { pos: Position; cands: number[] }[]> = new Map();
    for (const cell of bivalueCells) {
      const key = cell.cands.join(",");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(cell);
    }

    // For each group with 3+ cells sharing the same pair, try to form rectangles
    for (const [key, cells] of groups) {
      if (cells.length < 3) continue;
      const [cand1, cand2] = cells[0].cands;

      // Try all combinations of 3 bivalue cells as corners of a rectangle
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          for (let k = j + 1; k < cells.length; k++) {
            const three = [cells[i], cells[j], cells[k]];
            const result = this.tryRectangle(grid, three, cand1, cand2);
            if (result) return result;
          }
        }
      }
    }

    return null;
  }

  private tryRectangle(
    grid: CandidateGridInterface,
    three: { pos: Position; cands: number[] }[],
    cand1: number,
    cand2: number,
  ): TechniqueResult | null {
    const positions = three.map((c) => c.pos);

    // From 3 corners, find the 4th corner of the rectangle
    const rows = [...new Set(positions.map((p) => p.row))];
    const cols = [...new Set(positions.map((p) => p.col))];

    // Need exactly 2 rows and 2 columns to form a rectangle
    if (rows.length !== 2 || cols.length !== 2) return null;

    // Find the missing corner
    const occupied = new Set(positions.map((p) => `${p.row}-${p.col}`));
    let fourthCorner: Position | null = null;

    for (const r of rows) {
      for (const c of cols) {
        if (!occupied.has(`${r}-${c}`)) {
          fourthCorner = { row: r, col: c };
        }
      }
    }

    if (!fourthCorner) return null;
    if (!grid.isEmpty(fourthCorner.row, fourthCorner.col)) return null;

    // Fourth corner must contain both rectangle candidates plus extras
    const fourthCands = grid.getCandidates(fourthCorner.row, fourthCorner.col);
    if (!fourthCands.has(cand1) || !fourthCands.has(cand2)) return null;
    if (fourthCands.size <= 2) return null; // Already bivalue - no elimination needed

    // Check that rectangle spans exactly 2 boxes
    const boxes = new Set(
      [...positions, fourthCorner].map((p) => Math.floor(p.row / 3) * 3 + Math.floor(p.col / 3)),
    );
    if (boxes.size !== 2) return null;

    // Eliminate the rectangle candidates from the fourth corner
    return this.createEliminationResult(
      [{ position: fourthCorner, candidates: [cand1, cand2] }],
      `Uniqueness Test 1: ${cand1}/${cand2} in ${positions.map((p) => this.formatPosition(p)).join(",")},${this.formatPosition(fourthCorner)} => ${this.formatPosition(fourthCorner)}<>${cand1}, ${this.formatPosition(fourthCorner)}<>${cand2}`,
      [...positions, fourthCorner],
    );
  }
}
