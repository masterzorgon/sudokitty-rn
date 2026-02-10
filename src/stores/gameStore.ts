// Core game state management with Zustand
// Replaces iOS GameViewModel

import { enableMapSet } from 'immer';
import { create } from 'zustand';

// Enable Immer's MapSet plugin to support Set in state
enableMapSet();
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Cell,
  Position,
  Difficulty,
  GameStatus,
  CompletedUnit,
  MoveRecord,
  InputResult,
  BOARD_SIZE,
  BOX_SIZE,
  MAX_MISTAKES,
  MAX_HINTS,
  getBoxIndex,
  getRelatedPositions,
  positionKey,
} from '../engine/types';
import { generatePuzzle } from '../engine/generator';
import { SudokuSolver, Hint } from '../engine/solver';
import { useSettingsStore } from './settingsStore';
import {
  getCachedGamePuzzle,
  consumeAndRefillGamePuzzle,
} from '../services/puzzleCacheService';
import { useDailyChallengeStore } from './dailyChallengeStore';

// Create empty cell
const createCell = (
  row: number,
  col: number,
  value: number | null,
  correctValue: number,
  isGiven: boolean
): Cell => ({
  row,
  col,
  value,
  correctValue,
  isGiven,
  notes: new Set<number>(),
  isValid: value === null || value === correctValue,
});

// Create empty board
const createEmptyBoard = (): Cell[][] => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map((_, row) =>
      Array(BOARD_SIZE)
        .fill(null)
        .map((_, col) => createCell(row, col, null, 0, false))
    );
};

// Create board from puzzle and solution
const createBoardFromPuzzle = (
  puzzle: number[][],
  solution: number[][]
): Cell[][] => {
  return puzzle.map((row, rowIndex) =>
    row.map((value, colIndex) =>
      createCell(
        rowIndex,
        colIndex,
        value === 0 ? null : value,
        solution[rowIndex][colIndex],
        value !== 0
      )
    )
  );
};

// Board snapshot for undo
interface BoardSnapshot {
  cells: { value: number | null; notes: number[] }[][];
}

// Create snapshot of current board state
const createSnapshot = (board: Cell[][]): BoardSnapshot => ({
  cells: board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      notes: Array.from(cell.notes),
    }))
  ),
});

// Restore board from snapshot
const restoreFromSnapshot = (board: Cell[][], snapshot: BoardSnapshot): void => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellSnapshot = snapshot.cells[row][col];
      board[row][col].value = cellSnapshot.value;
      board[row][col].notes = new Set(cellSnapshot.notes);
      board[row][col].isValid =
        cellSnapshot.value === null ||
        cellSnapshot.value === board[row][col].correctValue;
    }
  }
};

// Check if row is complete
const isRowComplete = (board: Cell[][], row: number): boolean => {
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (board[row][col].value !== board[row][col].correctValue) {
      return false;
    }
  }
  return true;
};

// Check if column is complete
const isColumnComplete = (board: Cell[][], col: number): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row][col].value !== board[row][col].correctValue) {
      return false;
    }
  }
  return true;
};

// Check if box is complete
const isBoxComplete = (board: Cell[][], boxIndex: number): boolean => {
  const boxStartRow = Math.floor(boxIndex / 3) * BOX_SIZE;
  const boxStartCol = (boxIndex % 3) * BOX_SIZE;

  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      const cell = board[boxStartRow + r][boxStartCol + c];
      if (cell.value !== cell.correctValue) {
        return false;
      }
    }
  }
  return true;
};

// Check if entire board is complete
const isBoardComplete = (board: Cell[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].value !== board[row][col].correctValue) {
        return false;
      }
    }
  }
  return true;
};

// Remove note from related cells when number is placed
const clearRelatedNotes = (
  board: Cell[][],
  row: number,
  col: number,
  num: number
): void => {
  const related = getRelatedPositions({ row, col });
  for (const pos of related) {
    board[pos.row][pos.col].notes.delete(num);
  }
};

// Game state interface
interface GameState {
  // Board state
  board: Cell[][];
  difficulty: Difficulty;

  // Selection
  selectedCell: Position | null;
  highlightedNumber: number | null;

  // Mode
  isNotesMode: boolean;

  // Progress
  mistakeCount: number;
  hintsUsed: number;
  timeElapsed: number;
  isTimerRunning: boolean;

  // Game status
  gameStatus: GameStatus;

  // Undo stack
  history: BoardSnapshot[];
  historyIndex: number;

  // Completion tracking (for wave animations)
  lastCompletedUnit: CompletedUnit | null;
  lastCorrectCell: Position | null;

  // Hint tracking (for technique-based hints)
  lastHint: Hint | null;
  hintHighlightCells: Position[];
}

