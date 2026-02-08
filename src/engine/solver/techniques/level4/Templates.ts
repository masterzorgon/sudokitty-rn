// Templates - Level 4 Last Resort Technique
//
// For each digit, enumerate all valid ways to place 9 instances in the grid
// (one per row, one per column, one per box). A cell not in ANY remaining
// template can have the candidate eliminated. A cell in ALL remaining
// templates must contain the candidate (placement).

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class Templates extends BaseTechnique {
  readonly name = 'Templates';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Enumerate all valid digit placements to find eliminations';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findTemplateEliminations(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findTemplateEliminations(
    grid: CandidateGridInterface,
    candidate: number
  ): TechniqueResult | null {
    // For each row, find columns where the candidate can go
    const possibleCols: number[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const cols: number[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.getValue(row, col) === candidate) {
          // Already placed — this row is fixed
          cols.length = 0;
          cols.push(col);
          break;
        }
        if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
          cols.push(col);
        }
      }
      if (cols.length === 0) return null; // No valid placement for this digit in a row — invalid state
      possibleCols.push(cols);
    }

    // Generate all valid templates via backtracking
    const templates: number[][] = []; // Each template is an array of 9 column indices
    const usedCols = new Set<number>();
    const usedBoxes = new Set<number>();
    const current: number[] = [];

    const backtrack = (row: number) => {
      if (row === BOARD_SIZE) {
        templates.push([...current]);
        return;
      }

      // If digit is already placed in this row, it's fixed
      const placed = grid.getValue(row, possibleCols[row][0]);
      if (placed === candidate && possibleCols[row].length === 1) {
        const col = possibleCols[row][0];
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        if (usedCols.has(col) || usedBoxes.has(box)) return;
        usedCols.add(col);
        usedBoxes.add(box);
        current.push(col);
        backtrack(row + 1);
        current.pop();
        usedCols.delete(col);
        usedBoxes.delete(box);
        return;
      }

      for (const col of possibleCols[row]) {
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        if (usedCols.has(col) || usedBoxes.has(box)) continue;

        usedCols.add(col);
        usedBoxes.add(box);
        current.push(col);
        backtrack(row + 1);
        current.pop();
        usedCols.delete(col);
        usedBoxes.delete(box);

        // Cap at 1000 templates to prevent explosion
        if (templates.length >= 1000) return;
      }
    };

    backtrack(0);

    if (templates.length === 0) return null;

    // Count how many templates include each cell
    const cellCount = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0));
    for (const template of templates) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        cellCount[row][template[row]]++;
      }
    }

    const totalTemplates = templates.length;

    // Check for eliminations: cell has candidate but is in NO template
    const eliminations: Array<{ position: Position; candidates: number[] }> = [];
    const placements: Array<{ position: Position; value: number }> = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        if (!grid.hasCandidate(row, col, candidate)) continue;

        if (cellCount[row][col] === 0) {
          // Not in any template — eliminate
          eliminations.push({
            position: { row, col },
            candidates: [candidate],
          });
        } else if (cellCount[row][col] === totalTemplates) {
          // In ALL templates — placement
          placements.push({
            position: { row, col },
            value: candidate,
          });
        }
      }
    }

    if (eliminations.length > 0) {
      return this.createEliminationResult(
        eliminations,
        `Templates: ${candidate} — ${totalTemplates} valid templates, ${eliminations.length} elimination${eliminations.length !== 1 ? 's' : ''}`,
        eliminations.map((e) => e.position)
      );
    }

    if (placements.length > 0) {
      return this.createPlacementResult(
        placements[0].position,
        placements[0].value,
        `Templates: ${candidate} must go in ${this.formatPosition(placements[0].position)} (in all ${totalTemplates} templates)`,
        placements.map((p) => p.position)
      );
    }

    return null;
  }
}
