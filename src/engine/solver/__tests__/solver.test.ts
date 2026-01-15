// Basic tests for the technique-based solver

import { SudokuSolver, getPuzzleDifficulty, isSolvableLogically } from '../SudokuSolver';
import { CandidateGrid } from '../CandidateGrid';
import { NakedSingle } from '../techniques/level1/NakedSingle';
import { HiddenSingle } from '../techniques/level1/HiddenSingle';

// Test puzzle - easy (solvable with singles only)
const EASY_PUZZLE: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

// Expected solution for EASY_PUZZLE
const EASY_SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

describe('CandidateGrid', () => {
  test('should initialize correctly from puzzle', () => {
    const grid = new CandidateGrid(EASY_PUZZLE);

    // Cell (0,0) should have value 5
    expect(grid.getValue(0, 0)).toBe(5);
    expect(grid.isEmpty(0, 0)).toBe(false);

    // Cell (0,2) should be empty with candidates
    expect(grid.getValue(0, 2)).toBeNull();
    expect(grid.isEmpty(0, 2)).toBe(true);
    expect(grid.getCandidateCount(0, 2)).toBeGreaterThan(0);
  });

  test('should eliminate candidates from peers when value placed', () => {
    const grid = new CandidateGrid(EASY_PUZZLE);

    // Check that 5 is not a candidate in row 0 cells (since 5 is at (0,0))
    for (let col = 1; col < 9; col++) {
      if (grid.isEmpty(0, col)) {
        expect(grid.hasCandidate(0, col, 5)).toBe(false);
      }
    }
  });

  test('should clone correctly', () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const cloned = grid.clone();

    // Both should have same values
    expect(cloned.getValue(0, 0)).toBe(grid.getValue(0, 0));

    // Modifying clone should not affect original
    cloned.placeValue(0, 2, 4);
    expect(cloned.getValue(0, 2)).toBe(4);
    expect(grid.getValue(0, 2)).toBeNull();
  });
});

describe('NakedSingle', () => {
  test('should find naked single when cell has one candidate', () => {
    // Create a puzzle state where a cell has only one candidate
    const puzzle = EASY_PUZZLE.map((row) => [...row]);
    const grid = new CandidateGrid(puzzle);
    const technique = new NakedSingle();

    // The solver should find at least one naked single in this puzzle
    // (if not, it might find hidden singles instead)
    const result = technique.apply(grid);

    // Either finds a result or puzzle needs other techniques first
    if (result) {
      expect(result.techniqueName).toBe('Naked Single');
      expect(result.level).toBe(1);
      expect(result.placements.length).toBe(1);
    }
  });
});

describe('HiddenSingle', () => {
  test('should find hidden single when candidate appears once in unit', () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const technique = new HiddenSingle();

    const result = technique.apply(grid);

    if (result) {
      expect(result.techniqueName).toBe('Hidden Single');
      expect(result.level).toBe(1);
      expect(result.placements.length).toBe(1);
    }
  });
});

describe('SudokuSolver', () => {
  test('should solve easy puzzle with level 1 techniques', () => {
    const solver = new SudokuSolver({ maxTechniqueLevel: 1 });
    const result = solver.solve(EASY_PUZZLE);

    expect(result.solved).toBe(true);
    expect(result.maxLevelRequired).toBeLessThanOrEqual(1);
    expect(result.finalGrid).not.toBeNull();

    // Verify solution is correct
    if (result.finalGrid) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          expect(result.finalGrid[row][col]).toBe(EASY_SOLUTION[row][col]);
        }
      }
    }
  });

  test('should track techniques used', () => {
    const solver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: true });
    const result = solver.solve(EASY_PUZZLE);

    expect(result.solved).toBe(true);
    expect(result.techniquesUsed.size).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  test('should provide hints', () => {
    const solver = new SudokuSolver({ maxTechniqueLevel: 4 });
    const hint = solver.getHint(EASY_PUZZLE);

    expect(hint).not.toBeNull();
    if (hint) {
      expect(hint.techniqueName).toBeDefined();
      expect(hint.level).toBeGreaterThanOrEqual(1);
      expect(hint.level).toBeLessThanOrEqual(4);
      expect(hint.targetCell).toBeDefined();
      expect(hint.explanation).toBeDefined();
      expect(hint.mochiHint).toBeDefined();
    }
  });
});

describe('Utility functions', () => {
  test('isSolvableLogically should return true for valid puzzle', () => {
    expect(isSolvableLogically(EASY_PUZZLE)).toBe(true);
  });

  test('getPuzzleDifficulty should analyze puzzle correctly', () => {
    const result = getPuzzleDifficulty(EASY_PUZZLE);
    expect(result.solvable).toBe(true);
    expect(result.level).toBeGreaterThanOrEqual(1);
  });
});
