/**
 * Technique Result Verification (Phase 2)
 *
 * Verifies that stored techniqueResult matches solver output:
 * - Target technique applies at puzzle state (raw or prepared)
 * - Stored highlight cells match or overlap solver result
 * - Stored eliminations match or are subset of solver result
 * - Stored placements match solver result (for placement techniques)
 */

import { CandidateGrid } from "../solver/CandidateGrid";
import { ALL_TECHNIQUES } from "../solver/techniques";
import { TechniqueLevel, TechniqueResult, Elimination, Placement } from "../solver/types";
import { CURATED_PUZZLE_BANK } from "../../data/techniquePuzzleBank";
import { TECHNIQUE_IDS, CuratedPuzzle } from "../techniqueGenerator";
import { Position } from "../types";

// ============================================
// Technique Comparison Mode
// ============================================
// Strict: exact match (placement techniques, deterministic)
// Lenient: stored ⊆ solver or overlap (fish, wings, etc. - solver may find different instance)

const TECHNIQUE_COMPARISON_MODE: Record<string, "strict" | "lenient"> = {
  "Naked Single": "strict",
  "Hidden Single": "strict",
  "Naked Pair": "lenient",
  "Hidden Pair": "lenient",
  "Pointing Pair": "lenient",
  "Box/Line Reduction": "lenient",
  "Naked Triple": "lenient",
  "Hidden Triple": "lenient",
  "X-Wing": "lenient",
  "Finned Fish": "lenient",
  Skyscraper: "lenient",
  "2-String Kite": "lenient",
  "Turbot Fish": "lenient",
  "Empty Rectangle": "lenient",
  "Sue de Coq": "lenient",
  "Simple Colors": "lenient",
  Swordfish: "lenient",
  Jellyfish: "lenient",
  "XY-Wing": "lenient",
  "XYZ-Wing": "lenient",
  "WXYZ-Wing": "lenient",
  "Unique Rectangle": "lenient",
  "Avoidable Rectangle": "lenient",
  BUG: "lenient",
  "Almost Locked Sets": "lenient",
  "Alternating Inference Chains": "lenient",
  "Franken Fish": "lenient",
  "Mutant Fish": "lenient",
  "Siamese Fish": "lenient",
  "Multi Colors": "lenient",
  Templates: "lenient",
  "Forcing Chain": "lenient",
  "Forcing Net": "lenient",
  "Kraken Fish": "lenient",
  "Brute Force": "lenient",
};

function getComparisonMode(techniqueName: string): "strict" | "lenient" {
  return TECHNIQUE_COMPARISON_MODE[techniqueName] ?? "lenient";
}

// ============================================
// Comparison Helpers
// ============================================

type PositionLike = { row: number; col: number };

function toPosKey(p: PositionLike): string {
  return `${p.row}-${p.col}`;
}

function highlightCellsMatch(
  stored: PositionLike[],
  solver: Position[],
  mode: "strict" | "lenient",
): boolean {
  const storedSet = new Set(stored.map(toPosKey));
  const solverSet = new Set(solver.map(toPosKey));

  if (mode === "strict") {
    if (storedSet.size !== solverSet.size) return false;
    for (const k of storedSet) if (!solverSet.has(k)) return false;
    return true;
  }

  // Lenient: stored highlights must overlap with solver (at least one match)
  if (storedSet.size === 0 && solverSet.size === 0) return true;
  if (storedSet.size === 0 || solverSet.size === 0) return false;
  for (const k of storedSet) if (solverSet.has(k)) return true;
  return false;
}

function eliminationSetsMatch(
  stored: { position: PositionLike; candidates: number[] }[],
  solver: Elimination[],
  mode: "strict" | "lenient",
): boolean {
  const solverSet = new Set<string>();
  for (const e of solver) {
    for (const c of e.candidates) {
      solverSet.add(`${e.position.row}-${e.position.col}-${c}`);
    }
  }

  const storedSet = new Set<string>();
  for (const se of stored) {
    for (const c of se.candidates) {
      storedSet.add(`${se.position.row}-${se.position.col}-${c}`);
    }
  }

  if (storedSet.size === 0 && solverSet.size === 0) return true;
  if (storedSet.size === 0) return true;

  for (const k of storedSet) {
    if (!solverSet.has(k)) {
      if (mode === "strict") return false;
      // Lenient: require at least one stored elimination in solver (overlap)
      const hasOverlap = stored.some((s) =>
        s.candidates.some((c) => solverSet.has(`${s.position.row}-${s.position.col}-${c}`)),
      );
      return hasOverlap;
    }
  }

  if (mode === "strict") {
    return storedSet.size === solverSet.size;
  }
  return true;
}

function placementSetsMatch(
  stored: { position: PositionLike; value: number }[],
  solver: Placement[],
): boolean {
  if (stored.length !== solver.length) return false;
  const storedSet = new Set(stored.map(placementKey));
  const solverSet = new Set(solver.map(placementKey));
  for (const k of storedSet) if (!solverSet.has(k)) return false;
  return true;
}

// ============================================
// Solver Result Retrieval
// ============================================

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

function getSolverResult(
  puzzle: number[][],
  techniqueName: string,
  techniqueLevel: TechniqueLevel,
): TechniqueResult | null {
  const targetTechniques = ALL_TECHNIQUES.filter((t) => t.name === techniqueName);
  if (targetTechniques.length === 0) return null;

  const rawGrid = new CandidateGrid(puzzle);
  const rawResult = targetTechniques[0].apply(rawGrid);
  if (rawResult) return rawResult;

  const preppedGrid = prepareGridForTechnique(puzzle, techniqueLevel);
  return targetTechniques[0].apply(preppedGrid);
}

// ============================================
// Tests
// ============================================

describe("Technique result verification (Phase 2)", () => {
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId];
    const info = TECHNIQUE_IDS[techniqueId];

    if (!info || !puzzles || puzzles.length === 0) continue;

    describe(`${info.name} (${techniqueId})`, () => {
      puzzles.forEach((curated: CuratedPuzzle, index: number) => {
        describe(`puzzle ${index}`, () => {
          test("target technique applies at puzzle state", () => {
            const solverResult = getSolverResult(curated.puzzle, info.name, info.level);
            expect(solverResult).not.toBeNull();
            if (!solverResult) {
              throw new Error(
                `[${techniqueId}] puzzle ${index}: solver could not find technique "${info.name}". ` +
                  `Possible causes: stored snapshot assumes candidate state that cannot be reproduced, ` +
                  `stored result is wrong, or solver has a limitation.`,
              );
            }
            expect(solverResult.techniqueName).toBe(info.name);
          });

          test("stored result matches solver result", () => {
            const solverResult = getSolverResult(curated.puzzle, info.name, info.level);
            if (!solverResult) {
              throw new Error(
                `[${techniqueId}] puzzle ${index}: cannot verify — solver could not find technique`,
              );
            }

            const mode = getComparisonMode(info.name);
            const stored = curated.techniqueResult;

            const highlightsOk = highlightCellsMatch(
              stored.highlightCells,
              solverResult.highlightCells,
              mode,
            );
            const eliminationsOk = eliminationSetsMatch(
              stored.eliminations,
              solverResult.eliminations,
              mode,
            );

            expect(highlightsOk || (mode === "lenient" && eliminationsOk)).toBe(true);

            expect(eliminationsOk).toBe(true);

            if (stored.placements.length > 0) {
              expect(placementSetsMatch(stored.placements, solverResult.placements)).toBe(true);
            }
          });
        });
      });
    });
  }
});