// Game actions interface
interface GameActions {
  // Initialization
  newGame: (difficulty: Difficulty) => void;
  resetGame: () => void;

  // Cell interaction
  selectCell: (position: Position) => void;
  clearSelection: () => void;

  // Input
  inputNumber: (num: number) => InputResult;
  eraseCell: () => void;

  // Mode
  toggleNotesMode: () => void;

  // Hints
  useHint: () => { row: number; col: number; value: number } | null;
  getStrategicHint: () => Hint | null;
  applyHint: (hint: Hint) => void;
  clearHintHighlight: () => void;

  // Undo
  undo: () => boolean;
  canUndo: () => boolean;

  // Timer
  tick: () => void;
  startTimer: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Progress
  getProgress: () => number;
}

// Initial state
const initialState: GameState = {
  board: createEmptyBoard(),
  difficulty: 'medium',
  selectedCell: null,
  highlightedNumber: null,
  isNotesMode: false,
  mistakeCount: 0,
  hintsUsed: 0,
  timeElapsed: 0,
  isTimerRunning: false,
  gameStatus: 'idle',
  history: [],
  historyIndex: -1,
  lastCompletedUnit: null,
  lastCorrectCell: null,
  lastHint: null,
  hintHighlightCells: [],
};

// Create the store
export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Start a new game — cache-first for instant serving, on-device generation as fallback
      newGame: (difficulty: Difficulty) => {
        let puzzle: number[][];
        let solution: number[][];

        // 1. Try Supabase cache (instant, pre-validated)
        const cached = getCachedGamePuzzle(difficulty);
        if (cached) {
          puzzle = cached.puzzle;
          solution = cached.solution;
          consumeAndRefillGamePuzzle(difficulty, cached.id);
        } else {
          // 2. Cache miss — generate on-device (with minTechniqueLevel validation)
          const generated = generatePuzzle(difficulty);
          puzzle = generated.puzzle;
          solution = generated.solution;
        }

        const board = createBoardFromPuzzle(puzzle, solution);

        set((state) => {
          state.board = board;
          state.difficulty = difficulty;
          state.selectedCell = null;
          state.highlightedNumber = null;
          state.isNotesMode = false;
          state.mistakeCount = 0;
          state.hintsUsed = 0;
          state.timeElapsed = 0;
          state.isTimerRunning = false; // Timer starts after animations complete
          state.gameStatus = 'playing';
          state.history = [];
          state.historyIndex = -1;
          state.lastCompletedUnit = null;
          state.lastCorrectCell = null;
        });
      },

      // Reset to initial state
      resetGame: () => {
        set(initialState);
      },

      // Select a cell
      selectCell: (position: Position) => {
        set((state) => {
          state.selectedCell = position;
          const cell = state.board[position.row][position.col];
          state.highlightedNumber = cell.value;
        });
      },

      // Clear selection
      clearSelection: () => {
        set((state) => {
          state.selectedCell = null;
          state.highlightedNumber = null;
        });
      },

      // Input a number
      inputNumber: (num: number) => {
        const state = get();
        const result: InputResult = {
          isCorrect: false,
          completedUnits: [],
          isGameWon: false,
          isGameLost: false,
        };

        if (!state.selectedCell || state.gameStatus !== 'playing') {
          return result;
        }

        const { row, col } = state.selectedCell;
        const cell = state.board[row][col];

        // Can't modify given cells
        if (cell.isGiven) {
          return result;
        }

        set((draft) => {
          // Save snapshot for undo
          const snapshot = createSnapshot(draft.board);
          draft.history = draft.history.slice(0, draft.historyIndex + 1);
          draft.history.push(snapshot);
          draft.historyIndex++;

          const targetCell = draft.board[row][col];

          if (draft.isNotesMode) {
            // Toggle note
            if (targetCell.notes.has(num)) {
              targetCell.notes.delete(num);
            } else {
              targetCell.notes.add(num);
            }
          } else {
            // Place number
            targetCell.value = num;
            targetCell.notes.clear();
            draft.highlightedNumber = num;

            const isCorrect = num === targetCell.correctValue;
            targetCell.isValid = isCorrect;
            result.isCorrect = isCorrect;

            if (!isCorrect) {
              // Wrong answer
              draft.mistakeCount++;
              // Only end game if mistake limit is enabled in settings
              const { mistakeLimitEnabled } = useSettingsStore.getState();
              if (mistakeLimitEnabled && draft.mistakeCount >= MAX_MISTAKES) {
                draft.gameStatus = 'lost';
                draft.isTimerRunning = false;
                result.isGameLost = true;
              }
            } else {
              // Correct answer
              draft.lastCorrectCell = { row, col };

              // Remove this number from notes in related cells
              clearRelatedNotes(draft.board, row, col, num);

              // Check for completed units
              const timestamp = Date.now();
              const boxIndex = getBoxIndex(row, col);

              if (isRowComplete(draft.board, row)) {
                result.completedUnits.push({
                  type: 'row',
                  index: row,
                  epicenter: { row, col },
                  timestamp,
                });
              }

              if (isColumnComplete(draft.board, col)) {
                result.completedUnits.push({
                  type: 'column',
                  index: col,
                  epicenter: { row, col },
                  timestamp,
                });
              }

              if (isBoxComplete(draft.board, boxIndex)) {
                result.completedUnits.push({
                  type: 'box',
                  index: boxIndex,
                  epicenter: { row, col },
                  timestamp,
                });
              }

              if (result.completedUnits.length > 0) {
                draft.lastCompletedUnit = result.completedUnits[0];
              }

              // Check for win
              if (isBoardComplete(draft.board)) {
                draft.gameStatus = 'won';
                draft.isTimerRunning = false;
                result.isGameWon = true;
              }
            }
          }
        });

        return result;
      },

      // Erase selected cell
      eraseCell: () => {
        const state = get();
        if (!state.selectedCell || state.gameStatus !== 'playing') return;

        const { row, col } = state.selectedCell;
        const cell = state.board[row][col];

        if (cell.isGiven) return;

        set((draft) => {
          // Save snapshot for undo
          const snapshot = createSnapshot(draft.board);
          draft.history = draft.history.slice(0, draft.historyIndex + 1);
          draft.history.push(snapshot);
          draft.historyIndex++;

          const targetCell = draft.board[row][col];
          targetCell.value = null;
          targetCell.notes.clear();
          targetCell.isValid = true;
          draft.highlightedNumber = null;
        });
      },

      // Toggle notes mode
      toggleNotesMode: () => {
        set((state) => {
          state.isNotesMode = !state.isNotesMode;
        });
      },

      // Use a hint (unlimited hints enabled)
      useHint: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return null;

        // Find random empty cell
        const emptyCells: Position[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (cell.value === null) {
              emptyCells.push({ row, col });
            }
          }
        }

        if (emptyCells.length === 0) return null;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = state.board[randomCell.row][randomCell.col].correctValue;

        set((draft) => {
          draft.hintsUsed++;
          draft.selectedCell = randomCell;

          // Save snapshot for undo
          const snapshot = createSnapshot(draft.board);
          draft.history = draft.history.slice(0, draft.historyIndex + 1);
          draft.history.push(snapshot);
          draft.historyIndex++;

          // Place the correct value
          const cell = draft.board[randomCell.row][randomCell.col];
          cell.value = correctValue;
          cell.notes.clear();
          cell.isValid = true;
          draft.highlightedNumber = correctValue;
          draft.lastCorrectCell = randomCell;

          // Clear related notes
          clearRelatedNotes(draft.board, randomCell.row, randomCell.col, correctValue);

          // Check for win
          if (isBoardComplete(draft.board)) {
            draft.gameStatus = 'won';
            draft.isTimerRunning = false;
          }
        });

        return { row: randomCell.row, col: randomCell.col, value: correctValue };
      },

      // Get a strategic hint using the solver (technique-based)
      getStrategicHint: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return null;

        // Convert current board state to puzzle format (0 = empty)
        const puzzle: number[][] = state.board.map((row) =>
          row.map((cell) => cell.value ?? 0)
        );

        // Create solver with full technique arsenal
        const solver = new SudokuSolver({
          maxTechniqueLevel: 4,
          trackSteps: true,
        });

        const hint = solver.getHint(puzzle);

        if (!hint) {
          // No logical next step found - fall back to random hint
          return null;
        }

        // Store the hint for display
        set((draft) => {
          draft.lastHint = hint;
          draft.hintHighlightCells = hint.highlightCells;
        });

        return hint;
      },

      // Apply a strategic hint (place the value and update state)
      applyHint: (hint: Hint) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;

        // For placement hints, apply the value
        if (hint.targetValue) {
          set((draft) => {
            draft.hintsUsed++;
            draft.selectedCell = hint.targetCell;

            // Save snapshot for undo
            const snapshot = createSnapshot(draft.board);
            draft.history = draft.history.slice(0, draft.historyIndex + 1);
            draft.history.push(snapshot);
            draft.historyIndex++;

            // Place the value
            const cell = draft.board[hint.targetCell.row][hint.targetCell.col];
            cell.value = hint.targetValue!;
            cell.notes.clear();
            cell.isValid = true;
            draft.highlightedNumber = hint.targetValue!;
            draft.lastCorrectCell = hint.targetCell;

            // Clear related notes
            clearRelatedNotes(
              draft.board,
              hint.targetCell.row,
              hint.targetCell.col,
              hint.targetValue!
            );

            // Clear hint state
            draft.lastHint = null;
            draft.hintHighlightCells = [];

            // Check for win
            if (isBoardComplete(draft.board)) {
              draft.gameStatus = 'won';
              draft.isTimerRunning = false;
            }
          });
        } else {
          // Elimination-only hint - just highlight and explain
          set((draft) => {
            draft.hintsUsed++;
            draft.lastHint = null;
            draft.hintHighlightCells = [];
          });
        }
      },

      // Clear hint highlight cells
      clearHintHighlight: () => {
        set((draft) => {
          draft.lastHint = null;
          draft.hintHighlightCells = [];
        });
      },

      // Undo last move
      undo: () => {
        const state = get();
        if (state.historyIndex < 0) return false;

        set((draft) => {
          const snapshot = draft.history[draft.historyIndex];
          restoreFromSnapshot(draft.board, snapshot);
          draft.historyIndex--;
          draft.lastCorrectCell = null;
          draft.lastCompletedUnit = null;
        });

        return true;
      },

      // Check if can undo
      canUndo: () => {
        return get().historyIndex >= 0;
      },

      // Timer tick
      tick: () => {
        set((state) => {
          if (state.isTimerRunning) {
            state.timeElapsed++;
          }
        });
      },

      // Start timer (called after entrance animations complete)
      startTimer: () => {
        set((state) => {
          if (state.gameStatus === 'playing' && !state.isTimerRunning) {
            state.isTimerRunning = true;
          }
        });
      },

      // Pause game
      pauseGame: () => {
        set((state) => {
          if (state.gameStatus === 'playing') {
            state.gameStatus = 'paused';
            state.isTimerRunning = false;
          }
        });
      },

      // Resume game
      resumeGame: () => {
        set((state) => {
          if (state.gameStatus === 'paused') {
            state.gameStatus = 'playing';
            state.isTimerRunning = true;
          }
        });
      },

      // Get progress percentage
      getProgress: () => {
        const state = get();
        let filled = 0;
        let total = 0;

        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (!cell.isGiven) {
              total++;
              if (cell.value === cell.correctValue) {
                filled++;
              }
            }
          }
        }

        return total === 0 ? 0 : filled / total;
      },
    }))
  )
);

