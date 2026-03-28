// Sue de Coq (Two-Sector Disjoint Subsets) - Level 3 Technique
//
// Operates on the intersection of a Box (B) and a Row or Column (R).
//
// Basic variant:
//   Find 2 intersection cells with 4 candidates (or 3 with 5).
//   Find a bivalue row/column companion whose candidates are in V.
//   Find a bivalue box companion whose candidates are in V but disjoint from the row companion.
//   Eliminate row companion candidates from rest of row, box companion candidates from rest of box.
//
// Extended variant (generalization):
//   |C| >= 2 intersection cells, |V| >= |C| + 2 candidates.
//   Find companion sets CR (in R outside B) and CB (in B outside R).
//   VR and VB must be disjoint within V.
//   Eliminate VB ∪ (V \ VR) from B \ (C ∪ CB), and VR ∪ (V \ VB) from R \ (C ∪ CR).

import { Position, BOARD_SIZE, BOX_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, combinations, setUnion, setIntersection } from "../Technique";

export class SueDeCoq extends BaseTechnique {
  readonly name = "Sue de Coq";
  readonly level: TechniqueLevel = 3;
  readonly description = "Two-Sector Disjoint Subsets at a box/line intersection";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Try each box
    for (let box = 0; box < BOARD_SIZE; box++) {
      const boxStartRow = Math.floor(box / 3) * BOX_SIZE;
      const boxStartCol = (box % 3) * BOX_SIZE;

      // Try rows intersecting this box
      for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
        const result = this.tryIntersection(
          grid,
          box,
          { type: "row", index: r },
          boxStartRow,
          boxStartCol,
        );
        if (result) return result;
      }

