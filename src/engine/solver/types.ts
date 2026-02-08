// Solver types for technique-based difficulty system

import { Position } from '../types';

/**
 * Technique difficulty levels matching DIFFICULTY_CONFIG.maxTechniqueLevel
 * Level 1: Easy (singles only)
 * Level 2: Medium (pairs, pointing)
 * Level 3: Hard (triples, X-Wing)
 * Level 4: Expert (Swordfish, XY-Wing)
 */
export type TechniqueLevel = 1 | 2 | 3 | 4;

/**
 * A unit is a row, column, or 3x3 box - the fundamental constraint groups.
 */
export type UnitType = 'row' | 'column' | 'box';

export interface Unit {
  type: UnitType;
  index: number; // 0-8 for rows/cols/boxes
}

/**
 * Elimination: removing a candidate from a cell
 */
export interface Elimination {
  position: Position;
  candidates: number[];
}

/**
 * Placement: setting a value in a cell
 */
export interface Placement {
  position: Position;
  value: number;
}

/**
 * Result of applying a solving technique.
 * Can produce eliminations (remove candidates) and/or placements (set values).
 */
export interface TechniqueResult {
  techniqueName: string;
  level: TechniqueLevel;
  eliminations: Elimination[];
  placements: Placement[];
  explanation: string; // Human-readable for hints
  highlightCells: Position[]; // Cells involved in the pattern
}

/**
 * Interface for CandidateGrid to allow techniques to query state.
 */
export interface CandidateGridInterface {
  // Value queries
  getValue(row: number, col: number): number | null;
  isEmpty(row: number, col: number): boolean;

  // Candidate queries
  getCandidates(row: number, col: number): ReadonlySet<number>;
  hasCandidate(row: number, col: number, candidate: number): boolean;
  getCandidateCount(row: number, col: number): number;

  // Unit queries - get all positions in a unit
  getRowPositions(row: number): Position[];
  getColumnPositions(col: number): Position[];
  getBoxPositions(boxIndex: number): Position[];
  getUnitPositions(unit: Unit): Position[];

  // Find cells with specific candidate in a unit
  findCellsWithCandidate(unit: Unit, candidate: number): Position[];

  // Find empty cells in a unit
  findEmptyCells(unit: Unit): Position[];

  // Peer queries (cells in same row, column, or box)
  getPeers(position: Position): Position[];

  // Box calculations
  getBoxIndex(row: number, col: number): number;
  getBoxStartPosition(boxIndex: number): Position;
}

/**
 * Interface that all solving techniques must implement.
 */
export interface Technique {
  readonly name: string;
  readonly level: TechniqueLevel;
  readonly description: string;

  /**
   * Attempts to apply this technique to the current grid state.
   * Returns null if the technique doesn't apply.
   * Returns TechniqueResult if the technique found an elimination or placement.
   */
  apply(grid: CandidateGridInterface): TechniqueResult | null;
}

/**
 * Result of solving a puzzle.
 */
export interface SolveResult {
  solved: boolean;
  maxLevelRequired: TechniqueLevel | 0; // 0 if puzzle was already solved
  techniquesUsed: Map<string, number>; // technique name -> usage count
  steps: TechniqueResult[]; // All steps taken (for hint replay)
  finalGrid: number[][] | null; // Solution if solved, null if couldn't solve
}

/**
 * Configuration for the solver.
 */
export interface SolverConfig {
  maxTechniqueLevel: TechniqueLevel;
  maxIterations?: number; // Prevent infinite loops, default 1000
  trackSteps?: boolean; // Whether to record steps (for hints), default true
}

/**
 * Hint information for the UI.
 */
export interface Hint {
  techniqueName: string;
  level: TechniqueLevel;
  targetCell: Position;
  targetValue?: number; // For placements
  explanation: string;
  highlightCells: Position[];
  mochiHint: string; // Cat-themed hint text
}

/**
 * Mochi hint messages for each technique
 */
