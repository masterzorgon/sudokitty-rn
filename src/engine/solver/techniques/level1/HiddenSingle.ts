// Hidden Single - Level 1 Technique
// When a candidate appears in only one cell within a unit (row/column/box),
// that cell must contain that value.

import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class HiddenSingle extends BaseTechnique {
  readonly name = 'Hidden Single';
  readonly level: TechniqueLevel = 1;
  readonly description = 'A candidate appears in only one cell of a row, column, or box';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check all units (rows, columns, boxes)
    const units: Unit[] = [];

    // Add all rows
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
    }

    // Add all columns
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'column', index: i });
    }

    // Add all boxes
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'box', index: i });
    }

    // For each unit, check each candidate 1-9
    for (const unit of units) {
      for (let candidate = 1; candidate <= 9; candidate++) {
        const cellsWithCandidate = grid.findCellsWithCandidate(unit, candidate);

        // If candidate appears in exactly one cell, it's a hidden single
        if (cellsWithCandidate.length === 1) {
          const position = cellsWithCandidate[0];

          // Skip if this is already a naked single (only 1 candidate)
          // This avoids duplicate findings with NakedSingle
          if (grid.getCandidateCount(position.row, position.col) === 1) {
            continue;
          }

          const unitName = this.getUnitName(unit);

          return this.createPlacementResult(
            position,
            candidate,
            `${candidate} can only go in ${this.formatPosition(position)} in ${unitName}`,
            [position]
          );
        }
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
