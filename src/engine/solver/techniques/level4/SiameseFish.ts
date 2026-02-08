// Siamese Fish - Level 4 Complex Fish
// Two finned fish of the same type sharing the same base sets and all but one cover set,
// producing different eliminations. Combined into a single move.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Elimination } from '../../types';
import { BaseTechnique } from '../Technique';
import { findAllComplexFish, FishResult } from './ComplexFishFinder';

const SIZE_NAMES: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

function unitKey(u: { type: string; index: number }): string {
  return `${u.type}:${u.index}`;
}

export class SiameseFish extends BaseTechnique {
  readonly name = 'Siamese Fish';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Two finned fish sharing cells but producing different eliminations';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findSiamese(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findSiamese(
    grid: CandidateGridInterface,
    candidate: number
  ): TechniqueResult | null {
    // Find all finned complex fish for this candidate
    const allFish = findAllComplexFish(grid, candidate, [2, 3, 4], 2);
    if (allFish.length < 2) return null;

    // Group fish by (base sets, size) -- Siamese fish share the same base sets
    const groups = new Map<string, FishResult[]>();
    for (const fish of allFish) {
      const baseKey = fish.baseSets
        .map(unitKey)
        .sort()
        .join('|');
      const groupKey = `${fish.size}:${baseKey}`;
      const group = groups.get(groupKey) ?? [];
      group.push(fish);
      groups.set(groupKey, group);
    }

    // Within each group, find pairs that differ in exactly one cover set
    for (const group of groups.values()) {
      if (group.length < 2) continue;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const fish1 = group[i];
          const fish2 = group[j];

          // Check they differ in exactly one cover set
          const coverKeys1 = new Set(fish1.coverSets.map(unitKey));
          const coverKeys2 = new Set(fish2.coverSets.map(unitKey));

          let shared = 0;
          let different = 0;
          for (const k of coverKeys1) {
            if (coverKeys2.has(k)) shared++;
            else different++;
          }
          for (const k of coverKeys2) {
            if (!coverKeys1.has(k)) different++;
          }

          // Must share all but one cover set
          if (shared !== fish1.size - 1 || different !== 2) continue;

          // Check they produce DIFFERENT eliminations
          const elimKeys1 = new Set(fish1.eliminations.map((e) => posKey(e.position)));
          const elimKeys2 = new Set(fish2.eliminations.map((e) => posKey(e.position)));

          let hasUnique = false;
          for (const k of elimKeys1) if (!elimKeys2.has(k)) hasUnique = true;
          for (const k of elimKeys2) if (!elimKeys1.has(k)) hasUnique = true;
          if (!hasUnique) continue;

          // Found a Siamese pair! Combine eliminations
          const combinedElimMap = new Map<string, Elimination>();
          for (const elim of [...fish1.eliminations, ...fish2.eliminations]) {
            const key = posKey(elim.position);
            if (!combinedElimMap.has(key)) {
              combinedElimMap.set(key, elim);
            }
          }

          const combinedEliminations = Array.from(combinedElimMap.values());
          const combinedHighlight = new Map<string, Position>();
          for (const cell of [...fish1.baseCells, ...fish2.baseCells]) {
            combinedHighlight.set(posKey(cell), cell);
          }

          const sizeName = SIZE_NAMES[fish1.size] ?? `Size-${fish1.size}`;

          return this.createEliminationResult(
            combinedEliminations,
            `Siamese ${sizeName}: ${candidate} with ${combinedEliminations.length} eliminations`,
            Array.from(combinedHighlight.values())
          );
        }
      }
    }

    return null;
  }
}
