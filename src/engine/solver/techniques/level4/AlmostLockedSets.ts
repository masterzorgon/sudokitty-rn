// ALS-XZ (Almost Locked Sets) - Level 4 Technique
// An ALS is N cells in one unit containing exactly N+1 distinct candidates.
// The XZ-Rule: Two ALS (A and B) share a restricted common candidate X
// (all X-cells in A see all X-cells in B). Any other candidate Z appearing
// in both A and B can be eliminated from cells that see all Z-positions
// in both A and B.

import { Position } from '../../../types';
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from '../../types';
import { BaseTechnique, setUnion, combinations } from '../Technique';
import { BOARD_SIZE } from '../../../types';

interface ALSGroup {
  cells: Position[];
  candidates: Set<number>;
  unit: Unit;
}

export class AlmostLockedSets extends BaseTechnique {
  readonly name = 'Almost Locked Sets';
  readonly level: TechniqueLevel = 4;
  readonly description = 'N cells with N+1 candidates linked by shared values';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Step 1: Find all ALS groups across all units
    const allALS = this.findAllALS(grid);
    if (allALS.length < 2) return null;

    // Step 2: For each pair of ALS, try the XZ-Rule
    for (let i = 0; i < allALS.length; i++) {
      for (let j = i + 1; j < allALS.length; j++) {
        const result = this.tryXZRule(grid, allALS[i], allALS[j]);
        if (result) return result;
      }
    }

    return null;
  }

  private findAllALS(grid: CandidateGridInterface): ALSGroup[] {
    const result: ALSGroup[] = [];
    const units: Unit[] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
      units.push({ type: 'column', index: i });
      units.push({ type: 'box', index: i });
    }

    for (const unit of units) {
      const emptyCells = grid.findEmptyCells(unit);
      if (emptyCells.length < 2) continue;

      // Try groups of size 1 to 4
      const maxSize = Math.min(4, emptyCells.length);
      for (let size = 1; size <= maxSize; size++) {
        const combos = combinations(emptyCells, size);
        for (const cellGroup of combos) {
          const candidateSets = cellGroup.map((c) => grid.getCandidates(c.row, c.col));
          const union = setUnion(...candidateSets);

          // ALS: N cells with exactly N+1 candidates
          if (union.size === size + 1) {
            result.push({
              cells: cellGroup,
              candidates: union,
              unit,
            });
          }
        }
      }
    }

    // Deduplicate: same cell set can appear in multiple units
    const seen = new Set<string>();
    return result.filter((als) => {
      const key = als.cells
        .map((c) => `${c.row}-${c.col}`)
        .sort()
        .join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private tryXZRule(
    grid: CandidateGridInterface,
    alsA: ALSGroup,
    alsB: ALSGroup,
  ): TechniqueResult | null {
    // ALS A and B must not overlap
    const aCells = new Set(alsA.cells.map((c) => `${c.row}-${c.col}`));
    if (alsB.cells.some((c) => aCells.has(`${c.row}-${c.col}`))) return null;

    // Find shared candidates between A and B
    const sharedCandidates: number[] = [];
    for (const cand of alsA.candidates) {
      if (alsB.candidates.has(cand)) {
        sharedCandidates.push(cand);
      }
    }
    if (sharedCandidates.length < 2) return null; // Need at least X and Z

    // Try each pair (X, Z) where X is the restricted common candidate
    for (const X of sharedCandidates) {
      // Check if X is restricted: all X-cells in A see all X-cells in B
      const xCellsA = alsA.cells.filter((c) => grid.hasCandidate(c.row, c.col, X));
      const xCellsB = alsB.cells.filter((c) => grid.hasCandidate(c.row, c.col, X));

      if (xCellsA.length === 0 || xCellsB.length === 0) continue;

      const isRestricted = xCellsA.every((a) =>
        xCellsB.every((b) => this.isPeer(a, b)),
      );
      if (!isRestricted) continue;

      // For each other shared candidate Z, find eliminations
      for (const Z of sharedCandidates) {
        if (Z === X) continue;

        const zCellsA = alsA.cells.filter((c) => grid.hasCandidate(c.row, c.col, Z));
        const zCellsB = alsB.cells.filter((c) => grid.hasCandidate(c.row, c.col, Z));

        if (zCellsA.length === 0 || zCellsB.length === 0) continue;

        // Eliminate Z from cells that see ALL Z-positions in both A and B
        const allZCells = [...zCellsA, ...zCellsB];
        const allPatternCells = [...alsA.cells, ...alsB.cells];
        const eliminations: Array<{ position: Position; candidates: number[] }> = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (allPatternCells.some((c) => c.row === row && c.col === col)) continue;
            if (!grid.isEmpty(row, col) || !grid.hasCandidate(row, col, Z)) continue;

            const cell = { row, col };
            if (allZCells.every((zc) => this.isPeer(cell, zc))) {
              eliminations.push({ position: cell, candidates: [Z] });
            }
          }
        }

        if (eliminations.length > 0) {
          const aCandStr = [...alsA.candidates].sort((a, b) => a - b).join(',');
          const bCandStr = [...alsB.candidates].sort((a, b) => a - b).join(',');
          return this.createEliminationResult(
            eliminations,
            `ALS-XZ: A={${aCandStr}} B={${bCandStr}} X=${X} Z=${Z}`,
            allPatternCells,
          );
        }
      }
    }

    return null;
  }

  private isPeer(a: Position, b: Position): boolean {
    if (a.row === b.row) return true;
    if (a.col === b.col) return true;
    const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
    const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
    return boxA === boxB;
  }
}
