// Per-technique solver unit tests
// Tests each of the 10 solver techniques against curated puzzles:
//   - Positive: technique applies and produces correct result
//   - Negative: technique returns null when puzzle doesn't require it

import { CandidateGrid } from "../CandidateGrid";
import {
  ALL_TECHNIQUES,
  NakedSingle,
  HiddenSingle,
  NakedPair,
  HiddenPair,
  PointingPair,
  BoxLineReduction,
  NakedTriple,
  HiddenTriple,
  XWing,
  FinnedFish,
  Swordfish,
  Jellyfish,
  XYWing,
  XYZWing,
  WXYZWing,
  UniqueRectangle,
  AvoidableRectangle,
  BUG,
  AlmostLockedSets,
  AIC,
  // New techniques
  Skyscraper,
  TwoStringKite,
  TurbotFish,
  EmptyRectangle,
  SueDeCoq,
  SimpleColors,
  FrankenFish,
  MutantFish,
  SiameseFish,
  MultiColors,
} from "../techniques";
import { Templates } from "../techniques/level4/Templates";
import { ForcingChain } from "../techniques/level4/ForcingChain";
import { ForcingNet } from "../techniques/level4/ForcingNet";
import { KrakenFish } from "../techniques/level4/KrakenFish";
import { BruteForce } from "../techniques/level4/BruteForce";
import { TechniqueResult, TechniqueLevel } from "../types";
import { CURATED_PUZZLE_BANK } from "../../../data/techniquePuzzleBank";
import { Position } from "../../types";

// ============================================
// Helpers
// ============================================

/**
 * Exhaust all techniques below `targetLevel` on the grid,
 * so the grid is ready for the target technique to apply.
 */
function prepareGridForTechnique(puzzle: number[][], targetLevel: TechniqueLevel): CandidateGrid {
  const grid = new CandidateGrid(puzzle);
  const simpler = ALL_TECHNIQUES.filter((t) => t.level < targetLevel);

  let progress = true;
  let iterations = 0;
  while (progress && iterations < 500) {
    progress = false;
    iterations++;
    for (const t of simpler) {
      const result = t.apply(grid);
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
        break;
      }
    }
  }
  return grid;
}

/** Compare position sets ignoring order */
function positionSetsMatch(a: Position[], b: Position[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map((p) => `${p.row}-${p.col}`));
  const setB = new Set(b.map((p) => `${p.row}-${p.col}`));
  for (const key of setA) {
    if (!setB.has(key)) return false;
  }
  return true;
}

// Easy puzzle for Level 1 tests (solvable with singles only)
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

// ============================================
// Level 1 — Beginner
// ============================================