// Record game win for streak tracking — fires on ANY game win (regular or daily)
useGameStore.subscribe(
  (s) => s.gameStatus,
  (gameStatus) => {
    if (gameStatus === 'won') {
      useDailyChallengeStore.getState().recordGameWin();
    }
  },
);

// Selectors for optimized subscriptions
export const useSelectedCell = () => useGameStore((s) => s.selectedCell);
export const useIsNotesMode = () => useGameStore((s) => s.isNotesMode);
export const useGameStatus = () => useGameStore((s) => s.gameStatus);
export const useMistakeCount = () => useGameStore((s) => s.mistakeCount);
export const useHintsUsed = () => useGameStore((s) => s.hintsUsed);
export const useCanUseHint = () => true; // Unlimited hints enabled
export const useTimeElapsed = () => useGameStore((s) => s.timeElapsed);
export const useDifficulty = () => useGameStore((s) => s.difficulty);

// Progress selector - subscribes to board changes and computes progress
export const useProgress = () => useGameStore((s) => {
  let filled = 0;
  let total = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = s.board[row][col];
      if (!cell.isGiven) {
        total++;
        if (cell.value === cell.correctValue) {
          filled++;
        }
      }
    }
  }

  return total === 0 ? 0 : filled / total;
});

// Check if there's a resumable game (paused or playing with progress)
export const useHasResumableGame = () => {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  // Game is resumable if it's paused, or if it's playing and has some progress
  return gameStatus === 'paused' || (gameStatus === 'playing' && timeElapsed > 0);
};

// Get resumable game info for display
export const useResumableGameInfo = () => {
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const getProgress = useGameStore((s) => s.getProgress);

  const hasResumable = gameStatus === 'paused' || (gameStatus === 'playing' && timeElapsed > 0);

  if (!hasResumable) return null;

  return {
    difficulty,
    timeElapsed,
    progress: getProgress(),
  };
};

// Selector for cells related to current selection
export const useRelatedCells = (): Set<string> => {
  const selectedCell = useGameStore((s) => s.selectedCell);
  if (!selectedCell) return new Set();

  const related = getRelatedPositions(selectedCell);
  return new Set(related.map(positionKey));
};

// Hint selectors
export const useLastHint = () => useGameStore((s) => s.lastHint);
export const useHintHighlightCells = () => useGameStore((s) => s.hintHighlightCells);

// Set of hint highlight cell keys for efficient lookup
export const useHintHighlightSet = (): Set<string> => {
  const hintCells = useGameStore((s) => s.hintHighlightCells);
  return new Set(hintCells.map(positionKey));
};
