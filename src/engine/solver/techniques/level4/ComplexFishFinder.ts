// ComplexFishFinder - Shared general fish-finding algorithm
//
// Supports boxes as base/cover sets, exo fins, endo fins, and cannibalistic eliminations.
// Used by FrankenFish, MutantFish, and SiameseFish technique classes.

import { Position } from '../../../types';
import { CandidateGridInterface, Unit, UnitType, Elimination } from '../../types';
import { combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

// ============================================
// Types
// ============================================

export interface FishResult {
  candidate: number;
  size: number; // 2 = X-Wing, 3 = Swordfish, 4 = Jellyfish
  baseSets: Unit[];
  coverSets: Unit[];
  baseCells: Position[];   // all cells with candidate in base sets
  fins: Position[];        // exo + endo fins
  eliminations: Elimination[];
  isCannibalistic: boolean;
}

type FishType = 'franken' | 'mutant' | null;

// ============================================
// Helpers
// ============================================

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

function unitKey(u: Unit): string {
  return `${u.type}:${u.index}`;
}

/** Check if a position sees another (same row, column, or box). */
function sees(a: Position, b: Position): boolean {
  if (a.row === b.row) return true;
  if (a.col === b.col) return true;
  const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
  const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
  return boxA === boxB;
}

/** Check if a position sees ALL positions in a list. */
function seesAll(pos: Position, targets: Position[]): boolean {
  return targets.every((t) => sees(pos, t));
}

/** Classify fish type based on house types in base/cover sets. */
function classifyFish(baseSets: Unit[], coverSets: Unit[]): FishType {
  const baseTypes = new Set(baseSets.map((u) => u.type));
  const coverTypes = new Set(coverSets.map((u) => u.type));
  const allTypes = new Set([...baseTypes, ...coverTypes]);

  const hasBox = allTypes.has('box');
  const baseHasRowAndCol = baseTypes.has('row') && baseTypes.has('column');
  const coverHasRowAndCol = coverTypes.has('row') && coverTypes.has('column');

  // Basic fish: only rows/columns, no boxes, no mixing
  if (!hasBox && !baseHasRowAndCol && !coverHasRowAndCol) {
    return null; // Basic fish -- not complex
  }

  // Mutant: rows AND columns mixed in base or cover sets
  if (baseHasRowAndCol || coverHasRowAndCol) {
    return 'mutant';
  }

  // Franken: at least one box, but no row+column mixing
  if (hasBox) {
    return 'franken';
  }

  return null;
}

// ============================================
// Main Fish Finder
// ============================================

/**
 * Find a complex fish pattern for a given candidate.
 *
 * @param grid           The candidate grid
 * @param candidate      The digit to search for (1-9)
 * @param sizes          Fish sizes to try, e.g. [2, 3, 4]
 * @param maxFins        Maximum number of fins allowed
 * @param targetType     'franken' or 'mutant' -- only return fish of this type
 * @returns              FishResult or null
 */
export function findComplexFish(
  grid: CandidateGridInterface,
  candidate: number,
  sizes: number[],
  maxFins: number,
  targetType: 'franken' | 'mutant',
): FishResult | null {
  // Collect all houses that contain 2+ cells with the candidate
  const validHouses: Unit[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (const type of ['row', 'column', 'box'] as UnitType[]) {
      const cells = grid.findCellsWithCandidate({ type, index: i }, candidate);
      if (cells.length >= 2) {
        validHouses.push({ type, index: i });
      }
    }
  }

  if (validHouses.length < 2) return null;

  // Pre-compute cells per house
  const houseCells = new Map<string, Position[]>();
  for (const house of validHouses) {
    houseCells.set(
      unitKey(house),
      grid.findCellsWithCandidate(house, candidate),
    );
  }

  for (const size of sizes) {
    if (validHouses.length < size) continue;

    // Enumerate base set combinations
    const baseCombos = combinations(validHouses, size);

    for (const baseSets of baseCombos) {
      // Collect all base cells (cells with candidate in any base set)
      const baseCellMap = new Map<string, { pos: Position; baseCount: number }>();
      for (const baseUnit of baseSets) {
        const cells = houseCells.get(unitKey(baseUnit)) ?? [];
        for (const cell of cells) {
          const key = posKey(cell);
          const existing = baseCellMap.get(key);
          if (existing) {
            existing.baseCount++;
          } else {
            baseCellMap.set(key, { pos: cell, baseCount: 1 });
          }
        }
      }

      const allBaseCells = Array.from(baseCellMap.values());
      if (allBaseCells.length < size) continue; // Not enough base cells

      // Identify endo fins (cells in 2+ base sets)
      const endoFins: Position[] = allBaseCells
        .filter((bc) => bc.baseCount > 1)
        .map((bc) => bc.pos);

      // Find potential cover houses: must overlap with at least one base cell
      const baseCellKeys = new Set(allBaseCells.map((bc) => posKey(bc.pos)));
      const potentialCovers = validHouses.filter((house) => {
        // Cover must not be the same as any base set
        if (baseSets.some((b) => b.type === house.type && b.index === house.index)) return false;
        // Must contain at least one base cell
        const cells = houseCells.get(unitKey(house)) ?? [];
        return cells.some((c) => baseCellKeys.has(posKey(c)));
      });

      if (potentialCovers.length < size) continue;

      // Enumerate cover set combinations
      const coverCombos = combinations(potentialCovers, size);

      for (const coverSets of coverCombos) {
        // Classify this fish
        const fishType = classifyFish(baseSets, coverSets);
        if (fishType !== targetType) continue;

        // Collect all cover cells
        const coverCellKeys = new Set<string>();
        const allCoverCells: Position[] = [];
        for (const coverUnit of coverSets) {
          const cells = houseCells.get(unitKey(coverUnit)) ?? [];
          for (const cell of cells) {
            const key = posKey(cell);
            if (!coverCellKeys.has(key)) {
              coverCellKeys.add(key);
              allCoverCells.push(cell);
            }
          }
        }

        // Identify exo fins: base cells not in ANY cover set
        const exoFins: Position[] = allBaseCells
          .filter((bc) => !coverCellKeys.has(posKey(bc.pos)))
          .map((bc) => bc.pos);

        // Total fins = exo fins + endo fins
        // Deduplicate (an endo fin might also be an exo fin)
        const finKeys = new Set<string>();
        const allFins: Position[] = [];
        for (const fin of [...exoFins, ...endoFins]) {
          const key = posKey(fin);
          if (!finKeys.has(key)) {
            finKeys.add(key);
            allFins.push(fin);
          }
        }

        if (allFins.length > maxFins) continue;

        // Compute eliminations
        const eliminations: Elimination[] = [];

        // Standard eliminations: cover cells that are NOT base cells, with the candidate
        for (const coverCell of allCoverCells) {
          const key = posKey(coverCell);
          if (baseCellKeys.has(key)) continue;
          if (!grid.hasCandidate(coverCell.row, coverCell.col, candidate)) continue;

          // For finned fish: must see all fins
          if (allFins.length > 0 && !seesAll(coverCell, allFins)) continue;

          eliminations.push({
            position: coverCell,
            candidates: [candidate],
          });
        }

        // Cannibalistic eliminations: base cells in 2+ cover sets
        let isCannibalistic = false;
        for (const bc of allBaseCells) {
          const key = posKey(bc.pos);
          // Count how many cover sets contain this cell
          let coverCount = 0;
          for (const coverUnit of coverSets) {
            const cells = houseCells.get(unitKey(coverUnit)) ?? [];
            if (cells.some((c) => posKey(c) === key)) {
              coverCount++;
            }
          }
          if (coverCount >= 2) {
            // Cannibalistic: this base cell can be eliminated
            if (allFins.length === 0 || seesAll(bc.pos, allFins)) {
              eliminations.push({
                position: bc.pos,
                candidates: [candidate],
              });
              isCannibalistic = true;
            }
          }
        }

        if (eliminations.length > 0) {
          return {
            candidate,
            size,
            baseSets,
            coverSets,
            baseCells: allBaseCells.map((bc) => bc.pos),
            fins: allFins,
            eliminations,
            isCannibalistic,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find ALL complex fish patterns for a candidate (used by Siamese Fish).
 * Returns all valid finned fish results instead of stopping at the first.
 */
export function findAllComplexFish(
  grid: CandidateGridInterface,
  candidate: number,
  sizes: number[],
  maxFins: number,
): FishResult[] {
  const results: FishResult[] = [];

  const validHouses: Unit[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (const type of ['row', 'column', 'box'] as UnitType[]) {
      const cells = grid.findCellsWithCandidate({ type, index: i }, candidate);
      if (cells.length >= 2) {
        validHouses.push({ type, index: i });
      }
    }
  }

  if (validHouses.length < 2) return results;

  const houseCells = new Map<string, Position[]>();
  for (const house of validHouses) {
    houseCells.set(
      unitKey(house),
      grid.findCellsWithCandidate(house, candidate),
    );
  }

  for (const size of sizes) {
    if (validHouses.length < size) continue;

    const baseCombos = combinations(validHouses, size);

    for (const baseSets of baseCombos) {
      const baseCellMap = new Map<string, { pos: Position; baseCount: number }>();
      for (const baseUnit of baseSets) {
        const cells = houseCells.get(unitKey(baseUnit)) ?? [];
        for (const cell of cells) {
          const key = posKey(cell);
          const existing = baseCellMap.get(key);
          if (existing) {
            existing.baseCount++;
          } else {
            baseCellMap.set(key, { pos: cell, baseCount: 1 });
          }
        }
      }

      const allBaseCells = Array.from(baseCellMap.values());
      if (allBaseCells.length < size) continue;

      const endoFins = allBaseCells.filter((bc) => bc.baseCount > 1).map((bc) => bc.pos);
      const baseCellKeys = new Set(allBaseCells.map((bc) => posKey(bc.pos)));

      const potentialCovers = validHouses.filter((house) => {
        if (baseSets.some((b) => b.type === house.type && b.index === house.index)) return false;
        const cells = houseCells.get(unitKey(house)) ?? [];
        return cells.some((c) => baseCellKeys.has(posKey(c)));
      });

      if (potentialCovers.length < size) continue;

      const coverCombos = combinations(potentialCovers, size);

      for (const coverSets of coverCombos) {
        const fishType = classifyFish(baseSets, coverSets);
        if (fishType === null) continue; // Skip basic fish

        const coverCellKeys = new Set<string>();
        const allCoverCells: Position[] = [];
        for (const coverUnit of coverSets) {
          const cells = houseCells.get(unitKey(coverUnit)) ?? [];
          for (const cell of cells) {
            const key = posKey(cell);
            if (!coverCellKeys.has(key)) {
              coverCellKeys.add(key);
              allCoverCells.push(cell);
            }
          }
        }

        const exoFins = allBaseCells
          .filter((bc) => !coverCellKeys.has(posKey(bc.pos)))
          .map((bc) => bc.pos);

        const finKeys = new Set<string>();
        const allFins: Position[] = [];
        for (const fin of [...exoFins, ...endoFins]) {
          const key = posKey(fin);
          if (!finKeys.has(key)) {
            finKeys.add(key);
            allFins.push(fin);
          }
        }

        // Only finned fish for Siamese
        if (allFins.length === 0 || allFins.length > maxFins) continue;

        const eliminations: Elimination[] = [];

        for (const coverCell of allCoverCells) {
          const key = posKey(coverCell);
          if (baseCellKeys.has(key)) continue;
          if (!grid.hasCandidate(coverCell.row, coverCell.col, candidate)) continue;
          if (!seesAll(coverCell, allFins)) continue;
          eliminations.push({ position: coverCell, candidates: [candidate] });
        }

        let isCannibalistic = false;
        for (const bc of allBaseCells) {
          let coverCount = 0;
          for (const coverUnit of coverSets) {
            const cells = houseCells.get(unitKey(coverUnit)) ?? [];
            if (cells.some((c) => posKey(c) === posKey(bc.pos))) coverCount++;
          }
          if (coverCount >= 2 && seesAll(bc.pos, allFins)) {
            eliminations.push({ position: bc.pos, candidates: [candidate] });
            isCannibalistic = true;
          }
        }

        if (eliminations.length > 0) {
          results.push({
            candidate,
            size,
            baseSets,
            coverSets,
            baseCells: allBaseCells.map((bc) => bc.pos),
            fins: allFins,
            eliminations,
            isCannibalistic,
          });
        }
      }
    }
  }

  return results;
}