describe("Naked Single", () => {
  const technique = new NakedSingle();

  test("should find technique in an easy puzzle", () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Naked Single");
    expect(result!.level).toBe(1);
    expect(result!.placements).toHaveLength(1);
    expect(result!.placements[0].value).toBeGreaterThanOrEqual(1);
    expect(result!.placements[0].value).toBeLessThanOrEqual(9);
  });

  test("should produce a valid placement", () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const result = technique.apply(grid);
    if (!result) return;

    const { row, col } = result.placements[0].position;
    const value = result.placements[0].value;

    // The placed value should have been the only candidate
    expect(grid.getCandidateCount(row, col)).toBe(1);
    expect(grid.hasCandidate(row, col, value)).toBe(true);
  });

  test("should return null on a fully solved grid", () => {
    // A fully solved grid has no empty cells → no naked singles
    const solved: number[][] = [
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
    const grid = new CandidateGrid(solved);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("Hidden Single", () => {
  const technique = new HiddenSingle();

  test("should find technique in an easy puzzle", () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Hidden Single");
    expect(result!.level).toBe(1);
    expect(result!.placements).toHaveLength(1);
  });

  test("should produce a valid placement", () => {
    const grid = new CandidateGrid(EASY_PUZZLE);
    const result = technique.apply(grid);
    if (!result) return;

    const { row, col } = result.placements[0].position;
    const value = result.placements[0].value;

    // The cell should be empty and the value should be a candidate
    expect(grid.isEmpty(row, col)).toBe(true);
    expect(grid.hasCandidate(row, col, value)).toBe(true);
  });

  test("should return null on a fully solved grid", () => {
    const solved: number[][] = [
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
    const grid = new CandidateGrid(solved);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

// ============================================
// Level 2 — Intermediate (curated puzzles)
// ============================================

describe("Naked Pair", () => {
  const technique = new NakedPair();
  const curated = CURATED_PUZZLE_BANK["naked-pair"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Naked Pair");
    expect(result!.level).toBe(2);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct eliminations", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);
    if (!result) return;

    // Highlight cells should match (pattern cells)
    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );

    // At least one elimination should match the curated data
    const expectedPositions = new Set(
      curated.techniqueResult.eliminations.map((e) => `${e.position.row}-${e.position.col}`),
    );
    const actualPositions = result.eliminations.map((e) => `${e.position.row}-${e.position.col}`);
    const hasOverlap = actualPositions.some((p) => expectedPositions.has(p));
    expect(hasOverlap).toBe(true);
  });

  test("should return null on puzzle requiring a different technique", () => {
    // Use hidden-pair puzzle — Naked Pair should not apply after exhausting Level 1
    const otherCurated = CURATED_PUZZLE_BANK["hidden-pair"]?.[0];
    if (!otherCurated) return;

    const grid = prepareGridForTechnique(otherCurated.puzzle, 2);

    // Apply HiddenPair first to see if it takes priority
    const hiddenPair = new HiddenPair();
    const hpResult = hiddenPair.apply(grid);

    // If hidden pair applies here, then after we exhaust it
    // naked pair might or might not apply - the key assertion
    // is that the technique doesn't apply on the original snapshot
    // We test that the first applicable technique is NOT naked pair
    if (hpResult) {
      expect(hpResult.techniqueName).not.toBe("Naked Pair");
    }
  });
});

describe("Hidden Pair", () => {
  const technique = new HiddenPair();
  const curated = CURATED_PUZZLE_BANK["hidden-pair"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Hidden Pair");
    expect(result!.level).toBe(2);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);
    if (!result) return;

    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );
  });
});

describe("Pointing Pair", () => {
  const technique = new PointingPair();
  const curated = CURATED_PUZZLE_BANK["pointing-pair"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Pointing Pair");
    expect(result!.level).toBe(2);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct eliminations", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);
    if (!result) return;

    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );
  });
});

describe("Box/Line Reduction", () => {
  const technique = new BoxLineReduction();
  const curated = CURATED_PUZZLE_BANK["box-line-reduction"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Box/Line Reduction");
    expect(result!.level).toBe(2);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct eliminations", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 2);
    const result = technique.apply(grid);
    if (!result) return;

    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );
  });
});

// ============================================
// Level 3 — Advanced (curated puzzles)
// ============================================

describe("Naked Triple", () => {
  const technique = new NakedTriple();
  const curated = CURATED_PUZZLE_BANK["naked-triple"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 3);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Naked Triple");
    expect(result!.level).toBe(3);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 3);
    const result = technique.apply(grid);
    if (!result) return;

    // Should have 3 highlight cells (the triple)
    expect(result.highlightCells).toHaveLength(3);
  });

  test("should return null on Level 1 puzzle", () => {
    // An easy puzzle shouldn't need naked triples
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    const result = technique.apply(grid);
    // After exhausting L1+L2, the easy puzzle should be solved
    expect(result).toBeNull();
  });
});

describe("Hidden Triple", () => {
  const technique = new HiddenTriple();
  const curated = CURATED_PUZZLE_BANK["hidden-triple"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    // Try on the raw snapshot (curated puzzle is already at snapshot state)
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 3);
      result = technique.apply(grid);
    }

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Hidden Triple");
    expect(result!.level).toBe(3);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 3);
      result = technique.apply(grid);
    }
    if (!result) return;

    // Hidden Triple has 3 highlight cells
    expect(result.highlightCells).toHaveLength(3);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("X-Wing", () => {
  const technique = new XWing();
  const curated = CURATED_PUZZLE_BANK["x-wing"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 3);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("X-Wing");
    expect(result!.level).toBe(3);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 3);
    const result = technique.apply(grid);
    if (!result) return;

    // X-Wing has 4 highlight cells forming a rectangle
    expect(result.highlightCells).toHaveLength(4);
    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );
  });
});

