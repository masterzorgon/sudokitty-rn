// Franken Fish - Level 4 Complex Fish
// A fish where at least one base or cover set is a box.
// Rows and columns are NOT mixed within base or cover sets (that would be Mutant).
// Supports unfinned, finned, endo fins, and cannibalistic variants.

import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { findComplexFish, FishResult } from './ComplexFishFinder';

const SIZE_NAMES: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };

export class FrankenFish extends BaseTechnique {
  readonly name = 'Franken Fish';
  readonly level: TechniqueLevel = 4;
  readonly description = 'A fish pattern with boxes in the base or cover sets';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = findComplexFish(grid, candidate, [2, 3, 4], 2, 'franken');
      if (result) return this.toTechniqueResult(result);
    }
    return null;
  }

  private toTechniqueResult(fish: FishResult): TechniqueResult {
    const sizeName = SIZE_NAMES[fish.size] ?? `Size-${fish.size}`;
    const finPrefix = fish.fins.length > 0
      ? (fish.isCannibalistic ? 'Cannibalistic Finned ' : 'Finned ')
      : '';
    const baseSetsStr = fish.baseSets.map((u) => `${u.type[0]}${u.index + 1}`).join('');
    const coverSetsStr = fish.coverSets.map((u) => `${u.type[0]}${u.index + 1}`).join('');

    return this.createEliminationResult(
      fish.eliminations,
      `${finPrefix}Franken ${sizeName}: ${fish.candidate} ${baseSetsStr}/${coverSetsStr}`,
      fish.baseCells
    );
  }
}