export const MOCHI_TECHNIQUE_HINTS: Record<string, string[]> = {
  'Naked Single': [
    "psst... look for a cell with only one option~",
    "mew! there's a cell that can only be one number~",
    "*whiskers twitch* this cell has no choice but one!",
  ],
  'Hidden Single': [
    "hmm... where can this number go in the row?",
    "*whiskers twitch* only one spot for that number~",
    "look carefully... one number has only one home~",
  ],
  'Naked Pair': [
    "ooh! two cells are being sneaky with the same numbers~",
    "look for twins sharing candidates~",
    "*tilts head* two cells, two numbers... interesting~",
  ],
  'Hidden Pair': [
    "two numbers are hiding together in two cells~",
    "*curious meow* some numbers only fit in two spots!",
  ],
  'Pointing Pair': [
    "the box is pointing at something in the row~",
    "*paw gesture* look where the candidates line up!",
  ],
  'Box/Line Reduction': [
    "this row only fits that number in one box~",
    "*stretches* the line tells the box a secret~",
  ],
  'Naked Triple': [
    "three cells are sharing three numbers~",
    "*counts on paws* one, two, three cells... three numbers!",
  ],
  'Hidden Triple': [
    "three numbers are hiding together in three cells~",
    "*counts on paws* three numbers, only three possible homes!",
  ],
  'X-Wing': [
    "*stretches* time for some advanced fishing~",
    "the numbers form an X pattern!",
    "look for matching columns in two rows~",
  ],
  'Swordfish': [
    "ooh, this one's tricky... three rows, three columns~",
    "*focused stare* the fish swims in three rows!",
  ],
  'Finned Fish': [
    "almost an X-Wing, but with a little fin~",
    "*squints* the fin changes the elimination rules!",
  ],
  'Jellyfish': [
    "four rows, four columns... a rare catch!",
    "*wide eyes* the jellyfish has four tentacles~",
  ],
  'XY-Wing': [
    "three cells make a special chain~",
    "*thoughtful meow* pivot, wing, wing... got it!",
  ],
  'XYZ-Wing': [
    "like XY-Wing but the pivot has three candidates~",
    "*focused stare* X, Y, Z... all three matter!",
  ],
  'WXYZ-Wing': [
    "four cells, four candidates, one elimination~",
    "*counts on paws* W, X, Y, Z... the biggest wing!",
  ],
  'Unique Rectangle': [
    "four cells want to make a deadly rectangle~",
    "*alert ears* break the pattern to save the puzzle!",
  ],
  'Avoidable Rectangle': [
    "the solved cells anchor a dangerous rectangle~",
    "*tilts head* don't let the rectangle complete!",
  ],
  'BUG': [
    "almost every cell is bivalue... except one~",
    "*wide eyes* squash the BUG!",
  ],
  'Almost Locked Sets': [
    "two groups of cells linked by shared candidates~",
    "*thoughtful meow* the sets are almost locked...",
  ],
  'Alternating Inference Chains': [
    "follow the chain: strong, weak, strong, weak...~",
    "*traces paw* the chain reveals what to eliminate!",
  ],
  'Skyscraper': [
    "*looks up* two towers, one number... see it?",
    "the skyscraper connects two rows~",
    "*stretches tall* follow the columns up!",
  ],
  '2-String Kite': [
    "*bats at string* two strings, one box connects them~",
    "the kite flies between a row and a column!",
    "*playful swat* tug both strings to find the answer~",
  ],
  'Turbot Fish': [
    "*splashes* this fish swims through strong links~",
    "follow the chain: strong, weak, strong!",
    "*alert eyes* the turbot's path reveals the elimination~",
  ],
  'Empty Rectangle': [
    "*draws in the air* the box makes an L-shape~",
    "the empty rectangle hides a clever trick!",
    "*tilts head* the ER and the pair work together~",
  ],
  'Sue de Coq': [
    "*examines closely* two sectors, one clever trick~",
    "the intersection has too many candidates... but look at the helpers!",
    "*counts on paws* the locked sets overlap beautifully~",
  ],
  'Franken Fish': [
    "*peers into the box* this fish swims through boxes~",
    "the franken fish mixes boxes into the pattern!",
    "*alert ears* boxes as base sets open new possibilities~",
  ],
  'Mutant Fish': [
    "*wide eyes* rows and columns together? how mutant!",
    "the mutant fish has the wildest base/cover sets~",
    "*tilts head* all house types in one fish pattern~",
  ],
  'Siamese Fish': [
    "*sees double* two fish, one pattern, double eliminations!",
    "the siamese twins share cells but eliminate differently~",
    "*playful pounce* combine both fish for maximum power~",
  ],
};

/**
 * Get a random Mochi hint for a technique
 */
export const getMochiHint = (techniqueName: string): string => {
  const hints = MOCHI_TECHNIQUE_HINTS[techniqueName];
  if (!hints || hints.length === 0) {
    return `try using ${techniqueName}~`;
  }
  return hints[Math.floor(Math.random() * hints.length)];
};
