// Technique-specific puzzle generator for practice mode
// Generates puzzles where a specific technique is required to solve
//
// Strategy:
//   1. Generate complete solution
//   2. Remove cells to create puzzle at appropriate difficulty
//   3. Solve step-by-step, verify target technique appears
//   4. If target technique not found, retry (up to budget)
//   5. On failure, fall back to curated puzzle bank

import { GeneratedPuzzle } from './types';
import { SudokuSolver, TechniqueLevel, TechniqueResult, Hint, getMochiHint } from './solver';
import { CandidateGrid } from './solver/CandidateGrid';
import { ALL_TECHNIQUES } from './solver/techniques';
import { generatePuzzle } from './generator';
import { transformCuratedPuzzle } from './puzzleTransform';

// ============================================
// Types
// ============================================

export interface GenerationConfig {
  maxRetries: number;
  timeoutMs: number;
}

export interface TechniqueGenerationResult {
  success: boolean;
  puzzle?: number[][];
  solution?: number[][];
  techniqueResult?: TechniqueResult;
  hint?: Hint;
  attemptsTaken: number;
  timeMs: number;
  source: 'generated' | 'curated';
  error?: 'TIMEOUT' | 'MAX_RETRIES' | 'NO_CURATED';
}

export interface TechniqueInfo {
  id: string;
  name: string;
  level: TechniqueLevel;
}

// Map technique names to IDs
export const TECHNIQUE_IDS: Record<string, TechniqueInfo> = {
  'naked-single': { id: 'naked-single', name: 'Naked Single', level: 1 },
  'hidden-single': { id: 'hidden-single', name: 'Hidden Single', level: 1 },
  'naked-pair': { id: 'naked-pair', name: 'Naked Pair', level: 2 },
  'hidden-pair': { id: 'hidden-pair', name: 'Hidden Pair', level: 2 },
  'pointing-pair': { id: 'pointing-pair', name: 'Pointing Pair', level: 2 },
  'box-line-reduction': { id: 'box-line-reduction', name: 'Box/Line Reduction', level: 2 },
  'naked-triple': { id: 'naked-triple', name: 'Naked Triple', level: 3 },
  'hidden-triple': { id: 'hidden-triple', name: 'Hidden Triple', level: 3 },
  'x-wing': { id: 'x-wing', name: 'X-Wing', level: 3 },
  'finned-fish': { id: 'finned-fish', name: 'Finned Fish', level: 3 },
  'skyscraper': { id: 'skyscraper', name: 'Skyscraper', level: 3 },
  'two-string-kite': { id: 'two-string-kite', name: '2-String Kite', level: 3 },
  'turbot-fish': { id: 'turbot-fish', name: 'Turbot Fish', level: 3 },
  'empty-rectangle': { id: 'empty-rectangle', name: 'Empty Rectangle', level: 3 },
  'sue-de-coq': { id: 'sue-de-coq', name: 'Sue de Coq', level: 3 },
  'swordfish': { id: 'swordfish', name: 'Swordfish', level: 4 },
  'jellyfish': { id: 'jellyfish', name: 'Jellyfish', level: 4 },
  'xy-wing': { id: 'xy-wing', name: 'XY-Wing', level: 4 },
  'xyz-wing': { id: 'xyz-wing', name: 'XYZ-Wing', level: 4 },
  'wxyz-wing': { id: 'wxyz-wing', name: 'WXYZ-Wing', level: 4 },
  'unique-rectangle': { id: 'unique-rectangle', name: 'Unique Rectangle', level: 4 },
  'avoidable-rectangle': { id: 'avoidable-rectangle', name: 'Avoidable Rectangle', level: 4 },
  'bug': { id: 'bug', name: 'BUG', level: 4 },
  'almost-locked-sets': { id: 'almost-locked-sets', name: 'Almost Locked Sets', level: 4 },
  'alternating-inference-chains': { id: 'alternating-inference-chains', name: 'Alternating Inference Chains', level: 4 },
  'franken-fish': { id: 'franken-fish', name: 'Franken Fish', level: 4 },
  'mutant-fish': { id: 'mutant-fish', name: 'Mutant Fish', level: 4 },
  'siamese-fish': { id: 'siamese-fish', name: 'Siamese Fish', level: 4 },
};

