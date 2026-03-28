// Multi Colors - Level 4 Coloring Technique
//
// Uses 2+ color pairs (disconnected conjugate pair chains) for a single digit.
// After coloring all chains, checks two situations:
//
// Type 1: Two cells from different color pairs share a house (weak link).
//   Then either the opposite color of pair 1 or the opposite of pair 2 must be true.
//   Eliminate from any cell that sees both of those opposite colors.
//
// Type 2: Two cells with the same color (say 1b) each see cells with opposite colors
//   of another pair (one sees 2a, the other sees 2b). Since one of 2a/2b must be true,
//   one of the 1b cells must be false. Since all 1b cells share truth value, ALL 1b cells
//   are false. Eliminate the candidate from all 1b cells.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique } from "../Technique";

type Color = 0 | 1; // 0 = "a", 1 = "b" within a pair

interface ColorPair {
  cells: [Position[], Position[]]; // cells[0] = color a, cells[1] = color b
}

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

export class MultiColors extends BaseTechnique {
  readonly name = "Multi Colors";
  readonly level: TechniqueLevel = 4;
  readonly description = "Multiple conjugate pair colorings to find contradictions";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findMultiColors(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findMultiColors(grid: CandidateGridInterface, candidate: number): TechniqueResult | null {
    // Build conjugate pair graph
    const adjacency = new Map<string, Position[]>();
    const allCells: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
          allCells.push({ row, col });
        }
      }
    }

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (const unitType of ["row", "column", "box"] as const) {
        const cells = grid.findCellsWithCandidate({ type: unitType, index: i }, candidate);
        if (cells.length === 2) {
          const key0 = posKey(cells[0]);
          const key1 = posKey(cells[1]);
          if (!adjacency.has(key0)) adjacency.set(key0, []);
          if (!adjacency.has(key1)) adjacency.set(key1, []);
          const existing0 = adjacency.get(key0)!;
          if (!existing0.some((p) => posKey(p) === key1)) existing0.push(cells[1]);
          const existing1 = adjacency.get(key1)!;
          if (!existing1.some((p) => posKey(p) === key0)) existing1.push(cells[0]);
        }
      }
    }

    // Color all connected components
    const coloredCells = new Set<string>();
    const pairs: ColorPair[] = [];

    for (const cell of allCells) {
      const key = posKey(cell);
      if (coloredCells.has(key)) continue;
      if (!adjacency.has(key)) continue;

      // BFS to color this component
      const component: [Position[], Position[]] = [[], []];
      const queue: { pos: Position; color: Color }[] = [{ pos: cell, color: 0 }];
      const localColorMap = new Map<string, Color>();
      localColorMap.set(key, 0);

      while (queue.length > 0) {
        const { pos, color } = queue.shift()!;
        component[color].push(pos);
        coloredCells.add(posKey(pos));

        const neighbors = adjacency.get(posKey(pos)) ?? [];
        for (const neighbor of neighbors) {
          const nKey = posKey(neighbor);
          if (localColorMap.has(nKey)) continue;
          const nColor: Color = color === 0 ? 1 : 0;
          localColorMap.set(nKey, nColor);
          queue.push({ pos: neighbor, color: nColor });
        }
      }

      // Only include components with at least 2 cells
      if (component[0].length + component[1].length >= 2) {
        pairs.push({ cells: component });
      }
    }

    // Need at least 2 color pairs for Multi Colors
    if (pairs.length < 2) return null;

    // Check all combinations of 2 color pairs
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const pair1 = pairs[i];
        const pair2 = pairs[j];

        // Type 1: cells from different pairs share a house
        const type1Result = this.checkType1(grid, candidate, pair1, pair2);
        if (type1Result) return type1Result;

        // Type 2: same-color cells of pair1 see opposite colors of pair2
        const type2Result = this.checkType2(grid, candidate, pair1, pair2);
        if (type2Result) return type2Result;

        // Also check pair2 against pair1 for Type 2
        const type2ReverseResult = this.checkType2(grid, candidate, pair2, pair1);
        if (type2ReverseResult) return type2ReverseResult;
      }
    }

    return null;
  }

  /**
   * Type 1: Two cells from different color pairs share a house (weak link).
   * E.g., cell with 1b and cell with 2a are in the same row.
   * Then either all 1a cells or all 2b cells must be true.
   * Eliminate from any uncolored cell that sees both a 1a-cell and a 2b-cell.
   */
  private checkType1(
    grid: CandidateGridInterface,
    candidate: number,
    pair1: ColorPair,
    pair2: ColorPair,
  ): TechniqueResult | null {
    // Check all color combinations between the two pairs
    for (const c1 of [0, 1] as Color[]) {
      for (const c2 of [0, 1] as Color[]) {
        // Check if any cell from pair1[c1] and pair2[c2] share a house
        for (const cell1 of pair1.cells[c1]) {
          for (const cell2 of pair2.cells[c2]) {
            if (!this.seeEachOther(cell1, cell2, grid)) continue;

            // Weak link found! The opposite colors must contain the truth:
            // pair1[1-c1] or pair2[1-c2] must be true
            const oppositeColor1: Color = c1 === 0 ? 1 : 0;
            const oppositeColor2: Color = c2 === 0 ? 1 : 0;
            const mustBeTrue1 = pair1.cells[oppositeColor1];
            const mustBeTrue2 = pair2.cells[oppositeColor2];

            // Eliminate from cells that see at least one from each "must be true" group
            const allPairCells = new Set([
              ...pair1.cells[0].map(posKey),
              ...pair1.cells[1].map(posKey),
              ...pair2.cells[0].map(posKey),
              ...pair2.cells[1].map(posKey),
            ]);

            const eliminations: { position: Position; candidates: number[] }[] = [];

            for (let row = 0; row < BOARD_SIZE; row++) {
              for (let col = 0; col < BOARD_SIZE; col++) {
                if (!grid.isEmpty(row, col)) continue;
                if (!grid.hasCandidate(row, col, candidate)) continue;
                const key = posKey({ row, col });
                if (allPairCells.has(key)) continue;

                const seesGroup1 = mustBeTrue1.some((p) =>
                  this.seeEachOther({ row, col }, p, grid),
                );
                const seesGroup2 = mustBeTrue2.some((p) =>
                  this.seeEachOther({ row, col }, p, grid),
                );

                if (seesGroup1 && seesGroup2) {
                  eliminations.push({
                    position: { row, col },
                    candidates: [candidate],
                  });
                }
              }
            }

            if (eliminations.length > 0) {
              const highlightCells = [
                ...pair1.cells[0],
                ...pair1.cells[1],
                ...pair2.cells[0],
                ...pair2.cells[1],
              ];
              return this.createEliminationResult(
                eliminations,
                `Multi Colors (Type 1): ${candidate} — two color pairs linked by weak link`,
                highlightCells,
              );
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Type 2: Two cells with the same color in pair1 (say both 1b) see cells with
   * opposite colors of pair2 (one sees 2a, the other sees 2b).
   * Since one of 2a/2b must be true, one of the 1b cells must be false.
   * Since all 1b cells share truth value, ALL 1b cells are false.
   */
  private checkType2(
    grid: CandidateGridInterface,
    candidate: number,
    pair1: ColorPair,
    pair2: ColorPair,
  ): TechniqueResult | null {
    for (const targetColor of [0, 1] as Color[]) {
      const targetCells = pair1.cells[targetColor];

      // Check if any targetColor cell sees a pair2 color-a cell
      // AND any targetColor cell sees a pair2 color-b cell
      const seesColor2a = targetCells.some((tc) =>
        pair2.cells[0].some((p2) => this.seeEachOther(tc, p2, grid)),
      );
      const seesColor2b = targetCells.some((tc) =>
        pair2.cells[1].some((p2) => this.seeEachOther(tc, p2, grid)),
      );

      if (seesColor2a && seesColor2b) {
        // All cells with targetColor must be false
        const eliminations = targetCells
          .filter((pos) => grid.hasCandidate(pos.row, pos.col, candidate))
          .map((pos) => ({
            position: pos,
            candidates: [candidate],
          }));

        if (eliminations.length > 0) {
          const highlightCells = [
            ...pair1.cells[0],
            ...pair1.cells[1],
            ...pair2.cells[0],
            ...pair2.cells[1],
          ];
          const colorName = targetColor === 0 ? "a" : "b";
          return this.createEliminationResult(
            eliminations,
            `Multi Colors (Type 2): ${candidate} — color 1${colorName} sees both colors of pair 2`,
            highlightCells,
          );
        }
      }
    }

    return null;
  }

  private seeEachOther(a: Position, b: Position, grid: CandidateGridInterface): boolean {
    if (a.row === b.row) return true;
    if (a.col === b.col) return true;
    if (grid.getBoxIndex(a.row, a.col) === grid.getBoxIndex(b.row, b.col)) return true;
    return false;
  }
}
