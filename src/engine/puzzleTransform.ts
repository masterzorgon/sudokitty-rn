// Puzzle transformation engine — Sudoku isomorphic transformations
//
// Generates visually distinct boards from curated puzzles while preserving
// the technique that applies. A single curated puzzle can produce ~1.2 billion
// unique variants through these structure-preserving transformations:
//
//   1. Digit relabeling (permute values 1-9)          → 9! = 362,880
//   2. Row swaps within bands (3 bands × 3! each)     → 216
//   3. Column swaps within stacks (3 stacks × 3! each)→ 216
//   4. Band swaps (reorder 3-row groups)               → 6
//   5. Stack swaps (reorder 3-column groups)            → 6
//   6. Transpose (reflect over diagonal)                → 2
//
// All of these preserve row/column/box constraints and solution uniqueness.

import type { CuratedPuzzle } from './techniqueGenerator';
import { TechniqueResult } from './solver/types';
import { BOARD_SIZE, BOX_SIZE, Position } from './types';
import { CandidateGrid } from './solver/CandidateGrid';
import { ALL_TECHNIQUES } from './solver/techniques';

// ============================================
// Types
// ============================================

export interface PuzzleTransform {
  /** digitMap[oldDigit] = newDigit. Index 0 always maps to 0 (empty). */
  digitMap: number[];
  /** rowPerm[newRow] = oldRow. Preserves band structure. */
  rowPerm: number[];
  /** colPerm[newCol] = oldCol. Preserves stack structure. */
  colPerm: number[];
  /** Whether to transpose (swap rows ↔ columns) before applying perms. */
  transpose: boolean;
}

/**
 * Resolved transform with precomputed inverse mappings for efficient
 * position remapping (old → new coordinates).
 */
interface ResolvedTransform extends PuzzleTransform {
  invRowPerm: number[];
  invColPerm: number[];
}

// ============================================
// Random Helpers
// ============================================

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function invertPermutation(perm: number[]): number[] {
  const inverse = new Array(perm.length);
  for (let i = 0; i < perm.length; i++) {
    inverse[perm[i]] = i;
  }
  return inverse;
}

// ============================================
// Transform Generation
// ============================================

/** Generate a random digit relabeling: 1-9 → shuffled 1-9. Index 0 stays 0. */
function randomDigitMap(): number[] {
  const shuffled = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const map = [0]; // 0 → 0 (empty cells)
  for (let d = 1; d <= 9; d++) {
    map[d] = shuffled[d - 1];
  }
  return map;
}

/**
 * Generate a random permutation of indices 0-8 that preserves band/stack structure.
 * The 3 groups (0-2, 3-5, 6-8) can be reordered, and elements within each group
 * can be reordered independently.
 */
function randomBandPreservingPerm(): number[] {
  const groups = shuffle([0, 1, 2]);
  const perm: number[] = [];
  for (const g of groups) {
    const items = shuffle([g * BOX_SIZE, g * BOX_SIZE + 1, g * BOX_SIZE + 2]);
    perm.push(...items);
  }
  return perm;
}

/** Generate a fully random transform. */
export function randomTransform(): PuzzleTransform {
  return {
    digitMap: randomDigitMap(),
    rowPerm: randomBandPreservingPerm(),
    colPerm: randomBandPreservingPerm(),
    transpose: Math.random() < 0.5,
  };
}

/** Identity transform (no-op). Useful for testing. */
export function identityTransform(): PuzzleTransform {
  return {
    digitMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    rowPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    transpose: false,
  };
}

function resolve(t: PuzzleTransform): ResolvedTransform {
  return {
    ...t,
    invRowPerm: invertPermutation(t.rowPerm),
    invColPerm: invertPermutation(t.colPerm),
  };
}

// ============================================
// Grid Transformation
// ============================================

/**
 * Apply a transform to a 9×9 grid.
 *
 * Order of operations:
 *   1. Optionally transpose (swap rows ↔ cols)
 *   2. Apply row permutation (reorder rows)
 *   3. Apply column permutation (reorder columns)
 *   4. Apply digit relabeling
 *
 * Without transpose: result[r][c] = digitMap[grid[rowPerm[r]][colPerm[c]]]
 * With transpose:    result[r][c] = digitMap[grid[colPerm[c]][rowPerm[r]]]
 */
export function transformGrid(
  grid: number[][],
  transform: PuzzleTransform,
): number[][] {
  const { digitMap, rowPerm, colPerm, transpose } = transform;
  const result: number[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let srcRow: number, srcCol: number;
      if (transpose) {
        srcRow = colPerm[c];
        srcCol = rowPerm[r];
      } else {
        srcRow = rowPerm[r];
        srcCol = colPerm[c];
      }
      result[r][c] = digitMap[grid[srcRow][srcCol]];
    }
  }

  return result;
}

/**
 * Map a position from the original grid to the transformed grid.
 *
 * Derivation (without transpose):
 *   result[newR][newC] = digitMap[grid[rowPerm[newR]][colPerm[newC]]]
 *   For grid[oldR][oldC]: rowPerm[newR] = oldR → newR = invRowPerm[oldR]
 *                          colPerm[newC] = oldC → newC = invColPerm[oldC]
 *
 * Derivation (with transpose):
 *   result[newR][newC] = digitMap[grid[colPerm[newC]][rowPerm[newR]]]
 *   colPerm[newC] = oldR → newC = invColPerm[oldR]
 *   rowPerm[newR] = oldC → newR = invRowPerm[oldC]
 */