// Reverse lookup: technique name -> technique ID
const TECHNIQUE_NAME_TO_ID: Record<string, string> = {};
for (const [id, info] of Object.entries(TECHNIQUE_IDS)) {
  TECHNIQUE_NAME_TO_ID[info.name] = id;
}

// ============================================
// Default Config
// ============================================

const DEFAULT_CONFIG: GenerationConfig = {
  maxRetries: 100,
  timeoutMs: 2000,
};

// Per-level difficulty mappings for puzzle generation
// We generate puzzles at the level that requires the target technique
const LEVEL_TO_DIFFICULTY: Record<TechniqueLevel, 'easy' | 'medium' | 'hard' | 'expert'> = {
  1: 'easy',
  2: 'medium',
  3: 'hard',
  4: 'expert',
};

// ============================================
// Core Generator
// ============================================

/**
 * Generate a puzzle where a specific technique is required.
 *
 * Algorithm:
 *   1. Generate a puzzle at the technique's difficulty level
 *   2. Solve step-by-step with technique tracking
 *   3. Check if the target technique is used in the solve
 *   4. If yes, return the puzzle + the first TechniqueResult for that technique
 *   5. If no, retry until budget is exhausted
 */
export function generatePuzzleForTechnique(
  techniqueId: string,
  config: GenerationConfig = DEFAULT_CONFIG,
): TechniqueGenerationResult {
  const info = TECHNIQUE_IDS[techniqueId];
  if (!info) {
    return {
      success: false,
      attemptsTaken: 0,
      timeMs: 0,
      source: 'generated',
      error: 'MAX_RETRIES',
    };
  }

  const startTime = Date.now();
  let attempts = 0;
  const difficulty = LEVEL_TO_DIFFICULTY[info.level];

  while (attempts < config.maxRetries) {
    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > config.timeoutMs) {
      return {
        success: false,
        attemptsTaken: attempts,
        timeMs: elapsed,
        source: 'generated',
        error: 'TIMEOUT',
      };
    }

    attempts++;

    // Generate a puzzle at the appropriate difficulty
    const generated = generatePuzzle(difficulty);

    // Solve step-by-step and look for the target technique
    const solver = new SudokuSolver({
      maxTechniqueLevel: info.level,
      trackSteps: true,
    });
    const solveResult = solver.solve(generated.puzzle);

    if (!solveResult.solved) continue;

    // Find the first step that uses the target technique
    const targetStep = solveResult.steps.find(
      (step) => step.techniqueName === info.name,
    );

    if (!targetStep) continue;

    // Found a puzzle that requires the target technique!
    // Now create a "snapshotted" puzzle state right before the technique applies
    // This gives us a puzzle where the user needs to apply THIS technique as the next step
    const snapshotResult = createSnapshotBeforeTechnique(
      generated.puzzle,
      generated.solution,
      info.name,
      info.level,
    );

    if (!snapshotResult) continue;

    const elapsed2 = Date.now() - startTime;

    return {
      success: true,
      puzzle: snapshotResult.puzzle,
      solution: generated.solution,
      techniqueResult: snapshotResult.techniqueResult,
      hint: techniqueResultToHint(snapshotResult.techniqueResult),
      attemptsTaken: attempts,
      timeMs: elapsed2,
      source: 'generated',
    };
  }

  const elapsed = Date.now() - startTime;
  return {
    success: false,
    attemptsTaken: attempts,
    timeMs: elapsed,
    source: 'generated',
    error: 'MAX_RETRIES',
  };
}

