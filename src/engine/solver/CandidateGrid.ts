// CandidateGrid - Core class for managing candidates in Sudoku solving

import { Position, BOARD_SIZE, BOX_SIZE } from '../types';
import { CandidateGridInterface, Unit, UnitType } from './types';

/**
 * CandidateGrid manages the candidates (possible values) for each cell.
 * This is the foundation for all solving techniques.
 */
export class CandidateGrid implements CandidateGridInterface {
  private values: (number | null)[][]; // 9x9 grid of placed values
  private candidates: Set<number>[][]; // 9x9 grid of candidate sets

  /**
   * Create a CandidateGrid from a puzzle.
   * @param puzzle 9x9 array where 0 = empty, 1-9 = given value
   */
  constructor(puzzle: number[][]) {
    // Initialize values array
    this.values = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));

    // Initialize candidates array with full candidate sets
    this.candidates = Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]))
      );

    // Place initial values and eliminate candidates
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const value = puzzle[row][col];
        if (value !== 0) {
          this.placeValue(row, col, value);
        }
      }
    }
  }

  /**
   * Create a deep clone of this grid.
   */
  clone(): CandidateGrid {
    const cloned = Object.create(CandidateGrid.prototype) as CandidateGrid;

    cloned.values = this.values.map((row) => [...row]);
    cloned.candidates = this.candidates.map((row) =>
      row.map((set) => new Set(set))
    );

    return cloned;
  }

  // ===== Value Queries =====

  getValue(row: number, col: number): number | null {
    return this.values[row][col];
  }

  isEmpty(row: number, col: number): boolean {
    return this.values[row][col] === null;
  }

  /**
   * Check if the puzzle is completely solved.
   */
  isSolved(): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.values[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if the grid is in a valid state (no empty cells with no candidates).
   */
  isValid(): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.values[row][col] === null && this.candidates[row][col].size === 0) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Export the current state as a 2D array.
   */
  toArray(): number[][] {
    return this.values.map((row) =>
      row.map((val) => val ?? 0)
    );
  }

  // ===== Candidate Queries =====

  getCandidates(row: number, col: number): ReadonlySet<number> {
    return this.candidates[row][col];
  }

  hasCandidate(row: number, col: number, candidate: number): boolean {
    return this.candidates[row][col].has(candidate);
  }

  getCandidateCount(row: number, col: number): number {
    return this.candidates[row][col].size;
  }

  /**
   * Get all candidates as an array for a cell.
   */
  getCandidatesArray(row: number, col: number): number[] {
    return Array.from(this.candidates[row][col]);
  }

  // ===== Unit Position Queries =====

  getRowPositions(row: number): Position[] {
    const positions: Position[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row, col });
    }
    return positions;
  }

  getColumnPositions(col: number): Position[] {
    const positions: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      positions.push({ row, col });
    }
    return positions;
  }

  getBoxPositions(boxIndex: number): Position[] {
    const positions: Position[] = [];
    const startRow = Math.floor(boxIndex / 3) * BOX_SIZE;
    const startCol = (boxIndex % 3) * BOX_SIZE;

    for (let r = 0; r < BOX_SIZE; r++) {
      for (let c = 0; c < BOX_SIZE; c++) {
        positions.push({ row: startRow + r, col: startCol + c });
      }
    }
    return positions;
  }

  getUnitPositions(unit: Unit): Position[] {
    switch (unit.type) {
      case 'row':
        return this.getRowPositions(unit.index);
      case 'column':
        return this.getColumnPositions(unit.index);
      case 'box':
        return this.getBoxPositions(unit.index);
    }
  }

  /**
   * Get all units (9 rows + 9 columns + 9 boxes = 27 units).
   */
  getAllUnits(): Unit[] {
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: 'row', index: i });
      units.push({ type: 'column', index: i });
      units.push({ type: 'box', index: i });
    }
    return units;
  }

  // ===== Cell Finding Queries =====

  findCellsWithCandidate(unit: Unit, candidate: number): Position[] {
    return this.getUnitPositions(unit).filter(
      (pos) => this.isEmpty(pos.row, pos.col) && this.hasCandidate(pos.row, pos.col, candidate)
    );
  }

  findEmptyCells(unit: Unit): Position[] {
    return this.getUnitPositions(unit).filter((pos) => this.isEmpty(pos.row, pos.col));
  }

  /**
   * Find all empty cells on the board.
   */
  findAllEmptyCells(): Position[] {
    const cells: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.isEmpty(row, col)) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  // ===== Peer Queries =====

  getPeers(position: Position): Position[] {
    const peers: Position[] = [];
    const { row, col } = position;
    const boxStartRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxStartCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

    // Same row (excluding self)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c !== col) {
        peers.push({ row, col: c });
      }
    }

    // Same column (excluding self)
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (r !== row) {
        peers.push({ row: r, col });
      }
    }

    // Same box (excluding row/column peers already added)
    for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
      for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
        if (r !== row && c !== col) {
          peers.push({ row: r, col: c });
        }
      }
    }

    return peers;
  }

  /**
   * Get common peers of multiple positions.
   */
  getCommonPeers(positions: Position[]): Position[] {
    if (positions.length === 0) return [];
    if (positions.length === 1) return this.getPeers(positions[0]);

    // Get peers of first position
    let commonPeers = new Set(
      this.getPeers(positions[0]).map((p) => `${p.row},${p.col}`)
    );

    // Intersect with peers of remaining positions
    for (let i = 1; i < positions.length; i++) {
      const peers = new Set(
        this.getPeers(positions[i]).map((p) => `${p.row},${p.col}`)
      );
      commonPeers = new Set([...commonPeers].filter((p) => peers.has(p)));
    }

    // Convert back to Position objects
    return [...commonPeers].map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });
  }

  // ===== Box Calculations =====

  getBoxIndex(row: number, col: number): number {
    return Math.floor(row / BOX_SIZE) * 3 + Math.floor(col / BOX_SIZE);
  }

  getBoxStartPosition(boxIndex: number): Position {
    return {
      row: Math.floor(boxIndex / 3) * BOX_SIZE,
      col: (boxIndex % 3) * BOX_SIZE,
    };
  }

  // ===== Mutation Methods =====

  /**
   * Eliminate a candidate from a cell.
   * @returns true if the candidate was present and removed
   */
  eliminate(row: number, col: number, candidate: number): boolean {
    if (!this.candidates[row][col].has(candidate)) {
      return false;
    }
    this.candidates[row][col].delete(candidate);
    return true;
  }

  /**
   * Eliminate multiple candidates from a cell.
   * @returns number of candidates eliminated
   */
  eliminateMultiple(row: number, col: number, candidatesToRemove: number[]): number {
    let count = 0;
    for (const candidate of candidatesToRemove) {
      if (this.eliminate(row, col, candidate)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Place a value in a cell and propagate eliminations to peers.
   */
  placeValue(row: number, col: number, value: number): void {
    this.values[row][col] = value;
    this.candidates[row][col].clear();

    // Eliminate this value from all peers
    const peers = this.getPeers({ row, col });
    for (const peer of peers) {
      this.candidates[peer.row][peer.col].delete(value);
    }
  }

  /**
   * Check if two positions are in the same unit.
   */
  areInSameUnit(pos1: Position, pos2: Position): boolean {
    // Same row
    if (pos1.row === pos2.row) return true;
    // Same column
    if (pos1.col === pos2.col) return true;
    // Same box
    if (this.getBoxIndex(pos1.row, pos1.col) === this.getBoxIndex(pos2.row, pos2.col)) {
      return true;
    }
    return false;
  }

  /**
   * Get the unit type that contains both positions (if any).
   */
  getSharedUnitType(pos1: Position, pos2: Position): UnitType | null {
    if (pos1.row === pos2.row) return 'row';
    if (pos1.col === pos2.col) return 'column';
    if (this.getBoxIndex(pos1.row, pos1.col) === this.getBoxIndex(pos2.row, pos2.col)) {
      return 'box';
    }
    return null;
  }
}