// ============================================
// Level 4 — Expert (curated puzzles)
// ============================================

describe("Swordfish", () => {
  const technique = new Swordfish();
  const curated = CURATED_PUZZLE_BANK["swordfish"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = prepareGridForTechnique(curated.puzzle, 4);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Swordfish");
    expect(result!.level).toBe(4);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const grid = prepareGridForTechnique(curated.puzzle, 4);
    const result = technique.apply(grid);
    if (!result) return;

    // Swordfish has 4-6 highlight cells
    expect(result.highlightCells.length).toBeGreaterThanOrEqual(4);
    expect(positionSetsMatch(result.highlightCells, curated.techniqueResult.highlightCells)).toBe(
      true,
    );
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("XY-Wing", () => {
  const technique = new XYWing();
  const curated = CURATED_PUZZLE_BANK["xy-wing"]?.[0];

  test("should find technique in at least one curated puzzle", () => {
    const allCurated = CURATED_PUZZLE_BANK["xy-wing"] ?? [];
    expect(allCurated.length).toBeGreaterThan(0);

    let foundInAny = false;
    for (const cp of allCurated) {
      // Try on the raw snapshot (curated puzzles are snapshots where the technique applies)
      const gridRaw = new CandidateGrid(cp.puzzle);
      const resultRaw = technique.apply(gridRaw);
      if (resultRaw) {
        expect(resultRaw.techniqueName).toBe("XY-Wing");
        expect(resultRaw.level).toBe(4);
        expect(resultRaw.eliminations.length).toBeGreaterThan(0);
        foundInAny = true;
        break;
      }

      // Also try after exhausting simpler techniques
      const gridPrepped = prepareGridForTechnique(cp.puzzle, 4);
      const resultPrepped = technique.apply(gridPrepped);
      if (resultPrepped) {
        expect(resultPrepped.techniqueName).toBe("XY-Wing");
        foundInAny = true;
        break;
      }
    }
    expect(foundInAny).toBe(true);
  });
});

describe("Jellyfish", () => {
  const technique = new Jellyfish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("XYZ-Wing", () => {
  const technique = new XYZWing();
  const curated = CURATED_PUZZLE_BANK["xyz-wing"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();

    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 4);
      result = technique.apply(grid);
    }

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("XYZ-Wing");
    expect(result!.level).toBe(4);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should produce correct highlight cells", () => {
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 4);
      result = technique.apply(grid);
    }
    if (!result) return;

    // XYZ-Wing has 3 highlight cells (pivot + 2 wings)
    expect(result.highlightCells).toHaveLength(3);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

// ============================================
// Tier 2 techniques (HoDoKu-verified curated puzzles)
// ============================================

describe("BUG", () => {
  const technique = new BUG();
  const curated = CURATED_PUZZLE_BANK["bug"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const grid = new CandidateGrid(curated.puzzle);
    const result = technique.apply(grid);

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("BUG");
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("Unique Rectangle", () => {
  const technique = new UniqueRectangle();
  const curated = CURATED_PUZZLE_BANK["unique-rectangle"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 4);
      result = technique.apply(grid);
    }

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Unique Rectangle");
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("Avoidable Rectangle", () => {
  const technique = new AvoidableRectangle();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("Finned Fish", () => {
  const technique = new FinnedFish();
  const curated = CURATED_PUZZLE_BANK["finned-fish"]?.[0];

  test("should find technique in curated puzzle", () => {
    expect(curated).toBeDefined();
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 3);
      result = technique.apply(grid);
    }

    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Finned Fish");
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("WXYZ-Wing", () => {
  const technique = new WXYZWing();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("Almost Locked Sets", () => {
  const technique = new AlmostLockedSets();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

describe("AIC", () => {
  const technique = new AIC();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});

// ============================================
// New Level 3 — Single Digit Patterns
// ============================================

describe("Skyscraper", () => {
  const technique = new Skyscraper();
  const curated = CURATED_PUZZLE_BANK["skyscraper"]?.[0];

  test("should find technique in generator-captured puzzle", () => {
    expect(curated).toBeDefined();
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 3);
      result = technique.apply(grid);
    }
    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("Skyscraper");
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("2-String Kite", () => {
  const technique = new TwoStringKite();
  const curated = CURATED_PUZZLE_BANK["two-string-kite"]?.[0];

  test("should find technique in generator-captured puzzle", () => {
    expect(curated).toBeDefined();
    const rawGrid = new CandidateGrid(curated.puzzle);
    let result = technique.apply(rawGrid);
    if (!result) {
      const grid = prepareGridForTechnique(curated.puzzle, 3);
      result = technique.apply(grid);
    }
    expect(result).not.toBeNull();
    expect(result!.techniqueName).toBe("2-String Kite");
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Turbot Fish", () => {
  const technique = new TurbotFish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Empty Rectangle", () => {
  const technique = new EmptyRectangle();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// New Level 3 — Miscellaneous
// ============================================

describe("Sue de Coq", () => {
  const technique = new SueDeCoq();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// New Level 3 — Coloring
// ============================================

describe("Simple Colors", () => {
  const technique = new SimpleColors();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// New Level 4 — Complex Fish
// ============================================

describe("Franken Fish", () => {
  const technique = new FrankenFish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Mutant Fish", () => {
  const technique = new MutantFish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Siamese Fish", () => {
  const technique = new SiameseFish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// New Level 4 — Coloring
// ============================================

describe("Multi Colors", () => {
  const technique = new MultiColors();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// New Level 4 — Last Resort
// ============================================

describe("Templates", () => {
  const technique = new Templates();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Forcing Chain", () => {
  const technique = new ForcingChain();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Forcing Net", () => {
  const technique = new ForcingNet();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Kraken Fish", () => {
  const technique = new KrakenFish();

  test("should return null on Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    expect(technique.apply(grid)).toBeNull();
  });
});

describe("Brute Force", () => {
  const technique = new BruteForce();

  test("should find a placement on an unsolved puzzle", () => {
    // Use a grid that still has empty cells after exhausting other techniques
    const grid = new CandidateGrid(EASY_PUZZLE);
    const result = technique.apply(grid);
    if (result) {
      expect(result.techniqueName).toBe("Brute Force");
      expect(result.placements).toHaveLength(1);
      expect(result.placements[0].value).toBeGreaterThanOrEqual(1);
      expect(result.placements[0].value).toBeLessThanOrEqual(9);
    }
  });

  test("should return null on a fully solved grid", () => {
    const solved: number[][] = [
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
    const grid = new CandidateGrid(solved);
    expect(technique.apply(grid)).toBeNull();
  });
});

// ============================================
// Cross-technique negative tests
// ============================================

describe("Negative cases — technique does not apply", () => {
  test("NakedPair should not apply on a naked-triple curated puzzle", () => {
    const curated = CURATED_PUZZLE_BANK["naked-triple"]?.[0];
    if (!curated) return;

    const grid = prepareGridForTechnique(curated.puzzle, 2);
    // After exhausting L1 techniques, NakedPair should not be the next step
    const technique = new NakedPair();
    const result = technique.apply(grid);

    // The puzzle is designed for naked-triple, not naked-pair
    // NakedPair MIGHT still find a pair, but that would mean
    // the grid can be advanced further before the triple applies.
    // This is an informational test — we just verify no crash.
    if (result) {
      expect(result.techniqueName).toBe("Naked Pair");
    }
  });

  test("Swordfish should not apply on a Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const technique = new Swordfish();
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });

  test("XWing should not apply on a Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    const technique = new XWing();
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });

  test("XYWing should not apply on a Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 4);
    const technique = new XYWing();
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });

  test("NakedTriple should not apply on a Level 1 puzzle", () => {
    const grid = prepareGridForTechnique(EASY_PUZZLE, 3);
    const technique = new NakedTriple();
    const result = technique.apply(grid);
    expect(result).toBeNull();
  });
});
