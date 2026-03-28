/**
 * Lesson Data Integrity Tests (Phase 1)
 *
 * VALIDATION CONTRACT for curated lesson records:
 * --------------------------------------------
 * - puzzle must be a 9x9 matrix
 * - solution must be a 9x9 matrix
 * - puzzle values must be integers 0..9
 * - solution values must be integers 1..9
 * - each puzzle row/column/box must contain no duplicate non-zero digits
 * - each solution row/column/box must contain all digits 1..9 exactly once
 * - each non-zero given in puzzle must match the same location in solution
 * - techniqueResult.techniqueName must match the registry name for that bank key
 * - techniqueResult.level must match the registry level for that bank key
 * - every highlighted/elimination/placement coordinate must be within 0..8
 */

import { CURATED_PUZZLE_BANK } from "../../data/techniquePuzzleBank";
import { TECHNIQUE_METADATA } from "../../data/techniqueMetadata";
import { TECHNIQUE_IDS, CuratedPuzzle } from "../techniqueGenerator";
// ============================================
// Structural Validation Helpers
// ============================================

function is9x9Grid(grid: unknown): grid is number[][] {
  if (!Array.isArray(grid) || grid.length !== 9) return false;
  return grid.every((row) => Array.isArray(row) && row.length === 9);
}

function getBoxDigits(grid: number[][], boxIndex: number): number[] {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  const digits: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const v = grid[startRow + r][startCol + c];
      if (v !== 0) digits.push(v);
    }
  }
  return digits;
}

function hasDuplicates(digits: number[]): boolean {
  const seen = new Set<number>();
  for (const d of digits) {
    if (seen.has(d)) return true;
    seen.add(d);
  }
  return false;
}

function hasValidPuzzleValues(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (typeof v !== "number" || v < 0 || v > 9 || v !== Math.floor(v)) return false;
    }
  }
  return true;
}

function hasValidSolutionValues(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (typeof v !== "number" || v < 1 || v > 9 || v !== Math.floor(v)) return false;
    }
  }
  return true;
}

function puzzleGivensNoDuplicates(grid: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    const rowDigits = grid[i].filter((v) => v !== 0);
    if (hasDuplicates(rowDigits)) return false;

    const colDigits = grid.map((row) => row[i]).filter((v) => v !== 0);
    if (hasDuplicates(colDigits)) return false;

    const boxDigits = getBoxDigits(grid, i);
    if (hasDuplicates(boxDigits)) return false;
  }
  return true;
}

function solutionIsCompleteValidSudoku(grid: number[][]): boolean {
  const expected = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 9; i++) {
    const rowSet = new Set(grid[i]);
    if (!setsEqual(rowSet, expected)) return false;

    const colSet = new Set(grid.map((row) => row[i]));
    if (!setsEqual(colSet, expected)) return false;

    const boxDigits = getBoxDigits(grid, i);
    const boxSet = new Set(boxDigits);
    if (!setsEqual(boxSet, expected)) return false;
  }
  return true;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function puzzleGivensMatchSolution(puzzle: number[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== 0 && puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

function allCoordinatesInBounds(curated: CuratedPuzzle): { ok: boolean; message?: string } {
  const r = curated.techniqueResult;
  const positions = [
    ...r.highlightCells,
    ...r.eliminations.map((e) => e.position),
    ...r.placements.map((p) => p.position),
  ];
  for (const pos of positions) {
    if (!isInBounds(pos.row, pos.col)) {
      return { ok: false, message: `Out-of-bounds: (${pos.row},${pos.col})` };
    }
  }
  return { ok: true };
}

function techniqueResultMatchesRegistry(
  techniqueId: string,
  techniqueName: string,
  level: number,
): { ok: boolean; message?: string } {
  const info = TECHNIQUE_IDS[techniqueId];
  if (!info) return { ok: false, message: `Unknown technique id: ${techniqueId}` };
  if (info.name !== techniqueName) {
    return {
      ok: false,
      message: `Name mismatch: registry="${info.name}" stored="${techniqueName}"`,
    };
  }
  if (info.level !== level) {
    return { ok: false, message: `Level mismatch: registry=${info.level} stored=${level}` };
  }
  return { ok: true };
}

// ============================================
// Structural Integrity Tests
// ============================================

describe("Lesson data integrity", () => {
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId];
    const info = TECHNIQUE_IDS[techniqueId];

    if (!puzzles || puzzles.length === 0) continue;
    if (!info) continue;

    describe(`${info.name} (${techniqueId})`, () => {
      puzzles.forEach((curated, index) => {
        describe(`puzzle ${index}`, () => {
          test("puzzle shape is valid (9x9)", () => {
            expect(is9x9Grid(curated.puzzle)).toBe(true);
          });

          test("solution shape is valid (9x9)", () => {
            expect(is9x9Grid(curated.solution)).toBe(true);
          });

          test("puzzle values are in 0..9", () => {
            expect(hasValidPuzzleValues(curated.puzzle)).toBe(true);
          });

          test("solution values are in 1..9 (no zeros)", () => {
            expect(hasValidSolutionValues(curated.solution)).toBe(true);
          });

          test("puzzle givens do not violate sudoku rules", () => {
            expect(puzzleGivensNoDuplicates(curated.puzzle)).toBe(true);
          });

          test("solution is a complete valid sudoku grid", () => {
            expect(solutionIsCompleteValidSudoku(curated.solution)).toBe(true);
          });

          test("puzzle givens match stored solution", () => {
            expect(puzzleGivensMatchSolution(curated.puzzle, curated.solution)).toBe(true);
          });

          test("solution is not a placeholder copy of puzzle", () => {
            const hasZeros = curated.solution.some((row) => row.some((v) => v === 0));
            expect(hasZeros).toBe(false);
          });

          test("stored technique result metadata matches technique registry", () => {
            const result = techniqueResultMatchesRegistry(
              techniqueId,
              curated.techniqueResult.techniqueName,
              curated.techniqueResult.level,
            );
            expect(result.ok).toBe(true);
            if (!result.ok) throw new Error(result.message);
          });

          test("stored coordinates are in bounds", () => {
            const result = allCoordinatesInBounds(curated);
            expect(result.ok).toBe(true);
            if (!result.ok) throw new Error(result.message);
          });
        });
      });
    });
  }
});

