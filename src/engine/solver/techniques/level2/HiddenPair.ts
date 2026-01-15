// Hidden Pair - Level 2 Technique
// When two candidates appear in only two cells of a unit,
// all other candidates can be eliminated from those two cells.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from '../../types';
import { BaseTechnique, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class HiddenPair extends BaseTechnique {
  readonly name = 'Hidden Pair';
  readonly level: TechniqueLevel = 2;
  readonly description = 'Two candidates appear in only two cells of a unit';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check all units
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
      units.push({ type: 'column', index: i });
      units.push({ type: 'box', index: i });
    }

    for (const unit of units) {
      const result = this.findHiddenPairInUnit(grid, unit);
      if (result) return result;
    }

    return null;
  }

  private findHiddenPairInUnit(
    grid: CandidateGridInterface,
    unit: Unit
  ): TechniqueResult | null {
    // Find all candidates and their positions in this unit
    const candidatePositions: Map<number, Position[]> = new Map();

    for (let candidate = 1; candidate <= 9; candidate++) {
      const positions = grid.findCellsWithCandidate(unit, candidate);
      if (positions.length >= 2 && positions.length <= 8) {
        // Must appear in 2+ cells but not in all
        candidatePositions.set(candidate, positions);
      }
    }

    // Find pairs of candidates that appear in exactly the same two cells
    const candidatesWithTwoCells = [...candidatePositions.entries()]
      .filter(([_, positions]) => positions.length === 2)
      .map(([candidate, _]) => candidate);

    if (candidatesWithTwoCells.length < 2) return null;

    // Check all pairs of these candidates
    const candidatePairs = combinations(candidatesWithTwoCells, 2);

    for (const [cand1, cand2] of candidatePairs) {
      const positions1 = candidatePositions.get(cand1)!;
      const positions2 = candidatePositions.get(cand2)!;

      // Check if both candidates appear in exactly the same two cells
      if (!this.samePositions(positions1, positions2)) continue;

      const [cell1, cell2] = positions1;
      const pairCandidates = [cand1, cand2];

      // Find other candidates to eliminate from these two cells
      const eliminations: Array<{ position: Position; candidates: number[] }> = [];

      for (const cell of [cell1, cell2]) {
        const otherCandidates = [...grid.getCandidates(cell.row, cell.col)].filter(
          (c) => !pairCandidates.includes(c)
        );
        if (otherCandidates.length > 0) {
          eliminations.push({ position: cell, candidates: otherCandidates });
        }
      }

      // If there are eliminations, we found a useful hidden pair
      if (eliminations.length > 0) {
        const unitName = this.getUnitName(unit);
        return this.createEliminationResult(
          eliminations,
          `${this.formatCandidates(pairCandidates)} form a hidden pair in ${this.formatPosition(cell1)} and ${this.formatPosition(cell2)} in ${unitName}`,
          [cell1, cell2]
        );
      }
    }

    return null;
  }

  private samePositions(a: Position[], b: Position[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a.map((p) => `${p.row},${p.col}`));
    const setB = new Set(b.map((p) => `${p.row},${p.col}`));
    for (const pos of setA) {
      if (!setB.has(pos)) return false;
    }
    return true;
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
