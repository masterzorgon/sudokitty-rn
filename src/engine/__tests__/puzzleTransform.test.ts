// Tests for the puzzle transformation engine
//
// Validates that isomorphic transformations preserve:
//   1. Grid validity (each row/col/box has digits 1-9)
//   2. Puzzle structure (empty cells stay empty, filled stay filled)
//   3. Technique applicability (the same technique still applies)
//   4. Solution correctness (transformed solution solves transformed puzzle)

import {
  transformGrid,
  transformCuratedPuzzle,
  randomTransform,
  identityTransform,
  mapDigit,
  PuzzleTransform,
} from "../puzzleTransform";
import { validateBoard } from "../generator";
import { CURATED_PUZZLE_BANK } from "../../data/techniquePuzzleBank";
import { BOARD_SIZE } from "../types";

// ============================================
// Helpers
// ============================================

/** Count empty cells (0s) in a grid */
function countEmpty(grid: number[][]): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === 0) count++;
    }
  }
  return count;
}

/** Check that a grid has no zeros (complete solution) */
function isComplete(grid: number[][]): boolean {
  return countEmpty(grid) === 0;
}

/** Get the multiset of values in a grid (ignoring zeros) */
function valueHistogram(grid: number[][]): Map<number, number> {
  const hist = new Map<number, number>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r][c];
      if (v !== 0) {
        hist.set(v, (hist.get(v) ?? 0) + 1);
      }
    }
  }
  return hist;
}

// Access the resolve function via mapPosition indirectly
// We'll test mapPosition through transformCuratedPuzzle

// ============================================
// Identity Transform
// ============================================

describe("Identity transform", () => {
  const identity = identityTransform();

  test("identity transform produces identical grid", () => {
    const solution = CURATED_PUZZLE_BANK["naked-pair"]![0].solution;
    const result = transformGrid(solution, identity);

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(result[r][c]).toBe(solution[r][c]);
      }
    }
  });

  test("identity transform preserves puzzle with zeros", () => {
    const puzzle = CURATED_PUZZLE_BANK["naked-pair"]![0].puzzle;
    const result = transformGrid(puzzle, identity);

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(result[r][c]).toBe(puzzle[r][c]);
      }
    }
  });

  test("identity transform on curated puzzle preserves technique", () => {
    const curated = CURATED_PUZZLE_BANK["naked-pair"]![0];
    const transformed = transformCuratedPuzzle(curated, identity);

    expect(transformed.techniqueResult.techniqueName).toBe(curated.techniqueResult.techniqueName);
  });
});

// ============================================
// Grid Validity After Transform
// ============================================

describe("Grid validity after random transform", () => {
  // Test with 10 random transforms on each curated technique
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId]!;

    test(`${techniqueId}: transformed solution is a valid Sudoku board`, () => {
      for (const curated of puzzles) {
        const transform = randomTransform();
        const newSolution = transformGrid(curated.solution, transform);

        expect(isComplete(newSolution)).toBe(true);
        expect(validateBoard(newSolution)).toBe(true);
      }
    });

    test(`${techniqueId}: transformed puzzle has same number of empty cells`, () => {
      for (const curated of puzzles) {
        const transform = randomTransform();
        const newPuzzle = transformGrid(curated.puzzle, transform);
        const originalEmpty = countEmpty(curated.puzzle);
        const newEmpty = countEmpty(newPuzzle);

        expect(newEmpty).toBe(originalEmpty);
      }
    });

    test(`${techniqueId}: digit relabeling is a true permutation (each digit appears same count)`, () => {
      for (const curated of puzzles) {
        const transform = randomTransform();
        const newSolution = transformGrid(curated.solution, transform);
        const origHist = valueHistogram(curated.solution);
        const newHist = valueHistogram(newSolution);

        // Complete solutions: each digit 1-9 appears exactly 9 times
        for (let d = 1; d <= 9; d++) {
          expect(origHist.get(d)).toBe(9);
          expect(newHist.get(transform.digitMap[d])).toBe(9);
        }
      }
    });
  }
});

