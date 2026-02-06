// Barrel export for curated puzzle bank
// Merges per-level puzzle banks into a single CURATED_PUZZLE_BANK

import { CuratedPuzzleBank } from '../../engine/techniqueGenerator';
import { level2Puzzles } from './level2';
import { level3Puzzles } from './level3';
import { level4Puzzles } from './level4';

export const CURATED_PUZZLE_BANK: CuratedPuzzleBank = {
  ...level2Puzzles,
  ...level3Puzzles,
  ...level4Puzzles,
};
