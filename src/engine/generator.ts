// Sudoku puzzle generator using backtracking algorithm
// Enhanced with technique-based difficulty validation

import {
  BOARD_SIZE,
  BOX_SIZE,
  Difficulty,
  DIFFICULTY_CONFIG,
  GeneratedPuzzle,
} from './types';
import { SudokuSolver, TechniqueLevel } from './solver';

// Fisher-Yates shuffle
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Check if placing num at (row, col) is valid
const isValidPlacement = (
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean => {
  // Check row
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxStartRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxStartCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
    for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
};

// Find the next empty cell (0 = empty)
const findEmptyCell = (board: number[][]): [number, number] | null => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
};

// Fill board using backtracking (generates complete solution)
const fillBoard = (board: number[][]): boolean => {
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) return true; // Board is complete

  const [row, col] = emptyCell;
  const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (const num of numbers) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;

      if (fillBoard(board)) {
        return true;
      }

      board[row][col] = 0; // Backtrack
    }
  }

  return false;
};

// Count solutions (limited to 2 for uniqueness check)
const countSolutions = (
  board: number[][],
  limit: number = 2
): number => {
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) return 1;

  const [row, col] = emptyCell;
  let count = 0;

  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      count += countSolutions(board, limit);
      board[row][col] = 0;

      if (count >= limit) return count;
    }
  }

  return count;
};

// Deep copy a board
const copyBoard = (board: number[][]): number[][] => {
  return board.map((row) => [...row]);
};

// Remove numbers to create puzzle while ensuring unique solution (legacy - no technique validation)
const removeNumbersSimple = (
  solution: number[][],
  difficulty: Difficulty
): number[][] => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [minClues, maxClues] = config.clueRange;
  const targetClues = Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;
  const totalCells = BOARD_SIZE * BOARD_SIZE;
  const cellsToRemove = totalCells - targetClues;

  const puzzle = copyBoard(solution);

  // Create list of all positions and shuffle
  const positions: [number, number][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push([row, col]);
    }
  }
  const shuffledPositions = shuffleArray(positions);

  let removed = 0;
  for (const [row, col] of shuffledPositions) {
    if (removed >= cellsToRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // Check if puzzle still has unique solution
    const testBoard = copyBoard(puzzle);
    const solutions = countSolutions(testBoard, 2);

    if (solutions !== 1) {
      // Restore - removing this would create multiple solutions
      puzzle[row][col] = backup;
    } else {
      removed++;
    }
  }

  return puzzle;
};

// Remove numbers with technique-based difficulty validation
const removeNumbersWithValidation = (
  solution: number[][],
  difficulty: Difficulty
): number[][] | null => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [minClues, maxClues] = config.clueRange;
  const maxTechniqueLevel = config.maxTechniqueLevel as TechniqueLevel;

  // Create solver for this difficulty level
  const solver = new SudokuSolver({
    maxTechniqueLevel,
    trackSteps: false,
  });

  const puzzle = copyBoard(solution);

  // Create list of all positions and shuffle
  const positions: [number, number][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push([row, col]);
    }
  }
  const shuffledPositions = shuffleArray(positions);

  let currentClues = BOARD_SIZE * BOARD_SIZE;

  for (const [row, col] of shuffledPositions) {
    // Don't go below minimum clues
    if (currentClues <= minClues) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // Check 1: Unique solution (fast check)
    const testBoard = copyBoard(puzzle);
    const solutions = countSolutions(testBoard, 2);

    if (solutions !== 1) {
      // Restore - would create multiple solutions
      puzzle[row][col] = backup;
      continue;
    }

    // Check 2: Solvable with allowed techniques
    const solveResult = solver.solve(puzzle);

    if (!solveResult.solved) {
      // Restore - requires guessing or advanced techniques
      puzzle[row][col] = backup;
      continue;
    }

    // Check 3: Technique level doesn't exceed max
    if (solveResult.maxLevelRequired > maxTechniqueLevel) {
      // Restore - too hard for this difficulty
      puzzle[row][col] = backup;
      continue;
    }

    currentClues--;
  }

  // Validate final clue count is within range
  if (currentClues > maxClues) {
    // Puzzle ended up too easy - signal to regenerate
    return null;
  }

  // Validate puzzle requires techniques at the expected difficulty
  const minTechniqueLevel = config.minTechniqueLevel as TechniqueLevel;
  const finalSolve = solver.solve(puzzle);
  if (!finalSolve.solved || finalSolve.maxLevelRequired < minTechniqueLevel) {
    // Puzzle too easy — doesn't require techniques at the target difficulty
    return null;
  }

  return puzzle;
};