// ============================================
// Digit Relabeling
// ============================================

describe("Digit relabeling", () => {
  test("digit map covers all values 1-9 exactly once", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      const values = transform.digitMap.slice(1); // skip index 0
      const sorted = [...values].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  test("zero always maps to zero", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      expect(transform.digitMap[0]).toBe(0);
    }
  });

  test("mapDigit returns correct relabeling", () => {
    const transform: PuzzleTransform = {
      digitMap: [0, 5, 3, 7, 1, 9, 2, 8, 4, 6],
      rowPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: false,
    };

    expect(mapDigit(1, transform)).toBe(5);
    expect(mapDigit(2, transform)).toBe(3);
    expect(mapDigit(9, transform)).toBe(6);
    expect(mapDigit(0, transform)).toBe(0);
  });
});

// ============================================
// Row/Column Permutation Structure
// ============================================

describe("Band/stack-preserving permutations", () => {
  test("row permutation preserves band boundaries", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      const { rowPerm } = transform;

      // Each band (3 consecutive new rows) should come from the same band
      for (let band = 0; band < 3; band++) {
        const sourceBands = new Set<number>();
        for (let offset = 0; offset < 3; offset++) {
          sourceBands.add(Math.floor(rowPerm[band * 3 + offset] / 3));
        }
        // All 3 rows in this band should come from the same source band
        expect(sourceBands.size).toBe(1);
      }
    }
  });

  test("column permutation preserves stack boundaries", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      const { colPerm } = transform;

      for (let stack = 0; stack < 3; stack++) {
        const sourceStacks = new Set<number>();
        for (let offset = 0; offset < 3; offset++) {
          sourceStacks.add(Math.floor(colPerm[stack * 3 + offset] / 3));
        }
        expect(sourceStacks.size).toBe(1);
      }
    }
  });

  test("row permutation is a valid permutation of 0-8", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      const sorted = [...transform.rowPerm].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });

  test("column permutation is a valid permutation of 0-8", () => {
    for (let i = 0; i < 20; i++) {
      const transform = randomTransform();
      const sorted = [...transform.colPerm].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });
});

// ============================================
// Transpose
// ============================================

describe("Transpose", () => {
  test("transpose-only transform swaps rows and columns", () => {
    const transform: PuzzleTransform = {
      digitMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      rowPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: true,
    };

    const solution = CURATED_PUZZLE_BANK["naked-pair"]![0].solution;
    const result = transformGrid(solution, transform);

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(result[r][c]).toBe(solution[c][r]);
      }
    }
  });

  test("transposed solution is still a valid Sudoku", () => {
    const solution = CURATED_PUZZLE_BANK["naked-pair"]![0].solution;
    const transform: PuzzleTransform = {
      digitMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      rowPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: true,
    };
    const result = transformGrid(solution, transform);
    expect(validateBoard(result)).toBe(true);
  });
});

// ============================================
// Technique Preservation (Core Property)
// ============================================

describe("Technique preservation after transform", () => {
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId]!;

    test(`${techniqueId}: technique still applies after random transform (5 trials)`, () => {
      for (const curated of puzzles) {
        let successCount = 0;
        const trials = 5;

        for (let trial = 0; trial < trials; trial++) {
          const transformed = transformCuratedPuzzle(curated);

          // Verify the technique result was found
          expect(transformed.techniqueResult.techniqueName).toBe(
            curated.techniqueResult.techniqueName,
          );

          // Verify the technique result is non-trivial
          const result = transformed.techniqueResult;
          const hasOutput = result.eliminations.length > 0 || result.placements.length > 0;
          if (hasOutput) successCount++;
        }

        // At least 4/5 trials should succeed (re-derivation can rarely find a
        // different instance, but the technique name should always match)
        expect(successCount).toBeGreaterThanOrEqual(4);
      }
    });
  }
});

