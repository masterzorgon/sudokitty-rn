// Naked Triple - Level 3 Technique
// When three cells in a unit have candidates that are a subset of three values,
// those values can be eliminated from other cells in the unit.
// Note: Each cell doesn't need all three candidates - just a subset.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from '../../types';
import { BaseTechnique, setUnion, isSubset, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class NakedTriple extends BaseTechnique {
  readonly name = 'Naked Triple';
  readonly level: TechniqueLevel = 3;
  readonly description = 'Three cells in a unit share at most three candidates';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check all units
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
      units.push({ type: 'column', index: i });
      units.push({ type: 'box', index: i });
    }

    for (const unit of units) {
      const result = this.findNakedTripleInUnit(grid, unit);
      if (result) return result;
    }

    return null;
  }

  private findNakedTripleInUnit(
    grid: CandidateGridInterface,
    unit: Unit
  ): TechniqueResult | null {
    // Get all empty cells in the unit with 2 or 3 candidates
    const eligibleCells: Position[] = grid
      .findEmptyCells(unit)
      .filter((pos) => {
        const count = grid.getCandidateCount(pos.row, pos.col);
        return count >= 2 && count <= 3;
      });

    if (eligibleCells.length < 3) return null;

    // Check all combinations of 3 cells
    const triples = combinations(eligibleCells, 3);

    for (const [cell1, cell2, cell3] of triples) {
      const candidates1 = grid.getCandidates(cell1.row, cell1.col);
      const candidates2 = grid.getCandidates(cell2.row, cell2.col);
      const candidates3 = grid.getCandidates(cell3.row, cell3.col);

      // Union of all candidates
      const unionCandidates = setUnion(candidates1, candidates2, candidates3);

      // For a naked triple, the union must have exactly 3 candidates
      if (unionCandidates.size !== 3) continue;

      // Verify each cell's candidates are a subset of the union
      // (This should always be true given how we built the union, but double-check)
      if (
        !isSubset(candidates1, unionCandidates) ||
        !isSubset(candidates2, unionCandidates) ||
        !isSubset(candidates3, unionCandidates)
      ) {
        continue;
      }

      const tripleCandidates = [...unionCandidates];
      const tripleCells = [cell1, cell2, cell3];

      // Find cells in the unit that can have eliminations
      const otherCells = grid.findEmptyCells(unit).filter(
        (pos) =>
          !(pos.row === cell1.row && pos.col === cell1.col) &&
          !(pos.row === cell2.row && pos.col === cell2.col) &&
          !(pos.row === cell3.row && pos.col === cell3.col)
      );

      // Check if any other cell has these candidates
      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      for (const cell of otherCells) {
        const toEliminate = tripleCandidates.filter((c) =>
          grid.hasCandidate(cell.row, cell.col, c)
        );
        if (toEliminate.length > 0) {
          eliminations.push({ position: cell, candidates: toEliminate });
        }
      }

      // If there are eliminations, we found a useful naked triple
      if (eliminations.length > 0) {
        const unitName = this.getUnitName(unit);
        return this.createEliminationResult(
          eliminations,
          `${this.formatPositions(tripleCells)} form a naked triple with candidates ${this.formatCandidates(tripleCandidates)} in ${unitName}`,
          tripleCells
        );
      }
    }

    return null;
  }

  private getUnitName(unit: Unit): string {
    switch (unit.type) {
      case 'row':
        return `row ${unit.index + 1}`;
      case 'column':
        return `column ${unit.index + 1}`;
      case 'box':
        return `box ${unit.index + 1}`;
    }
  }
}