// Generate a new puzzle with solution
export const generatePuzzle = (difficulty: Difficulty): GeneratedPuzzle => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const maxAttempts = 100;

  // Primary path: full technique validation
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution: number[][] = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));

    fillBoard(solution);

    const puzzle = removeNumbersWithValidation(solution, difficulty);

    if (puzzle !== null) {
      return { puzzle, solution };
    }
  }

  // Fallback: generate with simple method, but validate technique level.
  // Try up to 20 attempts, keep the best one (highest maxLevelRequired).
  const minTechniqueLevel = config.minTechniqueLevel as TechniqueLevel;
  let bestPuzzle: GeneratedPuzzle | null = null;
  let bestLevel = 0;

  for (let i = 0; i < 20; i++) {
    const result = generatePuzzleSimple(difficulty);
    const solver = new SudokuSolver({
      maxTechniqueLevel: config.maxTechniqueLevel as TechniqueLevel,
      trackSteps: false,
    });
    const solveResult = solver.solve(result.puzzle);

    if (solveResult.solved && solveResult.maxLevelRequired >= minTechniqueLevel) {
      return result; // Fallback that meets minimum requirements
    }

    // Track the best fallback puzzle (highest technique level)
    if (solveResult.solved && solveResult.maxLevelRequired > bestLevel) {
      bestLevel = solveResult.maxLevelRequired;
      bestPuzzle = result;
    }
  }

  // Last resort: return the best puzzle we found, even if below minimum
  console.warn(
    `[Generator] Could not meet minTechniqueLevel for ${difficulty}. ` +
    `Best: level ${bestLevel}, wanted: ${minTechniqueLevel}`
  );
  return bestPuzzle ?? generatePuzzleSimple(difficulty);
};

// Simple puzzle generation without technique validation (fallback)
export const generatePuzzleSimple = (difficulty: Difficulty): GeneratedPuzzle => {
  const solution: number[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));

  fillBoard(solution);
  const puzzle = removeNumbersSimple(solution, difficulty);

  return { puzzle, solution };
};

// Count clues in a puzzle
export const countClues = (puzzle: number[][]): number => {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (puzzle[row][col] !== 0) count++;
    }
  }
  return count;
};

// Validate that a completed board is correct
export const validateBoard = (board: number[][]): boolean => {
  // Check each row
  for (let row = 0; row < BOARD_SIZE; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < BOARD_SIZE; col++) {
      const val = board[row][col];
      if (val < 1 || val > 9 || seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check each column
  for (let col = 0; col < BOARD_SIZE; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      const val = board[row][col];
      if (val < 1 || val > 9 || seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check each 3x3 box
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let r = 0; r < BOX_SIZE; r++) {
        for (let c = 0; c < BOX_SIZE; c++) {
          const val = board[boxRow * BOX_SIZE + r][boxCol * BOX_SIZE + c];
          if (val < 1 || val > 9 || seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
};

// Generate daily puzzle with seeded random (same puzzle for everyone on same day)
export const generateDailyPuzzle = (
  dateString: string,
  difficulty: Difficulty = 'medium'
): GeneratedPuzzle => {
  // Simple seeded random based on date
  const seed = dateString.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Store original Math.random
  const originalRandom = Math.random;

  // Simple seeded random number generator (LCG)
  let state = seed;
  Math.random = () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };

  // Generate puzzle with seeded random and technique validation
  const puzzle = generatePuzzle(difficulty);

  // Restore original Math.random
  Math.random = originalRandom;

  return puzzle;
};