// ============================================
// Solution Correctness
// ============================================

describe("Transformed solution solves transformed puzzle", () => {
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId]!;

    test(`${techniqueId}: solution matches puzzle (filled cells agree)`, () => {
      for (const curated of puzzles) {
        const transformed = transformCuratedPuzzle(curated);

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const puzzleVal = transformed.puzzle[r][c];
            if (puzzleVal !== 0) {
              expect(transformed.solution[r][c]).toBe(puzzleVal);
            }
          }
        }
      }
    });
  }
});

// ============================================
// Randomness / Variety
// ============================================

describe("Transform variety", () => {
  test("two random transforms produce different grids (with very high probability)", () => {
    const curated = CURATED_PUZZLE_BANK["naked-pair"]![0];
    const t1 = transformCuratedPuzzle(curated);
    const t2 = transformCuratedPuzzle(curated);

    // Check if the grids differ (should be extremely unlikely to match)
    let differs = false;
    for (let r = 0; r < BOARD_SIZE && !differs; r++) {
      for (let c = 0; c < BOARD_SIZE && !differs; c++) {
        if (t1.puzzle[r][c] !== t2.puzzle[r][c]) differs = true;
      }
    }

    expect(differs).toBe(true);
  });

  test("random transforms produce variety of digit relabelings", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const t = randomTransform();
      seen.add(t.digitMap.join(","));
    }
    // Should see many distinct relabelings out of 50 trials
    expect(seen.size).toBeGreaterThan(30);
  });
});

// ============================================
// Edge Cases
// ============================================

describe("Edge cases", () => {
  test("transforms empty grid to empty grid", () => {
    const emptyGrid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));
    const transform = randomTransform();
    const result = transformGrid(emptyGrid, transform);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(result[r][c]).toBe(0);
      }
    }
  });

  test("transforms full grid to full grid", () => {
    const solution = CURATED_PUZZLE_BANK["naked-pair"]![0].solution;
    const transform = randomTransform();
    const result = transformGrid(solution, transform);

    expect(isComplete(result)).toBe(true);
  });

  test("specific deterministic transform produces expected output", () => {
    // Digit-only relabeling: swap 1↔2, everything else identity
    const transform: PuzzleTransform = {
      digitMap: [0, 2, 1, 3, 4, 5, 6, 7, 8, 9],
      rowPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: false,
    };

    const grid = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 1, 5, 6, 4, 8, 9, 7],
      [5, 6, 4, 8, 9, 7, 2, 3, 1],
      [8, 9, 7, 2, 3, 1, 5, 6, 4],
      [3, 1, 2, 6, 4, 5, 9, 7, 8],
      [6, 4, 5, 9, 7, 8, 3, 1, 2],
      [9, 7, 8, 3, 1, 2, 6, 4, 5],
    ];

    const result = transformGrid(grid, transform);

    // Every 1 should become 2 and every 2 should become 1
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 1) expect(result[r][c]).toBe(2);
        else if (grid[r][c] === 2) expect(result[r][c]).toBe(1);
        else expect(result[r][c]).toBe(grid[r][c]);
      }
    }
  });

  test("row swap within band produces valid grid", () => {
    // Swap rows 0 and 1 (within band 0), everything else identity
    const transform: PuzzleTransform = {
      digitMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      rowPerm: [1, 0, 2, 3, 4, 5, 6, 7, 8], // swap rows 0↔1
      colPerm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: false,
    };

    const solution = CURATED_PUZZLE_BANK["naked-pair"]![0].solution;
    const result = transformGrid(solution, transform);

    // Row 0 of result should be row 1 of original (with same digits, no relabeling)
    expect(result[0]).toEqual(solution[1]);
    expect(result[1]).toEqual(solution[0]);
    expect(result[2]).toEqual(solution[2]);

    expect(validateBoard(result)).toBe(true);
  });
});
