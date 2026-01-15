// Solver Module - Public exports

// Main solver
export { SudokuSolver, isSolvableLogically, getPuzzleDifficulty } from './SudokuSolver';

// Candidate grid for advanced usage
export { CandidateGrid } from './CandidateGrid';

// Types
export type {
  TechniqueLevel,
  TechniqueResult,
  Technique,
  SolveResult,
  SolverConfig,
  Hint,
  Unit,
  UnitType,
  Elimination,
  Placement,
  CandidateGridInterface,
} from './types';

export { getMochiHint, MOCHI_TECHNIQUE_HINTS } from './types';

// Technique registry
export {
  ALL_TECHNIQUES,
  getTechniquesUpToLevel,
  getTechniquesForLevel,
  TECHNIQUE_NAMES_BY_LEVEL,
} from './techniques';

// Individual techniques (for advanced usage)
export {
  NakedSingle,
  HiddenSingle,
  NakedPair,
  HiddenPair,
  PointingPair,
  BoxLineReduction,
  NakedTriple,
  XWing,
  Swordfish,
  XYWing,
} from './techniques';
