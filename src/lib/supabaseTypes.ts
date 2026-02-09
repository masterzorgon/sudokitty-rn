// Type definitions for the Supabase puzzle_pool table and grid conversion utilities

import { TechniqueResult } from '../engine/solver/types';

/** Row shape returned from the puzzle_pool table / get_random_puzzles RPC */
export interface PuzzlePoolRow {
  id: string;
  technique_id: string;
  technique_name: string;
  difficulty_level: number;
  puzzle: string; // 81-char compact string (row-major, '0' = empty)
  solution: string; // 81-char compact string
  technique_result: TechniqueResult;
  created_at: string;
}

/**
 * Convert an 81-character compact string to a 9x9 number[][] grid.
 * Row-major order: characters 0-8 = row 0, 9-17 = row 1, etc.
 * '0' = empty cell, '1'-'9' = given/solved value.
 */
export function compactToGrid(compact: string): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      row.push(parseInt(compact[r * 9 + c], 10));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Convert a 9x9 number[][] grid to an 81-character compact string.
 * Inverse of compactToGrid.
 */
export function gridToCompact(grid: number[][]): string {
  return grid.map((row) => row.join('')).join('');
}
