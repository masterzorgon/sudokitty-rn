// Technique Registry - exports all techniques in order of difficulty

import { Technique, TechniqueLevel } from '../types';

// Level 1 techniques
import { NakedSingle } from './level1/NakedSingle';
import { HiddenSingle } from './level1/HiddenSingle';

// Level 2 techniques
import { NakedPair } from './level2/NakedPair';
import { HiddenPair } from './level2/HiddenPair';
import { PointingPair } from './level2/PointingPair';
import { BoxLineReduction } from './level2/BoxLineReduction';

// Level 3 techniques
import { NakedTriple } from './level3/NakedTriple';
import { XWing } from './level3/XWing';

// Level 4 techniques
import { Swordfish } from './level4/Swordfish';
import { XYWing } from './level4/XYWing';

// Re-export for convenience
export { NakedSingle } from './level1/NakedSingle';
export { HiddenSingle } from './level1/HiddenSingle';
export { NakedPair } from './level2/NakedPair';
export { HiddenPair } from './level2/HiddenPair';
export { PointingPair } from './level2/PointingPair';
export { BoxLineReduction } from './level2/BoxLineReduction';
export { NakedTriple } from './level3/NakedTriple';
export { XWing } from './level3/XWing';
export { Swordfish } from './level4/Swordfish';
export { XYWing } from './level4/XYWing';

/**
 * All techniques ordered by difficulty level.
 * The solver tries them in this order - simplest first.
 */
export const ALL_TECHNIQUES: Technique[] = [
  // Level 1 - Easy
  new NakedSingle(),
  new HiddenSingle(),
  // Level 2 - Medium
  new NakedPair(),
  new HiddenPair(),
  new PointingPair(),
  new BoxLineReduction(),
  // Level 3 - Hard
  new NakedTriple(),
  new XWing(),
  // Level 4 - Expert
  new Swordfish(),
  new XYWing(),
];

/**
 * Get techniques up to a maximum level.
 */
export const getTechniquesUpToLevel = (maxLevel: TechniqueLevel): Technique[] => {
  return ALL_TECHNIQUES.filter((t) => t.level <= maxLevel);
};

/**
 * Get techniques for a specific level only.
 */
export const getTechniquesForLevel = (level: TechniqueLevel): Technique[] => {
  return ALL_TECHNIQUES.filter((t) => t.level === level);
};

/**
 * Technique names by level for display purposes.
 */
export const TECHNIQUE_NAMES_BY_LEVEL: Record<TechniqueLevel, string[]> = {
  1: ['Naked Single', 'Hidden Single'],
  2: ['Naked Pair', 'Hidden Pair', 'Pointing Pair', 'Box/Line Reduction'],
  3: ['Naked Triple', 'X-Wing'],
  4: ['Swordfish', 'XY-Wing'],
};
