import { CuratedPuzzle, CuratedPuzzleBank } from '../../engine/techniqueGenerator';

export type { CuratedPuzzle, CuratedPuzzleBank };

/** Per-level puzzle bank (subset of full bank) */
export type PartialPuzzleBank = Record<string, CuratedPuzzle[]>;
