// Forcing Net - Level 4 Last Resort Technique
//
// Extension of Forcing Chain with branching implication propagation.
// When a weak link is encountered during propagation, side branches can
// be explored to strengthen the link. This allows deeper deductions
// than simple linear chains.
//
// Same verity/contradiction logic as Forcing Chain but with branching.

import { Position } from '../../../types';
import {
  CandidateGridInterface,
  TechniqueResult,
  TechniqueLevel,
  Elimination,
} from '../../types';
import { BaseTechnique } from '../Technique';
import { BOARD_SIZE } from '../../../types';

const MAX_DEPTH = 20;
const MAX_BRANCHES = 3;

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

interface NetResult {
  placements: Map<string, number>;
  eliminations: Map<string, Set<number>>;
  contradiction: boolean;
}

export class ForcingNet extends BaseTechnique {
  readonly name = 'Forcing Net';
  readonly level: TechniqueLevel = 4;
  readonly description = 'Branching implication networks that force conclusions';

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // For each cell with 2-3 candidates, propagate with branching
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const candidates = Array.from(grid.getCandidates(row, col));
        if (candidates.length < 2 || candidates.length > 4) continue;

        const result = this.tryCellForcingNet(grid, row, col, candidates);
        if (result) return result;
      }
    }

    return null;
  }

  private tryCellForcingNet(
    grid: CandidateGridInterface,
    row: number,
    col: number,
    candidates: number[]
  ): TechniqueResult | null {
    const results: NetResult[] = [];

    for (const candidate of candidates) {
      const netResult = this.propagateNet(grid, row, col, candidate, 0);

      if (netResult.contradiction) {
        return this.createEliminationResult(
          [{ position: { row, col }, candidates: [candidate] }],
          `Forcing Net (Contradiction): ${candidate} in ${this.formatPosition({ row, col })} leads to contradiction`,
          [{ row, col }]
        );
      }

      results.push(netResult);
    }

    // Check verity: common placements across all branches
    if (results.length >= 2) {
      for (const [key, value] of results[0].placements) {
        const inAll = results.every((r) => r.placements.get(key) === value);
        if (inAll) {
          const [pRow, pCol] = key.split(',').map(Number);
          return this.createPlacementResult(
            { row: pRow, col: pCol },
            value,
            `Forcing Net (Verity): all candidates in ${this.formatPosition({ row, col })} lead to ${this.formatPosition({ row: pRow, col: pCol })}=${value}`,
            [{ row, col }, { row: pRow, col: pCol }]
          );
        }
      }

      // Check common eliminations
      for (const [key, cands] of results[0].eliminations) {
        for (const cand of cands) {
          const inAll = results.every((r) => {
            const elims = r.eliminations.get(key);
            return elims && elims.has(cand);
          });
          if (inAll) {
            const [eRow, eCol] = key.split(',').map(Number);
            return this.createEliminationResult(
              [{ position: { row: eRow, col: eCol }, candidates: [cand] }],
              `Forcing Net (Verity): all candidates in ${this.formatPosition({ row, col })} lead to elimination`,
              [{ row, col }, { row: eRow, col: eCol }]
            );
          }
        }
      }
    }

    return null;
  }

  /**
   * Propagate with branching: when a cell is reduced to 2 candidates during
   * propagation, explore both branches and merge conclusions.
   */
  private propagateNet(
    grid: CandidateGridInterface,
    startRow: number,
    startCol: number,
    startValue: number,
    branchDepth: number
  ): NetResult {
    const placements = new Map<string, number>();
    const eliminations = new Map<string, Set<number>>();
    let contradiction = false;

    // Clone candidate state
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

    const queue: Array<{ row: number; col: number; value: number }> = [
      { row: startRow, col: startCol, value: startValue },
    ];
    let depth = 0;

    while (queue.length > 0 && depth < MAX_DEPTH && !contradiction) {
      const { row, col, value } = queue.shift()!;
      depth++;

      const key = posKey(row, col);

      if (valueState[row][col] !== null) {
        if (valueState[row][col] !== value) {
          contradiction = true;
          break;
        }
        continue;
      }

      if (!candidateState[row][col].has(value)) {
        contradiction = true;
        break;
      }

      // Place value
      valueState[row][col] = value;
      candidateState[row][col].clear();
      placements.set(key, value);

      // Eliminate from peers
      const peers = grid.getPeers({ row, col });
      for (const peer of peers) {
        if (candidateState[peer.row][peer.col].has(value)) {
          candidateState[peer.row][peer.col].delete(value);
          const pKey = posKey(peer.row, peer.col);
          if (!eliminations.has(pKey)) eliminations.set(pKey, new Set());
          eliminations.get(pKey)!.add(value);

          if (candidateState[peer.row][peer.col].size === 0 && valueState[peer.row][peer.col] === null) {
            contradiction = true;
            break;
          }

          if (candidateState[peer.row][peer.col].size === 1 && valueState[peer.row][peer.col] === null) {
            const lastValue = Array.from(candidateState[peer.row][peer.col])[0];
            queue.push({ row: peer.row, col: peer.col, value: lastValue });
          }

          // Branching: if a cell is reduced to 2 candidates and we haven't branched too much,
          // explore both branches and see if they agree
          if (
            candidateState[peer.row][peer.col].size === 2 &&
            valueState[peer.row][peer.col] === null &&
            branchDepth < MAX_BRANCHES
          ) {
            const branchCands = Array.from(candidateState[peer.row][peer.col]);
            const branch1 = this.propagateNet(grid, peer.row, peer.col, branchCands[0], branchDepth + 1);
            const branch2 = this.propagateNet(grid, peer.row, peer.col, branchCands[1], branchDepth + 1);

            // If both branches agree on a placement, add it to the queue
            if (!branch1.contradiction && !branch2.contradiction) {
              for (const [bKey, bValue] of branch1.placements) {
                if (branch2.placements.get(bKey) === bValue && !placements.has(bKey)) {
                  const [bRow, bCol] = bKey.split(',').map(Number);
                  queue.push({ row: bRow, col: bCol, value: bValue });
                }
              }
              // If both branches agree on an elimination, apply it
              for (const [bKey, bCands] of branch1.eliminations) {
                for (const bCand of bCands) {
                  if (branch2.eliminations.get(bKey)?.has(bCand)) {
                    const [bRow, bCol] = bKey.split(',').map(Number);
                    if (candidateState[bRow][bCol].has(bCand)) {
                      candidateState[bRow][bCol].delete(bCand);
                      if (!eliminations.has(bKey)) eliminations.set(bKey, new Set());
                      eliminations.get(bKey)!.add(bCand);
                    }
                  }
                }
              }
            }
            // If one branch contradicts, the other must be true
            if (branch1.contradiction && !branch2.contradiction) {
              queue.push({ row: peer.row, col: peer.col, value: branchCands[1] });
            }
            if (branch2.contradiction && !branch1.contradiction) {
              queue.push({ row: peer.row, col: peer.col, value: branchCands[0] });
            }
            if (branch1.contradiction && branch2.contradiction) {
              contradiction = true;
              break;
            }
          }
        }
      }
    }

    return { placements, eliminations, contradiction };
  }
}
