// Finned Fish (Finned X-Wing) - Level 3 Technique
// An X-Wing where one row has an extra candidate cell (the "fin").
// Eliminations are restricted to cells that see both an X-Wing
// cover column AND the fin cell (must be peers of the fin and
// in a cover column, but not in a base row).

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique, combinations } from "../Technique";

export class FinnedFish extends BaseTechnique {
  readonly name = "Finned Fish";
  readonly level: TechniqueLevel = 3;
  readonly description = "X-Wing with an extra candidate fin cell";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const rowResult = this.findRowFinnedXWing(grid, candidate);
      if (rowResult) return rowResult;

      const colResult = this.findColFinnedXWing(grid, candidate);
      if (colResult) return colResult;
    }
    return null;
  }

  private findRowFinnedXWing(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Collect rows where candidate appears in 2-3 cells
    const eligibleRows: { row: number; cols: number[] }[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const cells = grid.findCellsWithCandidate({ type: "row", index: row }, candidate);
      if (cells.length >= 2 && cells.length <= 3) {
        eligibleRows.push({ row, cols: cells.map((c) => c.col) });
      }
    }

    if (eligibleRows.length < 2) return null;

    // Try all pairs of rows
    const pairs = combinations(eligibleRows, 2);

    for (const [rowA, rowB] of pairs) {
      // One row should have exactly 2 cells (base), the other 2-3 (potentially finned)
      const configs = [
        { base: rowA, finned: rowB },
        { base: rowB, finned: rowA },
      ];

      for (const { base, finned } of configs) {
        if (base.cols.length !== 2) continue;
        if (finned.cols.length < 2 || finned.cols.length > 3) continue;

        const baseCols = new Set(base.cols);
        // The finned row must cover both base columns plus possibly a fin
        const finnedInBase = finned.cols.filter((c) => baseCols.has(c));
        const fins = finned.cols.filter((c) => !baseCols.has(c));

        // Must have both base columns covered and exactly 1 fin
        if (finnedInBase.length !== 2 || fins.length !== 1) continue;

        const finCol = fins[0];
        const finPos: Position = { row: finned.row, col: finCol };
        const finBox = Math.floor(finned.row / 3) * 3 + Math.floor(finCol / 3);

        // Highlight cells: the X-Wing corners + the fin
        const highlightCells: Position[] = [
          { row: base.row, col: base.cols[0] },
          { row: base.row, col: base.cols[1] },
          { row: finned.row, col: finnedInBase[0] },
          { row: finned.row, col: finnedInBase[1] },
          finPos,
        ];

        // Eliminations: cells in the base columns that see the fin
        // A cell sees the fin if it's in the same box as the fin
        const eliminations: { position: Position; candidates: number[] }[] = [];

        for (const col of base.cols) {
          for (let row = 0; row < BOARD_SIZE; row++) {
            if (row === base.row || row === finned.row) continue;
            if (!grid.isEmpty(row, col) || !grid.hasCandidate(row, col, candidate)) continue;

            // Must see the fin (same box)
            const cellBox = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            if (cellBox === finBox) {
              eliminations.push({
                position: { row, col },
                candidates: [candidate],
              });
            }
          }
        }

        if (eliminations.length > 0) {
          return this.createEliminationResult(
            eliminations,
            `Finned X-Wing: ${candidate} in rows ${base.row + 1},${finned.row + 1} columns ${base.cols.map((c) => c + 1).join(",")} fin at ${this.formatPosition(finPos)}`,
            highlightCells,
          );
        }
      }
    }

    return null;
  }

  private findColFinnedXWing(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Collect columns where candidate appears in 2-3 cells
    const eligibleCols: { col: number; rows: number[] }[] = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      const cells = grid.findCellsWithCandidate({ type: "column", index: col }, candidate);
      if (cells.length >= 2 && cells.length <= 3) {
        eligibleCols.push({ col, rows: cells.map((c) => c.row) });
      }
    }

    if (eligibleCols.length < 2) return null;

    const pairs = combinations(eligibleCols, 2);

    for (const [colA, colB] of pairs) {
      const configs = [
        { base: colA, finned: colB },
        { base: colB, finned: colA },
      ];

      for (const { base, finned } of configs) {
        if (base.rows.length !== 2) continue;
        if (finned.rows.length < 2 || finned.rows.length > 3) continue;

        const baseRows = new Set(base.rows);
        const finnedInBase = finned.rows.filter((r) => baseRows.has(r));
        const fins = finned.rows.filter((r) => !baseRows.has(r));

        if (finnedInBase.length !== 2 || fins.length !== 1) continue;

        const finRow = fins[0];
        const finPos: Position = { row: finRow, col: finned.col };
        const finBox = Math.floor(finRow / 3) * 3 + Math.floor(finned.col / 3);

        const highlightCells: Position[] = [
          { row: base.rows[0], col: base.col },
          { row: base.rows[1], col: base.col },
          { row: finnedInBase[0], col: finned.col },
          { row: finnedInBase[1], col: finned.col },
          finPos,
        ];

        const eliminations: { position: Position; candidates: number[] }[] = [];

        for (const row of base.rows) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (col === base.col || col === finned.col) continue;
            if (!grid.isEmpty(row, col) || !grid.hasCandidate(row, col, candidate)) continue;

            const cellBox = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            if (cellBox === finBox) {
              eliminations.push({
                position: { row, col },
                candidates: [candidate],
              });
            }
          }
        }

        if (eliminations.length > 0) {
          return this.createEliminationResult(
            eliminations,
            `Finned X-Wing: ${candidate} in columns ${base.col + 1},${finned.col + 1} rows ${base.rows.map((r) => r + 1).join(",")} fin at ${this.formatPosition(finPos)}`,
            highlightCells,
          );
        }
      }
    }

    return null;
  }
}
