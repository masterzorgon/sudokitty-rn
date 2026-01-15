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
  'X-Wing': [
    "*stretches* time for some advanced fishing~",
    "the numbers form an X pattern!",
    "look for matching columns in two rows~",
  ],
  'Swordfish': [
    "ooh, this one's tricky... three rows, three columns~",
    "*focused stare* the fish swims in three rows!",
  ],
  'XY-Wing': [
    "three cells make a special chain~",
    "*thoughtful meow* pivot, wing, wing... got it!",
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
