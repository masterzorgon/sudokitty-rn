// Empty Rectangle - Level 3 Single Digit Pattern
// If a candidate in a box is restricted to exactly one row and one column
// (forming an L-shape), the remaining cells form an "Empty Rectangle."
// Combined with a conjugate pair in a crossing row/column, this enables
// elimination at the intersection point.
//
// Algorithm:
// 1. For each candidate, for each box: check if candidate positions form an ER
//    (positions span a single row + single column within the box)
// 2. The ER defines a "hinge" at the intersection of that row and column
// 3. Find a conjugate pair in a row/column that passes through the ER box
// 4. If one end of the conjugate pair is in the ER row (or column),
//    the candidate at the intersection of the other end's line and the ER column (or row)
//    can be eliminated

import { Position, BOARD_SIZE, BOX_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel } from "../../types";
import { BaseTechnique } from "../Technique";

export class EmptyRectangle extends BaseTechnique {
  readonly name = "Empty Rectangle";
  readonly level: TechniqueLevel = 3;
  readonly description = "A box pattern combined with a conjugate pair to force an elimination";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    for (let candidate = 1; candidate <= 9; candidate++) {
      const result = this.findEmptyRectangle(grid, candidate);
      if (result) return result;
    }
    return null;
  }

  private findEmptyRectangle(
    grid: CandidateGridInterface,
    candidate: number,
  ): TechniqueResult | null {
    // Check each box for an ER pattern
    for (let box = 0; box < BOARD_SIZE; box++) {
      const boxCells = grid.findCellsWithCandidate({ type: "box", index: box }, candidate);
      if (boxCells.length < 2) continue;

      const boxStartRow = Math.floor(box / 3) * BOX_SIZE;
      const boxStartCol = (box % 3) * BOX_SIZE;

      // Find which rows and columns within the box contain the candidate
      const rowsWithCandidate = new Set<number>();
      const colsWithCandidate = new Set<number>();
      for (const cell of boxCells) {
        rowsWithCandidate.add(cell.row);
        colsWithCandidate.add(cell.col);
      }

      // For an ER, the candidate must span at least 2 rows AND at least 2 columns
      // (otherwise it's a pointing pair, not an ER)
      if (rowsWithCandidate.size < 2 || colsWithCandidate.size < 2) continue;

      // Try each combination of (erRow, erCol) within the box
      // The ER row and ER column define the "hinge" — all candidates must lie
      // on the ER row or the ER column (within the box)
      for (const erRow of rowsWithCandidate) {
        for (const erCol of colsWithCandidate) {
          // Check that all candidate positions in the box lie on erRow or erCol
          const isValidER = boxCells.every((cell) => cell.row === erRow || cell.col === erCol);
          if (!isValidER) continue;

          // We have an ER with hinge at (erRow, erCol)
          // Now find conjugate pairs that can interact with this ER

          // Strategy 1: Find a conjugate pair in a COLUMN that passes through erRow
          // The conjugate pair is in a column outside the box's column band
          for (let col = 0; col < BOARD_SIZE; col++) {
            // Skip columns within the ER box
            if (col >= boxStartCol && col < boxStartCol + BOX_SIZE) continue;

            const colCells = grid.findCellsWithCandidate({ type: "column", index: col }, candidate);
            if (colCells.length !== 2) continue;

            // Check if one end of the conjugate pair is in the ER row
            const inERRow = colCells.find((c) => c.row === erRow);
            const other = colCells.find((c) => c.row !== erRow);

            if (!inERRow || !other) continue;

            // The elimination target is at (other.row, erCol)
            const targetRow = other.row;
            const targetCol = erCol;

            // Skip if target is one of the ER cells or conjugate pair cells
            if (targetRow === erRow) continue;
            if (targetRow === inERRow.row && targetCol === inERRow.col) continue;
            if (targetRow === other.row && targetCol === other.col) continue;

            // Skip if target is in the ER box (the ER cells themselves)
            if (
              targetRow >= boxStartRow &&
              targetRow < boxStartRow + BOX_SIZE &&
              targetCol >= boxStartCol &&
              targetCol < boxStartCol + BOX_SIZE
            )
              continue;

            if (!grid.isEmpty(targetRow, targetCol)) continue;
            if (!grid.hasCandidate(targetRow, targetCol, candidate)) continue;

            const highlightCells: Position[] = [...boxCells, inERRow, other];

            return this.createEliminationResult(
              [{ position: { row: targetRow, col: targetCol }, candidates: [candidate] }],
              `Empty Rectangle: ${candidate} in box ${box + 1} with conjugate pair in column ${col + 1}`,
              highlightCells,
            );
          }

          // Strategy 2: Find a conjugate pair in a ROW that passes through erCol
          for (let row = 0; row < BOARD_SIZE; row++) {
            // Skip rows within the ER box
            if (row >= boxStartRow && row < boxStartRow + BOX_SIZE) continue;

            const rowCells = grid.findCellsWithCandidate({ type: "row", index: row }, candidate);
            if (rowCells.length !== 2) continue;

            // Check if one end of the conjugate pair is in the ER column
            const inERCol = rowCells.find((c) => c.col === erCol);
            const other = rowCells.find((c) => c.col !== erCol);

            if (!inERCol || !other) continue;

            // The elimination target is at (erRow, other.col)
            const targetRow = erRow;
            const targetCol = other.col;

            // Skip if target is one of the ER cells or conjugate pair cells
            if (targetCol === erCol) continue;
            if (targetRow === inERCol.row && targetCol === inERCol.col) continue;
            if (targetRow === other.row && targetCol === other.col) continue;

            // Skip if target is in the ER box
            if (
              targetRow >= boxStartRow &&
              targetRow < boxStartRow + BOX_SIZE &&
              targetCol >= boxStartCol &&
              targetCol < boxStartCol + BOX_SIZE
            )
              continue;

            if (!grid.isEmpty(targetRow, targetCol)) continue;
            if (!grid.hasCandidate(targetRow, targetCol, candidate)) continue;

            const highlightCells: Position[] = [...boxCells, inERCol, other];

            return this.createEliminationResult(
              [{ position: { row: targetRow, col: targetCol }, candidates: [candidate] }],
              `Empty Rectangle: ${candidate} in box ${box + 1} with conjugate pair in row ${row + 1}`,
              highlightCells,
            );
          }
        }
      }
    }

    return null;
  }
}
