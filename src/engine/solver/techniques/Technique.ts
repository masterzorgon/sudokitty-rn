// Base Technique interface and helper utilities

import { Position } from "../../types";
import { Technique, TechniqueResult, TechniqueLevel, CandidateGridInterface } from "../types";

/**
 * Base class for implementing techniques.
 * Provides common utilities used by multiple techniques.
 */
export abstract class BaseTechnique implements Technique {
  abstract readonly name: string;
  abstract readonly level: TechniqueLevel;
  abstract readonly description: string;

  abstract apply(grid: CandidateGridInterface): TechniqueResult | null;

  /**
   * Helper to create a placement result.
   */
  protected createPlacementResult(
    position: Position,
    value: number,
    explanation: string,
    highlightCells: Position[] = [position],
  ): TechniqueResult {
    return {
      techniqueName: this.name,
      level: this.level,
      eliminations: [],
      placements: [{ position, value }],
      explanation,
      highlightCells,
    };
  }

  /**
   * Helper to create an elimination result.
   */
  protected createEliminationResult(
    eliminations: { position: Position; candidates: number[] }[],
    explanation: string,
    highlightCells: Position[],
  ): TechniqueResult {
    return {
      techniqueName: this.name,
      level: this.level,
      eliminations,
      placements: [],
      explanation,
      highlightCells,
    };
  }

  /**
   * Format a position for display.
   */
  protected formatPosition(pos: Position): string {
    return `R${pos.row + 1}C${pos.col + 1}`;
  }

  /**
   * Format multiple positions for display.
   */
  protected formatPositions(positions: Position[]): string {
    return positions.map((p) => this.formatPosition(p)).join(", ");
  }

  /**
   * Format candidates for display.
   */
  protected formatCandidates(candidates: number[]): string {
    return candidates.sort((a, b) => a - b).join(", ");
  }
}

/**
 * Check if two sets contain the same elements.
 */
export const setsEqual = (a: ReadonlySet<number>, b: ReadonlySet<number>): boolean => {
  if (a.size !== b.size) return false;
  for (const elem of a) {
    if (!b.has(elem)) return false;
  }
  return true;
};

/**
 * Check if set A is a subset of set B.
 */
export const isSubset = (a: ReadonlySet<number>, b: ReadonlySet<number>): boolean => {
  for (const elem of a) {
    if (!b.has(elem)) return false;
  }
  return true;
};

/**
 * Get the union of multiple sets.
 */
export const setUnion = (...sets: ReadonlySet<number>[]): Set<number> => {
  const result = new Set<number>();
  for (const set of sets) {
    for (const elem of set) {
      result.add(elem);
    }
  }
  return result;
};

/**
 * Get the intersection of multiple sets.
 */
export const setIntersection = (...sets: ReadonlySet<number>[]): Set<number> => {
  if (sets.length === 0) return new Set();
  if (sets.length === 1) return new Set(sets[0]);

  const result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    for (const elem of result) {
      if (!sets[i].has(elem)) {
        result.delete(elem);
      }
    }
  }
  return result;
};

/**
 * Get the difference A - B.
 */
export const setDifference = (a: ReadonlySet<number>, b: ReadonlySet<number>): Set<number> => {
  const result = new Set<number>();
  for (const elem of a) {
    if (!b.has(elem)) {
      result.add(elem);
    }
  }
  return result;
};

/**
 * Generate all combinations of k elements from an array.
 */
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  if (k > arr.length) return [];

  const result: T[][] = [];

  function combine(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return result;
}
