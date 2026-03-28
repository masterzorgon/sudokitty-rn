// SudokuSolver - Main solver orchestrator using technique-based solving

import { CandidateGrid } from './CandidateGrid';
import {
  Technique,
  TechniqueLevel,
  TechniqueResult,
  SolveResult,
  SolverConfig,
  Hint,
  getMochiHint,
} from './types';
import { getTechniquesUpToLevel } from './techniques';
import { getTechniqueMetadataByName } from '../../data/techniqueMetadata';

const DEFAULT_CONFIG: Required<SolverConfig> = {
  maxTechniqueLevel: 4,
  maxIterations: 1000,
  trackSteps: true,
};

/**
 * SudokuSolver uses a hierarchy of solving techniques to solve puzzles
 * and analyze their difficulty.
 */
export class SudokuSolver {
  private techniques: Technique[];
  private config: Required<SolverConfig>;

  constructor(config: Partial<SolverConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.techniques = getTechniquesUpToLevel(this.config.maxTechniqueLevel);
  }

  /**
   * Solve a puzzle and return detailed results.
   * @param puzzle 9x9 array where 0 = empty, 1-9 = given value
   */
  solve(puzzle: number[][]): SolveResult {
    const grid = new CandidateGrid(puzzle);
    const steps: TechniqueResult[] = [];
    const techniquesUsed = new Map<string, number>();
    let maxLevelRequired: TechniqueLevel | 0 = 0;
    let iterations = 0;

    // Main solving loop
    while (!grid.isSolved() && iterations < this.config.maxIterations) {
      let madeProgress = false;

      // Try techniques in order (simplest first)
      for (const technique of this.techniques) {
        const result = technique.apply(grid);

        if (result) {
          // Apply the result to the grid
          this.applyResult(grid, result);

          // Track statistics
          if (this.config.trackSteps) {
            steps.push(result);
          }

          const count = techniquesUsed.get(result.techniqueName) ?? 0;
          techniquesUsed.set(result.techniqueName, count + 1);

          if (result.level > maxLevelRequired) {
            maxLevelRequired = result.level;
          }

          madeProgress = true;
          break; // Restart from simplest technique
        }
      }

      if (!madeProgress) {
        // No technique could make progress - puzzle requires guessing or is unsolvable
        break;
      }

      iterations++;
    }

    const solved = grid.isSolved();

    return {
      solved,
      maxLevelRequired,
      techniquesUsed,
      steps,
      finalGrid: solved ? grid.toArray() : null,
    };
  }

  /**
   * Get the next solving step without fully solving.
   * Useful for hints.
   */
  getNextStep(puzzle: number[][]): TechniqueResult | null {
    const grid = new CandidateGrid(puzzle);

    if (grid.isSolved()) {
      return null;
    }

    // Try techniques in order
    for (const technique of this.techniques) {
      const result = technique.apply(grid);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Get a hint for the current puzzle state.
   */
  getHint(puzzle: number[][]): Hint | null {
    const step = this.getNextStep(puzzle);

    if (!step) {
      return null;
    }

    // Determine target cell and value
    let targetCell = step.placements[0]?.position ?? step.eliminations[0]?.position;
    let targetValue = step.placements[0]?.value;

    if (!targetCell) {
      return null;
    }

    const meta = getTechniqueMetadataByName(step.techniqueName);

    return {
      techniqueName: step.techniqueName,
      level: step.level,
      targetCell,
      targetValue,
      explanation: step.explanation,
      highlightCells: step.highlightCells,
      mochiHint: getMochiHint(step.techniqueName),
      category: meta?.category,
      categoryColor: meta?.color,
      techniqueDescription: meta?.longDescription,
    };
  }

  /**
   * Analyze a puzzle's difficulty without fully solving.
   * Returns the maximum technique level required.
   */
  analyzeDifficulty(puzzle: number[][]): {
    maxLevel: TechniqueLevel | 0;
    solvable: boolean;
    techniquesNeeded: string[];
  } {
    // Use full technique set for analysis
    const fullSolver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: false });
    const result = fullSolver.solve(puzzle);

    return {
      maxLevel: result.maxLevelRequired,
      solvable: result.solved,
      techniquesNeeded: [...result.techniquesUsed.keys()],
    };
  }

  /**
   * Check if a puzzle is solvable using only techniques up to maxLevel.
   */
  isSolvableAtLevel(puzzle: number[][], maxLevel: TechniqueLevel): boolean {
    const solver = new SudokuSolver({ maxTechniqueLevel: maxLevel, trackSteps: false });
    const result = solver.solve(puzzle);
    return result.solved;
  }

  /**
   * Apply a technique result to the grid.
   */
  private applyResult(grid: CandidateGrid, result: TechniqueResult): void {
    // Apply placements first
    for (const placement of result.placements) {
      grid.placeValue(placement.position.row, placement.position.col, placement.value);
    }

    // Apply eliminations
    for (const elimination of result.eliminations) {
      for (const candidate of elimination.candidates) {
        grid.eliminate(elimination.position.row, elimination.position.col, candidate);
      }
    }
  }
}

/**
 * Quick utility to check if a puzzle is solvable without guessing.
 */
export const isSolvableLogically = (puzzle: number[][]): boolean => {
  const solver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: false });
  return solver.solve(puzzle).solved;
};

/**
 * Quick utility to get the difficulty level of a puzzle.
 */
export const getPuzzleDifficulty = (
  puzzle: number[][]
): { level: TechniqueLevel | 0; solvable: boolean } => {
  const solver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: false });
  const result = solver.solve(puzzle);
  return {
    level: result.maxLevelRequired,
    solvable: result.solved,
  };
};
