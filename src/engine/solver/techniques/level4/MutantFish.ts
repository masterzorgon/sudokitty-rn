// Mutant Fish - Level 4 Complex Fish
// A fish where rows and columns are mixed in the base or cover sets.
// The most general form of fish pattern.
// Supports unfinned, finned, endo fins, and cannibalistic variants.

import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from '../../types';
import { BaseTechnique } from '../Technique';
import { findComplexFish, FishResult } from './ComplexFishFinder';

const SIZE_NAMES: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };

export class MutantFish extends BaseTechnique {
  readonly name = 'Mutant Fish';
  readonly level: TechniqueLevel = 4;
  readonly description = 'A fish pattern with rows and columns mixed in base or cover sets';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = findComplexFish(grid, candidate, [2, 3, 4], 2, 'mutant');
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
      `${finPrefix}Mutant ${sizeName}: ${fish.candidate} ${baseSetsStr}/${coverSetsStr}`,
      fish.baseCells
    );
  }
}