      // Try columns intersecting this box
      for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
        const result = this.tryIntersection(
          grid,
          box,
          { type: "column", index: c },
          boxStartRow,
          boxStartCol,
        );
        if (result) return result;
      }
    }

    return null;
  }

  private tryIntersection(
    grid: CandidateGridInterface,
    box: number,
    line: { type: "row" | "column"; index: number },
    boxStartRow: number,
    boxStartCol: number,
  ): TechniqueResult | null {
    // Find empty cells at the intersection of this box and this row/column
    const intersectionCells: Position[] = [];
    for (let i = 0; i < BOX_SIZE; i++) {
      const row = line.type === "row" ? line.index : boxStartRow + i;
      const col = line.type === "column" ? line.index : boxStartCol + i;
      if (grid.isEmpty(row, col)) {
        intersectionCells.push({ row, col });
      }
    }

    // Need at least 2 intersection cells
    if (intersectionCells.length < 2) return null;

    // Try intersection sets of size 2 and 3
    const maxIntersectionSize = Math.min(intersectionCells.length, 3);
    for (let size = 2; size <= maxIntersectionSize; size++) {
      const subsets =
        size === intersectionCells.length
          ? [intersectionCells]
          : combinations(intersectionCells, size);

      for (const C of subsets) {
        const result = this.trySDC(grid, box, line, C, boxStartRow, boxStartCol);
        if (result) return result;
      }
    }

    return null;
  }

  private trySDC(
    grid: CandidateGridInterface,
    box: number,
    line: { type: "row" | "column"; index: number },
    C: Position[], // intersection cells
    boxStartRow: number,
    boxStartCol: number,
  ): TechniqueResult | null {
    // V = union of candidates in C
    const V = new Set<number>();
    for (const cell of C) {
      for (const cand of grid.getCandidates(cell.row, cell.col)) {
        V.add(cand);
      }
    }

    // Need |V| >= |C| + 2
    if (V.size < C.length + 2) return null;

    // Collect candidate companion cells in the line (outside the box)
    const lineCandidates: Position[] = [];
    if (line.type === "row") {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (col >= boxStartCol && col < boxStartCol + BOX_SIZE) continue;
        if (!grid.isEmpty(line.index, col)) continue;
        lineCandidates.push({ row: line.index, col });
      }
    } else {
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (row >= boxStartRow && row < boxStartRow + BOX_SIZE) continue;
        if (!grid.isEmpty(row, line.index)) continue;
        lineCandidates.push({ row, col: line.index });
      }
    }

    // Collect candidate companion cells in the box (outside the line)
    const boxCandidates: Position[] = [];
    for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
      for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
        // Skip intersection cells
        if (line.type === "row" && r === line.index) continue;
        if (line.type === "column" && c === line.index) continue;
        if (!grid.isEmpty(r, c)) continue;
        boxCandidates.push({ row: r, col: c });
      }
    }

    // Filter companions: must share at least one candidate with V
    const validLineCompanions = lineCandidates.filter((pos) => {
      const cands = grid.getCandidates(pos.row, pos.col);
      for (const v of V) {
        if (cands.has(v)) return true;
      }
      return false;
    });

    const validBoxCompanions = boxCandidates.filter((pos) => {
      const cands = grid.getCandidates(pos.row, pos.col);
      for (const v of V) {
        if (cands.has(v)) return true;
      }
      return false;
    });

    // Enumerate CR subsets (1 to 3 cells from line companions)
    const maxCR = Math.min(validLineCompanions.length, 3);
    const maxCB = Math.min(validBoxCompanions.length, 3);

    for (let crSize = 1; crSize <= maxCR; crSize++) {
      const crSubsets = combinations(validLineCompanions, crSize);

      for (const CR of crSubsets) {
        // VR = union of all candidates in CR
        const VR = new Set<number>();
        for (const cell of CR) {
          for (const cand of grid.getCandidates(cell.row, cell.col)) {
            VR.add(cand);
          }
        }

        // VR must have at least one candidate from V
        const vrInV = setIntersection(VR, V);
        if (vrInV.size === 0) continue;

        for (let cbSize = 1; cbSize <= maxCB; cbSize++) {
          const cbSubsets = combinations(validBoxCompanions, cbSize);

          for (const CB of cbSubsets) {
            // VB = union of all candidates in CB
            const VB = new Set<number>();
            for (const cell of CB) {
              for (const cand of grid.getCandidates(cell.row, cell.col)) {
                VB.add(cand);
              }
            }

            // VB must have at least one candidate from V
            const vbInV = setIntersection(VB, V);
            if (vbInV.size === 0) continue;

            // Constraint: No candidate from V may appear in BOTH VR and VB
            const vrVbOverlapInV = setIntersection(vrInV, vbInV);
            if (vrVbOverlapInV.size > 0) continue;

            // Constraint: VR ∪ VB must cover all of V
            // More precisely: |CR| + |CB| >= |V| - |C| + n
            // where n = number of candidates in VR ∪ VB not in V
            const vrVbUnion = setUnion(VR, VB);
            const extraCandidates = new Set<number>();
            for (const c of vrVbUnion) {
              if (!V.has(c)) extraCandidates.add(c);
            }
            const n = extraCandidates.size;
            const neededCompanions = V.size - C.length + n;
            if (CR.length + CB.length < neededCompanions) continue;

            // VR and VB (within V) must together cover all of V
            // i.e., every candidate in V must be in VR or VB (or locked in intersection)
            // Actually the constraint is: vrInV ∪ vbInV must account for |V| - |C| candidates
            // The remaining |C| candidates from V are locked in C
            // Let's check: |vrInV| + |vbInV| >= |V| - |C|
            if (vrInV.size + vbInV.size < V.size - C.length) continue;

            // Compute eliminations
            const eliminations: { position: Position; candidates: number[] }[] = [];

            // From rest of R (outside C and CR): eliminate VR ∪ (V \ VB)
            const vNotVB = new Set<number>();
            for (const v of V) {
              if (!VB.has(v)) vNotVB.add(v);
            }
            const lineElimCandidates = setUnion(VR, vNotVB);
            // But only candidates that are actually from V or VR
            // (V \ VB) are candidates locked in the line through the intersection

            const cSet = new Set(C.map((p) => `${p.row},${p.col}`));
            const crSet = new Set(CR.map((p) => `${p.row},${p.col}`));
            const cbSet = new Set(CB.map((p) => `${p.row},${p.col}`));

            // Eliminate from rest of line
            const linePositions =
              line.type === "row"
                ? grid.getRowPositions(line.index)
                : grid.getColumnPositions(line.index);

            for (const pos of linePositions) {
              const key = `${pos.row},${pos.col}`;
              if (cSet.has(key) || crSet.has(key)) continue;
              if (!grid.isEmpty(pos.row, pos.col)) continue;

              const toEliminate: number[] = [];
              for (const cand of lineElimCandidates) {
                if (grid.hasCandidate(pos.row, pos.col, cand)) {
                  toEliminate.push(cand);
                }
              }
              if (toEliminate.length > 0) {
                eliminations.push({ position: pos, candidates: toEliminate.sort((a, b) => a - b) });
              }
            }

            // From rest of B (outside C and CB): eliminate VB ∪ (V \ VR)
            const vNotVR = new Set<number>();
            for (const v of V) {
              if (!VR.has(v)) vNotVR.add(v);
            }
            const boxElimCandidates = setUnion(VB, vNotVR);

            const boxPositions = grid.getBoxPositions(box);
            for (const pos of boxPositions) {
              const key = `${pos.row},${pos.col}`;
              if (cSet.has(key) || cbSet.has(key)) continue;
              if (!grid.isEmpty(pos.row, pos.col)) continue;

              const toEliminate: number[] = [];
              for (const cand of boxElimCandidates) {
                if (grid.hasCandidate(pos.row, pos.col, cand)) {
                  toEliminate.push(cand);
                }
              }
              if (toEliminate.length > 0) {
                eliminations.push({ position: pos, candidates: toEliminate.sort((a, b) => a - b) });
              }
            }

            if (eliminations.length > 0) {
              const highlightCells: Position[] = [...C, ...CR, ...CB];
              const vArray = Array.from(V).sort((a, b) => a - b);
              const lineType =
                line.type === "row" ? `row ${line.index + 1}` : `column ${line.index + 1}`;

              return this.createEliminationResult(
                eliminations,
                `Sue de Coq: candidates {${vArray.join("")}} in ${lineType} and box ${box + 1}`,
                highlightCells,
              );
            }
          }
        }
      }
    }

    return null;
  }
}
