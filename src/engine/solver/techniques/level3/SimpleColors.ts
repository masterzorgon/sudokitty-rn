// Simple Colors (Color Wrap / Color Trap) - Level 3 Coloring Technique
//
// Single-digit technique using two colors on conjugate pair chains.
// 1. Build a graph of conjugate pairs (houses with exactly 2 cells for the candidate)
// 2. BFS/DFS to color a connected component with alternating colors A and B
// 3. Color Wrap: two cells with the SAME color see each other → all cells with that color are false
// 4. Color Trap: an UNCOLORED cell sees cells of BOTH colors → eliminate the candidate from it

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique } from "../Technique";

type Color = "A" | "B";

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

function oppositeColor(c: Color): Color {
  return c === "A" ? "B" : "A";
}

export class SimpleColors extends BaseTechnique {
  readonly name = "Simple Colors";
  readonly level: TechniqueLevel = 3;
  readonly description = "Conjugate pair coloring to find contradictions";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findSimpleColors(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findSimpleColors(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Build conjugate pair adjacency graph
    // Each cell maps to its conjugate partner(s)
    const adjacency = new Map<string, Position[]>();
    const allCandidateCells: Position[] = [];
    const candidateCellSet = new Set<string>();

    // Find all cells with this candidate
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid.isEmpty(row, col) && grid.hasCandidate(row, col, candidate)) {
          allCandidateCells.push({ row, col });
          candidateCellSet.add(posKey({ row, col }));
        }
      }
    }

    // Build edges from conjugate pairs (houses with exactly 2 cells for this candidate)
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (const unitType of ["row", "column", "box"] as const) {
        const cells = grid.findCellsWithCandidate({ type: unitType, index: i }, candidate);
        if (cells.length === 2) {
          const key0 = posKey(cells[0]);
          const key1 = posKey(cells[1]);

          if (!adjacency.has(key0)) adjacency.set(key0, []);
          if (!adjacency.has(key1)) adjacency.set(key1, []);

          // Avoid duplicate edges
          const existing0 = adjacency.get(key0)!;
          if (!existing0.some((p) => posKey(p) === key1)) {
            existing0.push(cells[1]);
          }
          const existing1 = adjacency.get(key1)!;
          if (!existing1.some((p) => posKey(p) === key0)) {
            existing1.push(cells[0]);
          }
        }
      }
    }

    // Color connected components via BFS
    const colorMap = new Map<string, Color>();
    const colored: Position[] = [];

    for (const startCell of allCandidateCells) {
      const startKey = posKey(startCell);
      if (colorMap.has(startKey)) continue;
      if (!adjacency.has(startKey)) continue; // Isolated cell, no conjugate pairs

      // BFS to color this component
      const componentA: Position[] = [];
      const componentB: Position[] = [];
      const queue: { pos: Position; color: Color }[] = [{ pos: startCell, color: "A" }];
      colorMap.set(startKey, "A");

      while (queue.length > 0) {
        const { pos, color } = queue.shift()!;
        if (color === "A") componentA.push(pos);
        else componentB.push(pos);
        colored.push(pos);

        const neighbors = adjacency.get(posKey(pos)) ?? [];
        for (const neighbor of neighbors) {
          const nKey = posKey(neighbor);
          if (colorMap.has(nKey)) continue;
          const nColor = oppositeColor(color);
          colorMap.set(nKey, nColor);
          queue.push({ pos: neighbor, color: nColor });
        }
      }

      // Check Color Wrap: two cells with the SAME color see each other
      const wrapResult = this.checkColorWrap(grid, candidate, componentA, componentB, colorMap);
      if (wrapResult) return wrapResult;

      // Check Color Trap: uncolored cell sees both colors
      const trapResult = this.checkColorTrap(
        grid,
        candidate,
        componentA,
        componentB,
        colorMap,
        allCandidateCells,
      );
      if (trapResult) return trapResult;
    }

    return null;
  }

  /**
   * Color Wrap: If two cells with the same color are in the same house,
   * all cells with that color must be false (they can't both be true).
   */
  private checkColorWrap(
    grid: CandidateGridInterface,
    candidate: number,
    componentA: Position[],
    componentB: Position[],
    colorMap: Map<string, Color>,
  ): TechniqueResult | null {
    for (const [component, color] of [
      [componentA, "A"],
      [componentB, "B"],
    ] as [Position[], Color][]) {
      for (let i = 0; i < component.length; i++) {
        for (let j = i + 1; j < component.length; j++) {
          if (this.seeEachOther(component[i], component[j], grid)) {
            // Two same-color cells see each other → all cells with this color are false
            const eliminations = component
              .filter((pos) => grid.hasCandidate(pos.row, pos.col, candidate))
              .map((pos) => ({
                position: pos,
                candidates: [candidate],
              }));

            if (eliminations.length > 0) {
              const highlightCells = [...componentA, ...componentB];
              return this.createEliminationResult(
                eliminations,
                `Simple Colors (Color Wrap): ${candidate} — two color-${color} cells see each other`,
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
   * Color Trap: An uncolored cell that sees at least one A-cell AND at least one B-cell
   * can have the candidate eliminated (one of the two colors must be true).
   */
  private checkColorTrap(
    grid: CandidateGridInterface,
    candidate: number,
    componentA: Position[],
    componentB: Position[],
    colorMap: Map<string, Color>,
    allCandidateCells: Position[],
  ): TechniqueResult | null {
    const eliminations: { position: Position; candidates: number[] }[] = [];

    for (const cell of allCandidateCells) {
      const key = posKey(cell);
      if (colorMap.has(key)) continue; // Skip colored cells

      const seesA = componentA.some((a) => this.seeEachOther(cell, a, grid));
      const seesB = componentB.some((b) => this.seeEachOther(cell, b, grid));

      if (seesA && seesB) {
        eliminations.push({
          position: cell,
          candidates: [candidate],
        });
      }
    }

    if (eliminations.length > 0) {
      const highlightCells = [...componentA, ...componentB];
      return this.createEliminationResult(
        eliminations,
        `Simple Colors (Color Trap): ${candidate} — uncolored cells see both colors`,
        highlightCells,
      );
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
