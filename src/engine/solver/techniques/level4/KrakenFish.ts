// Kraken Fish - Level 4 Last Resort Technique
//
// Combines fish patterns with chains. Uses finned fish where the possible
// eliminations can't see all fins, then proves via chains that the elimination
// is still valid.
//
// Type 1: For each fin, build a chain showing the fin being true leads to
//   the same elimination. If all fin-chains converge, the elimination is valid.
//
// Type 2: For each base candidate in a cover set (plus fins), build chains
//   that all converge on the same conclusion.

import { Position, BOARD_SIZE } from "../../../types";
import {
  CandidateGridInterface,
  TechniqueResult,
  TechniqueLevel,
  Elimination,
  Unit,
  UnitType,
} from "../../types";
import { BaseTechnique, combinations } from "../Technique";

const MAX_CHAIN_DEPTH = 12;

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

function sees(a: Position, b: Position): boolean {
  if (a.row === b.row) return true;
  if (a.col === b.col) return true;
  const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
  const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
  return boxA === boxB;
}

export class KrakenFish extends BaseTechnique {
  readonly name = "Kraken Fish";
  readonly level: TechniqueLevel = 4;
  readonly description = "Fish patterns enhanced with chains to prove eliminations";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Type 1: Find finned fish where eliminations don't see all fins,
    // then try to chain from each fin to the elimination
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findKrakenType1(grid, candidate);
      if (result) return result;
    }

    return null;
  }

  private findKrakenType1(grid: CandidateGridInterface, candidate: number): TechniqueResult | null {
    // Find basic fish patterns (rows as base, columns as cover) with fins
    for (const [baseType, coverType] of [
      ["row", "column"],
      ["column", "row"],
    ] as [UnitType, UnitType][]) {
      for (let size = 2; size <= 3; size++) {
        const result = this.tryKrakenFish(grid, candidate, baseType, coverType, size);
        if (result) return result;
      }
    }
    return null;
  }

  private tryKrakenFish(
    grid: CandidateGridInterface,
    candidate: number,
    baseType: UnitType,
    coverType: UnitType,
    size: number,
  ): TechniqueResult | null {
    // Find base units with 2+ cells containing the candidate
    const validBases: { unit: Unit; cells: Position[] }[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const cells = grid.findCellsWithCandidate({ type: baseType, index: i }, candidate);
      if (cells.length >= 2 && cells.length <= size + 2) {
        validBases.push({ unit: { type: baseType, index: i }, cells });
      }
    }

    if (validBases.length < size) return null;

    const baseCombos = combinations(validBases, size);

    for (const bases of baseCombos) {
      // Collect all base cells
      const allBaseCells: Position[] = [];
      for (const base of bases) {
        allBaseCells.push(...base.cells);
      }

      // Find cover indices used by base cells
      const coverIndices = new Set<number>();
      for (const cell of allBaseCells) {
        const idx = coverType === "column" ? cell.col : cell.row;
        coverIndices.add(idx);
      }

      if (coverIndices.size < size) continue;

      // Try all size-subsets of cover indices
      const coverIdxArray = Array.from(coverIndices);
      const coverCombos = combinations(coverIdxArray, size);

      for (const coverIdxs of coverCombos) {
        const coverSet = new Set(coverIdxs);

        // Find fins: base cells NOT in any cover unit
        const fins: Position[] = [];
        const coveredBaseCells: Position[] = [];
        for (const cell of allBaseCells) {
          const idx = coverType === "column" ? cell.col : cell.row;
          if (coverSet.has(idx)) {
            coveredBaseCells.push(cell);
          } else {
            fins.push(cell);
          }
        }

        if (fins.length === 0 || fins.length > 3) continue;

        // Find possible eliminations: cells in cover units with candidate, not base cells
        const baseCellKeys = new Set(allBaseCells.map(posKey));
        const possibleElims: Position[] = [];
        for (const coverIdx of coverIdxs) {
          const cells = grid.findCellsWithCandidate(
            { type: coverType, index: coverIdx },
            candidate,
          );
          for (const cell of cells) {
            if (!baseCellKeys.has(posKey(cell))) {
              possibleElims.push(cell);
            }
          }
        }

        // For each possible elimination that DOESN'T see all fins,
        // try to build chains from each fin to prove the elimination
        for (const elimTarget of possibleElims) {
          // Check if it already sees all fins (regular finned fish handles this)
          const seesAllFins = fins.every((fin) => sees(elimTarget, fin));
          if (seesAllFins) continue; // Already handled by regular finned fish

          // Try to build a chain from each unseen fin to the elimination target
          let allFinsChain = true;
          for (const fin of fins) {
            if (sees(elimTarget, fin)) continue; // This fin is already seen
            // Try to prove: if fin is true → elimTarget can't have candidate
            if (!this.canChainFinToElim(grid, fin, elimTarget, candidate)) {
              allFinsChain = false;
              break;
            }
          }

          if (allFinsChain) {
            const highlightCells = [...allBaseCells, ...fins];
            return this.createEliminationResult(
              [{ position: elimTarget, candidates: [candidate] }],
              `Kraken Fish: ${candidate} — finned fish with chain proof from fins`,
              highlightCells,
            );
          }
        }
      }
    }

    return null;
  }

  /**
   * Try to prove via simple chain that if fin is true (has candidate placed),
   * then elimTarget cannot have the candidate.
   * Uses BFS implication propagation.
   */
  private canChainFinToElim(
    grid: CandidateGridInterface,
    fin: Position,
    elimTarget: Position,
    candidate: number,
  ): boolean {
    // Clone state and propagate from fin being true
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

    // Place candidate at fin
    const queue: { row: number; col: number; value: number }[] = [
      { row: fin.row, col: fin.col, value: candidate },
    ];
    let depth = 0;

    while (queue.length > 0 && depth < MAX_CHAIN_DEPTH) {
      const { row, col, value } = queue.shift()!;
      depth++;

      if (valueState[row][col] !== null) continue;
      if (!candidateState[row][col].has(value)) continue;

      valueState[row][col] = value;
      candidateState[row][col].clear();

      // Eliminate from peers
      const peers = grid.getPeers({ row, col });
      for (const peer of peers) {
        if (candidateState[peer.row][peer.col].has(value)) {
          candidateState[peer.row][peer.col].delete(value);

          // Check if elimTarget lost the candidate
          if (peer.row === elimTarget.row && peer.col === elimTarget.col) {
            return true; // Chain proves elimTarget can't have candidate
          }

          // Naked single cascade
          if (
            candidateState[peer.row][peer.col].size === 1 &&
            valueState[peer.row][peer.col] === null
          ) {
            const lastValue = Array.from(candidateState[peer.row][peer.col])[0];
            queue.push({ row: peer.row, col: peer.col, value: lastValue });
          }
        }
      }
    }

    // Check if elimTarget no longer has the candidate
    return !candidateState[elimTarget.row][elimTarget.col].has(candidate);
  }
}
