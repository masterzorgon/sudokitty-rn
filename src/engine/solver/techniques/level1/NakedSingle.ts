// Naked Single - Level 1 Technique
// When a cell has only one candidate remaining, that must be its value.

import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

export class NakedSingle extends BaseTechnique {
  readonly name = 'Naked Single';
  readonly level: TechniqueLevel = 1;
  readonly description = 'A cell has only one possible candidate remaining';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Scan all cells for one with exactly one candidate
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;

        const candidates = grid.getCandidates(row, col);
        if (candidates.size === 1) {
          const value = [...candidates][0];
          const position = { row, col };

          return this.createPlacementResult(
            position,
            value,
            `${this.formatPosition(position)} can only be ${value} (no other candidates remain)`,
            [position]
          );
        }
      }
    }

    return null;
  }
}
