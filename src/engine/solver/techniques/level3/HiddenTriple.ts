// Hidden Triple - Level 3 Technique
// When three candidates appear in only three cells of a unit,
// all other candidates can be eliminated from those three cells.
// Generalization of Hidden Pair from 2 → 3.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from "../../types";
import { BaseTechnique, combinations } from "../Technique";

export class HiddenTriple extends BaseTechnique {
  readonly name = "Hidden Triple";
  readonly level: TechniqueLevel = 3;
  readonly description = "Three candidates appear in only three cells of a unit";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Check all 27 units (9 rows + 9 columns + 9 boxes)
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: "row", index: i });
      units.push({ type: "column", index: i });
      units.push({ type: "box", index: i });
    }

    for (const unit of units) {
      const result = this.findHiddenTripleInUnit(grid, unit);
      if (result) return result;
    }

    return null;
  }

  private findHiddenTripleInUnit(grid: CandidateGridInterface, unit: Unit): TechniqueResult | null {
    // Find all candidates and their positions in this unit
    const candidatePositions: Map<number, Position[]> = new Map();

    for (let candidate = 1; candidate <= 9; candidate++) {
      const positions = grid.findCellsWithCandidate(unit, candidate);
      // For a hidden triple, each candidate must appear in 2-3 cells
      if (positions.length >= 2 && positions.length <= 3) {
        candidatePositions.set(candidate, positions);
      }
    }

    // Need at least 3 candidates that each appear in 2-3 cells
    const eligibleCandidates = [...candidatePositions.keys()];
    if (eligibleCandidates.length < 3) return null;

    // Check all combinations of 3 candidates
    const candidateTriples = combinations(eligibleCandidates, 3);

    for (const [cand1, cand2, cand3] of candidateTriples) {
      const positions1 = candidatePositions.get(cand1)!;
      const positions2 = candidatePositions.get(cand2)!;
      const positions3 = candidatePositions.get(cand3)!;

      // Union of all positions where these 3 candidates appear
      const allPositionKeys = new Set<string>();
      const allPositions: Position[] = [];

      for (const positions of [positions1, positions2, positions3]) {
        for (const pos of positions) {
          const key = `${pos.row},${pos.col}`;
          if (!allPositionKeys.has(key)) {
            allPositionKeys.add(key);
            allPositions.push(pos);
          }
        }
      }

      // For a hidden triple, the union must have exactly 3 cells
      if (allPositions.length !== 3) continue;

      const tripleCandidates = [cand1, cand2, cand3];

      // Find other candidates to eliminate from these three cells
      const eliminations: { position: Position; candidates: number[] }[] = [];

      for (const cell of allPositions) {
        const otherCandidates = [...grid.getCandidates(cell.row, cell.col)].filter(
          (c) => !tripleCandidates.includes(c),
        );
        if (otherCandidates.length > 0) {
          eliminations.push({ position: cell, candidates: otherCandidates });
        }
      }

      // If there are eliminations, we found a useful hidden triple
      if (eliminations.length > 0) {
        const unitName = this.getUnitName(unit);
        return this.createEliminationResult(
          eliminations,
          `${this.formatCandidates(tripleCandidates)} form a hidden triple in ${this.formatPositions(allPositions)} in ${unitName}`,
          allPositions,
        );
      }
    }

    return null;
  }

  private getUnitName(unit: Unit): string {
    switch (unit.type) {
      case "row":
        return `row ${unit.index + 1}`;
      case "column":
        return `column ${unit.index + 1}`;
      case "box":
        return `box ${unit.index + 1}`;
    }
  }
}