export function mapPosition(pos: Position, rt: ResolvedTransform): Position {
  if (rt.transpose) {
    return {
      row: rt.invRowPerm[pos.col],
      col: rt.invColPerm[pos.row],
    };
  }
  return {
    row: rt.invRowPerm[pos.row],
    col: rt.invColPerm[pos.col],
  };
}

/** Map a digit value from original to transformed. */
export function mapDigit(digit: number, transform: PuzzleTransform): number {
  return transform.digitMap[digit];
}

// ============================================
// TechniqueResult Re-derivation
// ============================================

/**
 * Re-derive a TechniqueResult by running the solver on the transformed puzzle.
 * This gives us a fresh, correct result with an accurate explanation string.
 *
 * Process:
 *   1. Create a CandidateGrid from the transformed puzzle
 *   2. Apply all techniques below the target level to exhaust simpler patterns
 *   3. Apply the target technique to get a fresh result
 */
function rederiveTechniqueResult(
  puzzle: number[][],
  techniqueName: string,
  level: number,
): TechniqueResult | null {
  const grid = new CandidateGrid(puzzle);

  // Apply simpler techniques to exhaust them (recreate the snapshot state)
  const simplerTechniques = ALL_TECHNIQUES.filter((t) => t.level < level);
  let progress = true;
  let iterations = 0;

  while (progress && iterations < 500) {
    progress = false;
    iterations++;

    for (const technique of simplerTechniques) {
      const result = technique.apply(grid);
      if (result) {
        for (const p of result.placements) {
          grid.placeValue(p.position.row, p.position.col, p.value);
        }
        for (const e of result.eliminations) {
          for (const c of e.candidates) {
            grid.eliminate(e.position.row, e.position.col, c);
          }
        }
        progress = true;
        break; // restart from simplest
      }
    }
  }

  // Now apply the target technique
  const target = ALL_TECHNIQUES.find((t) => t.name === techniqueName);
  if (!target) return null;

  return target.apply(grid);
}

// ============================================
// Manual Remapping Fallback
// ============================================

/**
 * Manually remap a CuratedPuzzle's techniqueResult positions and values.
 * Used as a fallback when re-derivation fails. The explanation string
 * is NOT updated — structured data (highlightCells, eliminations, placements)
 * is correct, but the prose text will reference old coordinates.
 */
function remapTechniqueResult(
  result: CuratedPuzzle['techniqueResult'],
  rt: ResolvedTransform,
): CuratedPuzzle['techniqueResult'] {
  return {
    techniqueName: result.techniqueName,
    level: result.level,
    explanation: result.explanation,
    highlightCells: result.highlightCells.map((p) => mapPosition(p, rt)),
    eliminations: result.eliminations.map((e) => ({
      position: mapPosition(e.position, rt),
      candidates: e.candidates.map((c) => rt.digitMap[c]),
    })),
    placements: result.placements.map((p) => ({
      position: mapPosition(p.position, rt),
      value: rt.digitMap[p.value],
    })),
  };
}

// ============================================
// Public API
// ============================================

/**
 * Apply a random isomorphic transformation to a curated puzzle.
 *
 * Transforms the puzzle/solution grids, then re-derives the TechniqueResult
 * by running the solver on the transformed puzzle. This ensures the explanation
 * text and all structured data are correct for the new coordinates/digits.
 *
 * Falls back to manual position/value remapping if re-derivation fails
 * (should be rare — indicates the transform broke the technique pattern).
 *
 * @param curated The source curated puzzle
 * @param transform Optional specific transform (random if omitted)
 * @returns A new CuratedPuzzle with transformed grids and technique result
 */
export function transformCuratedPuzzle(
  curated: CuratedPuzzle,
  transform?: PuzzleTransform,
): CuratedPuzzle {
  const t = transform ?? randomTransform();
  const rt = resolve(t);

  const newPuzzle = transformGrid(curated.puzzle, t);
  const newSolution = transformGrid(curated.solution, t);

  // Re-derive technique result from the transformed puzzle (preferred path)
  const freshResult = rederiveTechniqueResult(
    newPuzzle,
    curated.techniqueResult.techniqueName,
    curated.techniqueResult.level,
  );

  if (freshResult) {
    return {
      puzzle: newPuzzle,
      solution: newSolution,
      techniqueResult: {
        techniqueName: freshResult.techniqueName,
        level: freshResult.level,
        explanation: freshResult.explanation,
        highlightCells: freshResult.highlightCells.map((p) => ({
          row: p.row,
          col: p.col,
        })),
        eliminations: freshResult.eliminations.map((e) => ({
          position: { row: e.position.row, col: e.position.col },
          candidates: [...e.candidates],
        })),
        placements: freshResult.placements.map((p) => ({
          position: { row: p.position.row, col: p.position.col },
          value: p.value,
        })),
      },
    };
  }

  // Fallback: manually remap positions/values (explanation text may be stale)
  return {
    puzzle: newPuzzle,
    solution: newSolution,
    techniqueResult: remapTechniqueResult(curated.techniqueResult, rt),
  };
}