/**
 * Create a puzzle snapshot right before the target technique applies.
 *
 * We solve the puzzle step by step using only techniques BELOW the target technique's level,
 * then verify the target technique applies at that point.
 *
 * This gives us a partially-solved board where the target technique is the logical next step.
 */
function createSnapshotBeforeTechnique(
  originalPuzzle: number[][],
  solution: number[][],
  techniqueName: string,
  techniqueLevel: TechniqueLevel,
): { puzzle: number[][]; techniqueResult: TechniqueResult } | null {
  // Start with the original puzzle
  const puzzle = originalPuzzle.map((row) => [...row]);

  // Apply techniques below the target level to partially solve
  // This advances the board to a state where simpler techniques are exhausted
  const grid = new CandidateGrid(puzzle);
  const techniques = ALL_TECHNIQUES.filter((t) => t.level < techniqueLevel);

  // Apply simpler techniques until none apply
  let madeProgress = true;
  let iterations = 0;
  const MAX_ITERATIONS = 500;

  while (madeProgress && iterations < MAX_ITERATIONS) {
    madeProgress = false;
    iterations++;

    for (const technique of techniques) {
      const result = technique.apply(grid);
      if (result) {
        // Apply this result
        for (const placement of result.placements) {
          grid.placeValue(placement.position.row, placement.position.col, placement.value);
        }
        for (const elimination of result.eliminations) {
          for (const candidate of elimination.candidates) {
            grid.eliminate(elimination.position.row, elimination.position.col, candidate);
          }
        }
        madeProgress = true;
        break; // restart from simplest
      }
    }
  }

  // Now check if the target technique applies at this state
  const targetTechniques = ALL_TECHNIQUES.filter((t) => t.name === techniqueName);
  if (targetTechniques.length === 0) return null;

  const targetTechnique = targetTechniques[0];
  const result = targetTechnique.apply(grid);
  if (!result) return null;

  // Export the current grid state as our practice puzzle
  const snapshotPuzzle = grid.toArray();

  return {
    puzzle: snapshotPuzzle,
    techniqueResult: result,
  };
}

/**
 * Find ALL instances of a technique in a puzzle (for multi-instance validation).
 *
 * Repeatedly applies the technique, records each result, then applies it
 * (to change state) and checks again.
 */
export function findAllTechniqueInstances(
  puzzle: number[][],
  techniqueName: string,
  maxInstances: number = 10,
): TechniqueResult[] {
  const grid = new CandidateGrid(puzzle);
  const results: TechniqueResult[] = [];

  const targetTechniques = ALL_TECHNIQUES.filter((t) => t.name === techniqueName);
  if (targetTechniques.length === 0) return results;

  const technique = targetTechniques[0];

  // To find multiple instances, we need to check the grid as-is
  // For now, just return the first instance (the solver only finds one at a time)
  // A more thorough approach would clone the grid, apply, and check again
  const result = technique.apply(grid);
  if (result) {
    results.push(result);
  }

  return results;
}

/**
 * Convert a TechniqueResult to a Hint for display.
 */
function techniqueResultToHint(result: TechniqueResult): Hint {
  const targetCell = result.placements[0]?.position ?? result.eliminations[0]?.position;
  const targetValue = result.placements[0]?.value;

  return {
    techniqueName: result.techniqueName,
    level: result.level,
    targetCell: targetCell ?? { row: 0, col: 0 },
    targetValue,
    explanation: result.explanation,
    highlightCells: result.highlightCells,
    mochiHint: getMochiHint(result.techniqueName),
  };
}

// ============================================
// Curated Puzzle Support
// ============================================

export interface CuratedPuzzle {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: {
    techniqueName: string;
    level: TechniqueLevel;
    explanation: string;
    highlightCells: Array<{ row: number; col: number }>;
    eliminations: Array<{ position: { row: number; col: number }; candidates: number[] }>;
    placements: Array<{ position: { row: number; col: number }; value: number }>;
  };
}

export type CuratedPuzzleBank = Record<string, CuratedPuzzle[]>;