// ============================================
// Registry Consistency
// ============================================

describe("Registry consistency", () => {
  test("all curated bank keys exist in TECHNIQUE_IDS", () => {
    const bankKeys = Object.keys(CURATED_PUZZLE_BANK);
    const ids = Object.keys(TECHNIQUE_IDS);
    for (const key of bankKeys) {
      expect(ids).toContain(key);
    }
  });

  test("all TECHNIQUE_IDS have matching TECHNIQUE_METADATA", () => {
    for (const [id, info] of Object.entries(TECHNIQUE_IDS)) {
      const meta = TECHNIQUE_METADATA.find((m) => m.id === id);
      expect(meta).toBeDefined();
      if (meta) {
        expect(meta.name).toBe(info.name);
        expect(meta.level).toBe(info.level);
      }
    }
  });

  test("inventory: techniques with empty curated arrays", () => {
    const empty: string[] = [];
    for (const [id, puzzles] of Object.entries(CURATED_PUZZLE_BANK)) {
      if (!puzzles || puzzles.length === 0) empty.push(id);
    }
    expect(empty).toBeDefined();
    if (empty.length > 0) {
      console.log("Techniques with no curated puzzles:", empty.join(", "));
    }
  });

  test("repair inventory: categorized list of broken vs absent", () => {
    const empty = Object.entries(CURATED_PUZZLE_BANK)
      .filter(([, puzzles]) => !puzzles || puzzles.length === 0)
      .map(([id]) => id);
    const withContent = Object.entries(CURATED_PUZZLE_BANK)
      .filter(([, puzzles]) => puzzles && puzzles.length > 0)
      .map(([id, puzzles]) => ({ id, count: puzzles!.length }));

    expect(empty).toBeDefined();
    expect(withContent.length).toBeGreaterThan(0);

    const REMOVED_INVALID = [
      "turbot-fish",
      "empty-rectangle",
      "sue-de-coq",
      "simple-colors",
      "franken-fish",
      "mutant-fish",
      "multi-colors",
      "forcing-chain",
      "almost-locked-sets",
      "siamese-fish",
    ];
    const ALREADY_EMPTY = ["templates", "forcing-net", "kraken-fish", "brute-force"];

    const removed = empty.filter((id) => REMOVED_INVALID.includes(id));
    const neverHad = empty.filter((id) => ALREADY_EMPTY.includes(id));
    const otherEmpty = empty.filter(
      (id) => !REMOVED_INVALID.includes(id) && !ALREADY_EMPTY.includes(id),
    );

    expect(removed.length + neverHad.length + otherEmpty.length).toBe(empty.length);
  });

  test("inventory: techniques with curated content", () => {
    const withContent: { id: string; count: number }[] = [];
    for (const [id, puzzles] of Object.entries(CURATED_PUZZLE_BANK)) {
      if (puzzles && puzzles.length > 0) {
        withContent.push({ id, count: puzzles.length });
      }
    }
    expect(withContent.length).toBeGreaterThan(0);
  });
});
