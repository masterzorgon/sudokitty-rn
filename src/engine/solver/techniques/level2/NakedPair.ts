// Naked Pair - Level 2 Technique
// When two cells in a unit have exactly the same two candidates,
// those candidates can be eliminated from other cells in the unit.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from '../../types';
import { BaseTechnique, setsEqual, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class NakedPair extends BaseTechnique {
  readonly name = 'Naked Pair';
  readonly level: TechniqueLevel = 2;
  readonly description = 'Two cells in a unit share exactly two candidates';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check all units
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
      units.push({ type: 'column', index: i });
      units.push({ type: 'box', index: i });
    }

    for (const unit of units) {
      const result = this.findNakedPairInUnit(grid, unit);
      if (result) return result;
    }

    return null;
  }

  private findNakedPairInUnit(
    grid: CandidateGridInterface,
    unit: Unit
  ): TechniqueResult | null {
    // Get all empty cells in the unit with exactly 2 candidates
    const cellsWithTwoCandidates: Position[] = grid
      .findEmptyCells(unit)
      .filter((pos) => grid.getCandidateCount(pos.row, pos.col) === 2);

    if (cellsWithTwoCandidates.length < 2) return null;

    // Check all pairs of these cells
    const pairs = combinations(cellsWithTwoCandidates, 2);

    for (const [cell1, cell2] of pairs) {
      const candidates1 = grid.getCandidates(cell1.row, cell1.col);
      const candidates2 = grid.getCandidates(cell2.row, cell2.col);

      // Check if both cells have the same candidates
      if (!setsEqual(candidates1, candidates2)) continue;

      const pairCandidates = [...candidates1];

      // Find cells in the unit that can have eliminations
      const otherCells = grid.findEmptyCells(unit).filter(
        (pos) =>
          !(pos.row === cell1.row && pos.col === cell1.col) &&
          !(pos.row === cell2.row && pos.col === cell2.col)
      );

      // Check if any other cell has these candidates
      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      for (const cell of otherCells) {
        const toEliminate = pairCandidates.filter((c) =>
          grid.hasCandidate(cell.row, cell.col, c)
        );
        if (toEliminate.length > 0) {
          eliminations.push({ position: cell, candidates: toEliminate });
        }
      }

      // If there are eliminations, we found a useful naked pair
      if (eliminations.length > 0) {
        const unitName = this.getUnitName(unit);
        return this.createEliminationResult(
          eliminations,
          `${this.formatPosition(cell1)} and ${this.formatPosition(cell2)} form a naked pair with candidates ${this.formatCandidates(pairCandidates)} in ${unitName}`,
          [cell1, cell2]
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
