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
import { HiddenTriple } from './level3/HiddenTriple';
import { XWing } from './level3/XWing';
import { FinnedFish } from './level3/FinnedFish';
import { Skyscraper } from './level3/Skyscraper';
import { TwoStringKite } from './level3/TwoStringKite';
import { TurbotFish } from './level3/TurbotFish';
import { EmptyRectangle } from './level3/EmptyRectangle';

// Level 4 techniques
import { Swordfish } from './level4/Swordfish';
import { Jellyfish } from './level4/Jellyfish';
import { XYWing } from './level4/XYWing';
import { XYZWing } from './level4/XYZWing';
import { WXYZWing } from './level4/WXYZWing';
import { UniqueRectangle } from './level4/UniqueRectangle';
import { AvoidableRectangle } from './level4/AvoidableRectangle';
import { BUG } from './level4/BUG';
import { AlmostLockedSets } from './level4/AlmostLockedSets';
import { AIC } from './level4/AIC';

// Re-export for convenience
export { NakedSingle } from './level1/NakedSingle';
export { HiddenSingle } from './level1/HiddenSingle';
export { NakedPair } from './level2/NakedPair';
export { HiddenPair } from './level2/HiddenPair';
export { PointingPair } from './level2/PointingPair';
export { BoxLineReduction } from './level2/BoxLineReduction';
export { NakedTriple } from './level3/NakedTriple';
export { HiddenTriple } from './level3/HiddenTriple';
export { XWing } from './level3/XWing';
export { FinnedFish } from './level3/FinnedFish';
export { Skyscraper } from './level3/Skyscraper';
export { TwoStringKite } from './level3/TwoStringKite';
export { TurbotFish } from './level3/TurbotFish';
export { EmptyRectangle } from './level3/EmptyRectangle';
export { Swordfish } from './level4/Swordfish';
export { Jellyfish } from './level4/Jellyfish';
export { XYWing } from './level4/XYWing';
export { XYZWing } from './level4/XYZWing';
export { WXYZWing } from './level4/WXYZWing';
export { UniqueRectangle } from './level4/UniqueRectangle';
export { AvoidableRectangle } from './level4/AvoidableRectangle';
export { BUG } from './level4/BUG';
export { AlmostLockedSets } from './level4/AlmostLockedSets';
export { AIC } from './level4/AIC';

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
  new HiddenTriple(),
  new XWing(),
  new FinnedFish(),
  new Skyscraper(),
  new TwoStringKite(),
  new TurbotFish(),
  new EmptyRectangle(),
  // Level 4 - Expert
  new Swordfish(),
  new Jellyfish(),
  new XYWing(),
  new XYZWing(),
  new WXYZWing(),
  new UniqueRectangle(),
  new AvoidableRectangle(),
  new BUG(),
  new AlmostLockedSets(),
  new AIC(),
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
  3: ['Naked Triple', 'Hidden Triple', 'X-Wing', 'Finned Fish', 'Skyscraper', '2-String Kite', 'Turbot Fish', 'Empty Rectangle'],
  4: ['Swordfish', 'Jellyfish', 'XY-Wing', 'XYZ-Wing', 'WXYZ-Wing', 'Unique Rectangle', 'Avoidable Rectangle', 'BUG', 'Almost Locked Sets', 'Alternating Inference Chains'],
};