/**
 * Get a puzzle from the curated bank.
 *
 * Applies a random isomorphic transformation to the selected puzzle so users
 * see a visually distinct board each time, even when drawing from a small
 * curated pool. The transformation preserves the technique that applies.
 */
export function getCuratedPuzzle(
  bank: CuratedPuzzleBank,
  techniqueId: string,
  index?: number,
): TechniqueGenerationResult {
  const puzzles = bank[techniqueId];
  if (!puzzles || puzzles.length === 0) {
    return {
      success: false,
      attemptsTaken: 0,
      timeMs: 0,
      source: 'curated',
      error: 'NO_CURATED',
    };
  }

  const idx = index !== undefined ? index % puzzles.length : Math.floor(Math.random() * puzzles.length);
  const curated = puzzles[idx];

  // Apply random isomorphic transformation for variety
  const transformed = transformCuratedPuzzle(curated);

  return {
    success: true,
    puzzle: transformed.puzzle,
    solution: transformed.solution,
    techniqueResult: transformed.techniqueResult as TechniqueResult,
    hint: techniqueResultToHint(transformed.techniqueResult as TechniqueResult),
    attemptsTaken: 0,
    timeMs: 0,
    source: 'curated',
  };
}

/**
 * Generate with fallback to curated bank.
 *
 * Tries to generate a puzzle on-device first. If that fails (timeout or max retries),
 * falls back to the curated puzzle bank.
 */
export function generateWithFallback(
  techniqueId: string,
  curatedBank: CuratedPuzzleBank,
  config: GenerationConfig = DEFAULT_CONFIG,
): TechniqueGenerationResult {
  // Try generation first
  const result = generatePuzzleForTechnique(techniqueId, config);

  if (result.success) {
    return result;
  }

  // Fall back to curated bank
  const curated = getCuratedPuzzle(curatedBank, techniqueId);
  if (curated.success) {
    return {
      ...curated,
      // Preserve generation stats for analytics
      attemptsTaken: result.attemptsTaken,
      timeMs: result.timeMs,
    };
  }

  // Both failed
  return result;
}

// ============================================
// Spike / Benchmark Utilities
// ============================================

export interface BenchmarkResult {
  techniqueId: string;
  techniqueName: string;
  level: TechniqueLevel;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  avgRetries: number;
  successRate: number;
}

/**
 * Benchmark puzzle generation for a single technique.
 * Runs multiple trials and reports statistics.
 */
export function benchmarkTechnique(
  techniqueId: string,
  trials: number = 5,
  config: GenerationConfig = DEFAULT_CONFIG,
): BenchmarkResult {
  const info = TECHNIQUE_IDS[techniqueId];
  const times: number[] = [];
  const retries: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < trials; i++) {
    const result = generatePuzzleForTechnique(techniqueId, config);
    if (result.success) {
      successCount++;
      times.push(result.timeMs);
      retries.push(result.attemptsTaken);
    } else {
      failureCount++;
    }
  }

  return {
    techniqueId,
    techniqueName: info.name,
    level: info.level,
    totalAttempts: trials,
    successCount,
    failureCount,
    avgTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    minTimeMs: times.length > 0 ? Math.min(...times) : 0,
    maxTimeMs: times.length > 0 ? Math.max(...times) : 0,
    avgRetries: retries.length > 0 ? retries.reduce((a, b) => a + b, 0) / retries.length : 0,
    successRate: trials > 0 ? successCount / trials : 0,
  };
}

/**
 * Benchmark ALL techniques. Returns results sorted by success rate.
 */
export function benchmarkAllTechniques(
  trials: number = 3,
  config: GenerationConfig = DEFAULT_CONFIG,
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  for (const techniqueId of Object.keys(TECHNIQUE_IDS)) {
    results.push(benchmarkTechnique(techniqueId, trials, config));
  }

  return results.sort((a, b) => b.successRate - a.successRate);
}
