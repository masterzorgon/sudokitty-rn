// Forcing Chain - Level 4 Last Resort Technique
//
// For each cell with 2+ candidates, assume each candidate is true and propagate
// implications using simple logic (naked singles, hidden singles in peers).
// - Verity: ALL candidates lead to the same conclusion → that conclusion is forced
// - Contradiction: a candidate leads to an impossible state → that candidate is false
//
// Also checks all instances of a digit in a house (if all lead to same conclusion).

import { Position, BOARD_SIZE } from "../../../types";
import {
  CandidateGridInterface,
  TechniqueResult,
  TechniqueLevel,
  Elimination,
  Placement,
} from "../../types";
import { BaseTechnique } from "../Technique";

interface Implication {
  type: "place" | "eliminate";
  row: number;
  col: number;
  value: number;
}

interface PropagationResult {
  placements: Map<string, number>; // "row,col" → value
  eliminations: Map<string, Set<number>>; // "row,col" → eliminated candidates
  contradiction: boolean;
}

const MAX_DEPTH = 15;

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export class ForcingChain extends BaseTechnique {
  readonly name = "Forcing Chain";
  readonly level: TechniqueLevel = 4;
  readonly description = "Multiple implication chains converging on the same conclusion";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Strategy 1: For each cell, try all candidates — look for verity or contradiction
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const candidates = Array.from(grid.getCandidates(row, col));
        if (candidates.length < 2) continue;

        const result = this.tryCellForcing(grid, row, col, candidates);
        if (result) return result;
      }
    }

    // Strategy 2: For each digit in each house, try all instances
    for (let candidate = 1; candidate <= 9; candidate++) {
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (const unitType of ["row", "column", "box"] as const) {
          const cells = grid.findCellsWithCandidate({ type: unitType, index: i }, candidate);
          if (cells.length < 2) continue;

          const result = this.tryHouseForcing(grid, cells, candidate, unitType, i);
          if (result) return result;
        }
      }
    }

    return null;
  }

  private tryCellForcing(
    grid: CandidateGridInterface,
    row: number,
    col: number,
    candidates: number[],
  ): TechniqueResult | null {
    const results: PropagationResult[] = [];

    for (const candidate of candidates) {
      const propResult = this.propagate(grid, row, col, candidate);

      // Contradiction: this candidate leads to impossible state → eliminate it
      if (propResult.contradiction) {
        return this.createEliminationResult(
          [{ position: { row, col }, candidates: [candidate] }],
          `Forcing Chain (Contradiction): ${candidate} in ${this.formatPosition({ row, col })} leads to contradiction`,
          [{ row, col }],
        );
      }

      results.push(propResult);
    }

    // Verity: check if ALL candidates lead to the same placement
    const commonPlacements = this.findCommonPlacements(results);
    if (commonPlacements.length > 0) {
      const { row: pRow, col: pCol, value } = commonPlacements[0];
      return this.createPlacementResult(
        { row: pRow, col: pCol },
        value,
        `Forcing Chain (Verity): all candidates in ${this.formatPosition({ row, col })} lead to ${this.formatPosition({ row: pRow, col: pCol })}=${value}`,
        [
          { row, col },
          { row: pRow, col: pCol },
        ],
      );
    }

    // Verity: check if ALL candidates lead to the same elimination
    const commonEliminations = this.findCommonEliminations(results);
    if (commonEliminations.length > 0) {
      return this.createEliminationResult(
        commonEliminations,
        `Forcing Chain (Verity): all candidates in ${this.formatPosition({ row, col })} lead to same elimination`,
        [{ row, col }, ...commonEliminations.map((e) => e.position)],
      );
    }

    return null;
  }

  private tryHouseForcing(
    grid: CandidateGridInterface,
    cells: Position[],
    candidate: number,
    unitType: string,
    unitIndex: number,
  ): TechniqueResult | null {
    const results: PropagationResult[] = [];

    for (const cell of cells) {
      const propResult = this.propagate(grid, cell.row, cell.col, candidate);
      if (propResult.contradiction) continue; // Skip contradictions for house forcing
      results.push(propResult);
    }

    if (results.length < 2) return null;

    // Check common placements
    const commonPlacements = this.findCommonPlacements(results);
    if (commonPlacements.length > 0) {
      const { row, col, value } = commonPlacements[0];
      return this.createPlacementResult(
        { row, col },
        value,
        `Forcing Chain (Verity): all ${candidate}s in ${unitType} ${unitIndex + 1} lead to ${this.formatPosition({ row, col })}=${value}`,
        [...cells, { row, col }],
      );
    }

    // Check common eliminations
    const commonEliminations = this.findCommonEliminations(results);
    if (commonEliminations.length > 0) {
      return this.createEliminationResult(
        commonEliminations,
        `Forcing Chain (Verity): all ${candidate}s in ${unitType} ${unitIndex + 1} lead to same elimination`,
        [...cells, ...commonEliminations.map((e) => e.position)],
      );
    }

    return null;
  }

  /**
   * Propagate implications from assuming candidate is placed at (row, col).
   * Uses simple constraint propagation (naked singles cascade).
   */
  private propagate(
    grid: CandidateGridInterface,
    startRow: number,
    startCol: number,
    startValue: number,
  ): PropagationResult {
    const placements = new Map<string, number>();
    const eliminations = new Map<string, Set<number>>();
    let contradiction = false;

    // Clone candidate state into mutable structures
    const candidateState: Set<number>[][] = [];
    const valueState: (number | null)[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      candidateState[r] = [];
      valueState[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        valueState[r][c] = grid.getValue(r, c);
        candidateState[r][c] = new Set(grid.getCandidates(r, c));
      }
    }

    // Queue of implications to process
    const queue: Implication[] = [
      { type: "place", row: startRow, col: startCol, value: startValue },
    ];
    let depth = 0;

    while (queue.length > 0 && depth < MAX_DEPTH && !contradiction) {
      const impl = queue.shift()!;
      depth++;

      if (impl.type === "place") {
        const key = posKey(impl.row, impl.col);

        // Check contradiction: cell already has a different value
        if (
          valueState[impl.row][impl.col] !== null &&
          valueState[impl.row][impl.col] !== impl.value
        ) {
          contradiction = true;
          break;
        }
        if (valueState[impl.row][impl.col] === impl.value) continue; // Already placed

        // Check contradiction: candidate not available
        if (
          !candidateState[impl.row][impl.col].has(impl.value) &&
          valueState[impl.row][impl.col] === null
        ) {
          contradiction = true;
          break;
        }

        // Place the value
        valueState[impl.row][impl.col] = impl.value;
        candidateState[impl.row][impl.col].clear();
        placements.set(key, impl.value);

        // Eliminate this value from all peers
        const peers = grid.getPeers({ row: impl.row, col: impl.col });
        for (const peer of peers) {
          if (candidateState[peer.row][peer.col].has(impl.value)) {
            candidateState[peer.row][peer.col].delete(impl.value);
            const pKey = posKey(peer.row, peer.col);
            if (!eliminations.has(pKey)) eliminations.set(pKey, new Set());
            eliminations.get(pKey)!.add(impl.value);

            // Check contradiction: empty candidate set with no value
            if (
              candidateState[peer.row][peer.col].size === 0 &&
              valueState[peer.row][peer.col] === null
            ) {
              contradiction = true;
              break;
            }

            // Naked single: only one candidate left
            if (
              candidateState[peer.row][peer.col].size === 1 &&
              valueState[peer.row][peer.col] === null
            ) {
              const lastValue = Array.from(candidateState[peer.row][peer.col])[0];
              queue.push({ type: "place", row: peer.row, col: peer.col, value: lastValue });
            }
          }
        }
      }
    }

    return { placements, eliminations, contradiction };
  }

  private findCommonPlacements(
    results: PropagationResult[],
  ): { row: number; col: number; value: number }[] {
    if (results.length < 2) return [];

    const common: { row: number; col: number; value: number }[] = [];

    // Find placements that appear in ALL results
    for (const [key, value] of results[0].placements) {
      const inAll = results.every((r) => r.placements.get(key) === value);
      if (inAll) {
        const [row, col] = key.split(",").map(Number);
        common.push({ row, col, value });
      }
    }

    return common;
  }

  private findCommonEliminations(results: PropagationResult[]): Elimination[] {
    if (results.length < 2) return [];

    const common: Elimination[] = [];

    // Find eliminations that appear in ALL results
    for (const [key, candidates] of results[0].eliminations) {
      const commonCands: number[] = [];
      for (const cand of candidates) {
        const inAll = results.every((r) => {
          const elims = r.eliminations.get(key);
          return elims && elims.has(cand);
        });
        if (inAll) commonCands.push(cand);
      }
      if (commonCands.length > 0) {
        const [row, col] = key.split(",").map(Number);
        common.push({ position: { row, col }, candidates: commonCands });
      }
    }

    return common;
  }
}
