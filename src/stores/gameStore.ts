// Core game state management with Zustand
// Replaces iOS GameViewModel

import { useMemo } from 'react';
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

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
  MAX_CONTINUES,
  getBoxIndex,
  getRelatedPositions,
  positionKey,
} from '../engine/types';
import { generatePuzzle, generateDailyPuzzle } from '../engine/generator';
import { SudokuSolver, Hint } from '../engine/solver';
import { useSettingsStore } from './settingsStore';
import {
  getCachedGamePuzzle,
  consumeAndRefillGamePuzzle,
} from '../services/puzzleCacheService';
import { handleGameWon, handleGameLost } from '../services/gameOutcomeHandler';
import { recordGameCompletion } from '../services/gameCompletionService';
import { GAME_BASE_XP } from '../constants/xp';

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
  paidHintsRemaining: number; // Extra hints from Fishies (pack or single)
  timeElapsed: number;
  isTimerRunning: boolean;

  // Game status
  gameStatus: GameStatus;

  // Undo stack
  history: BoardSnapshot[];
  historyIndex: number;

  // Completion tracking (for wave animations)
  lastCompletedUnits: CompletedUnit[];
  lastCorrectCell: Position | null;
  /** Only set by inputNumber on correct placement — used for XP badge (hints excluded) */
  lastManualCorrectCell: Position | null;

  // Consecutive correct placements (for streak animations)
  correctStreak: number;

  // Hint tracking (for technique-based hints)
  lastHint: Hint | null;
  hintHighlightCells: Position[];

  // Continue / daily tracking
  isDaily: boolean;
  continueCount: number;

  // XP badge (per-placement XP for manual correct entries)
  xpPerPlacement: number;
}

// Game actions interface
interface GameActions {
  // Initialization
  newGame: (difficulty: Difficulty) => void;
  newDailyGame: (dateString: string, difficulty: Difficulty) => void;
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
  dismissHintModal: () => void;

  // Undo
  undo: () => boolean;
  canUndo: () => boolean;

  // Timer
  tick: () => void;
  startTimer: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Continue after losing
  continueGame: () => boolean;
  canContinue: () => boolean;

  addPaidHints: (count: number) => void;

  // Progress
  getProgress: () => number;

  // Debug (DEV only)
  debugDrainHints: () => void;
  debugForceLose: () => void;
  debugForceWin: () => void;
  debugTriggerAnimation: () => void;
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
  paidHintsRemaining: 0,
  timeElapsed: 0,
  isTimerRunning: false,
  gameStatus: 'idle',
  history: [],
  historyIndex: -1,
  lastCompletedUnits: [],
  lastCorrectCell: null,
  lastManualCorrectCell: null,
  correctStreak: 0,
  lastHint: null,
  hintHighlightCells: [],
  isDaily: false,
  continueCount: 0,
  xpPerPlacement: 1,
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
        const fillableCount = board.flat().filter((c) => !c.isGiven).length;
        const xpPerPlacement = Math.max(
          1,
          Math.round(GAME_BASE_XP[difficulty] / fillableCount),
        );

        set((state) => {
          state.board = board;
          state.difficulty = difficulty;
          state.selectedCell = null;
          state.highlightedNumber = null;
          state.isNotesMode = false;
          state.mistakeCount = 0;
          state.hintsUsed = 0;
          state.paidHintsRemaining = 0;
          state.timeElapsed = 0;
          state.isTimerRunning = false; // Timer starts after animations complete
          state.gameStatus = 'playing';
          state.history = [];
          state.historyIndex = -1;
          state.lastCompletedUnits = [];
          state.lastCorrectCell = null;
          state.lastManualCorrectCell = null;
          state.correctStreak = 0;
          state.isDaily = false;
          state.continueCount = 0;
          state.xpPerPlacement = xpPerPlacement;
          state.lastHint = null;
          state.hintHighlightCells = [];
        });
      },

      // Start today's daily challenge (deterministic puzzle from date seed)
      newDailyGame: (dateString: string, difficulty: Difficulty) => {
        const generated = generateDailyPuzzle(dateString, difficulty);
        const board = createBoardFromPuzzle(generated.puzzle, generated.solution);
        const fillableCount = board.flat().filter((c) => !c.isGiven).length;
        const xpPerPlacement = Math.max(
          1,
          Math.round(GAME_BASE_XP[difficulty] / fillableCount),
        );

        set((state) => {
          state.board = board;
          state.difficulty = difficulty;
          state.selectedCell = null;
          state.highlightedNumber = null;
          state.isNotesMode = false;
          state.mistakeCount = 0;
          state.hintsUsed = 0;
          state.paidHintsRemaining = 0;
          state.timeElapsed = 0;
          state.isTimerRunning = false;
          state.gameStatus = 'playing';
          state.history = [];
          state.historyIndex = -1;
          state.lastCompletedUnits = [];
          state.lastCorrectCell = null;
          state.lastManualCorrectCell = null;
          state.correctStreak = 0;
          state.isDaily = true;
          state.continueCount = 0;
          state.xpPerPlacement = xpPerPlacement;
          state.lastHint = null;
          state.hintHighlightCells = [];
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
              draft.correctStreak = 0;
              // Only end game if mistake limit is enabled in settings
              const { unlimitedMistakes } = useSettingsStore.getState();
              if (!unlimitedMistakes && draft.mistakeCount >= MAX_MISTAKES) {
                draft.gameStatus = 'lost';
                draft.isTimerRunning = false;
                result.isGameLost = true;
              }
            } else {
              // Correct answer (manual placement only — hints use useHint/applyHint)
              draft.lastCorrectCell = { row, col };
              draft.lastManualCorrectCell = { row, col };
              draft.correctStreak++;

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
                draft.lastCompletedUnits = result.completedUnits;
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

      // Use a hint: try strategic placement first, fall back to random fill
      useHint: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return null;

        const { unlimitedHints } = useSettingsStore.getState();
        const canUseFree = unlimitedHints || state.hintsUsed < MAX_HINTS;
        if (!canUseFree && state.paidHintsRemaining <= 0) {
          return null; // Caller shows HintAdSheet for ad-based hint
        }

        const usePaidSlot = !canUseFree;

        // Try to find a strategic placement hint via the solver
        const puzzle: number[][] = state.board.map((row) =>
          row.map((cell) => cell.value ?? 0)
        );
        const solver = new SudokuSolver({
          maxTechniqueLevel: 4,
          trackSteps: true,
        });
        const strategicHint = solver.getHint(puzzle);

        // Use strategic hint only if it produces a direct placement
        if (strategicHint?.targetValue) {
          const { targetCell, targetValue } = strategicHint;

          set((draft) => {
            draft.hintsUsed++;
            if (usePaidSlot && draft.paidHintsRemaining > 0) draft.paidHintsRemaining--;
            draft.selectedCell = targetCell;

            const snapshot = createSnapshot(draft.board);
            draft.history = draft.history.slice(0, draft.historyIndex + 1);
            draft.history.push(snapshot);
            draft.historyIndex++;

            const cell = draft.board[targetCell.row][targetCell.col];
            cell.value = targetValue!;
            cell.notes.clear();
            cell.isValid = true;
            draft.highlightedNumber = targetValue!;
            draft.lastCorrectCell = targetCell;

            clearRelatedNotes(draft.board, targetCell.row, targetCell.col, targetValue!);

            // Store hint so the modal can display the explanation
            draft.lastHint = strategicHint;
            draft.hintHighlightCells = strategicHint.highlightCells;

            if (isBoardComplete(draft.board)) {
              draft.gameStatus = 'won';
              draft.isTimerRunning = false;
            }
          });

          return { row: targetCell.row, col: targetCell.col, value: targetValue! };
        }

        // Fallback: random empty cell, no modal
        const emptyCells: Position[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (state.board[row][col].value === null) {
              emptyCells.push({ row, col });
            }
          }
        }

        if (emptyCells.length === 0) return null;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = state.board[randomCell.row][randomCell.col].correctValue;

        set((draft) => {
          draft.hintsUsed++;
          if (usePaidSlot && draft.paidHintsRemaining > 0) draft.paidHintsRemaining--;
          draft.selectedCell = randomCell;

          const snapshot = createSnapshot(draft.board);
          draft.history = draft.history.slice(0, draft.historyIndex + 1);
          draft.history.push(snapshot);
          draft.historyIndex++;

          const cell = draft.board[randomCell.row][randomCell.col];
          cell.value = correctValue;
          cell.notes.clear();
          cell.isValid = true;
          draft.highlightedNumber = correctValue;
          draft.lastCorrectCell = randomCell;

          clearRelatedNotes(draft.board, randomCell.row, randomCell.col, correctValue);

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

        const { unlimitedHints } = useSettingsStore.getState();
        const canUseFree = unlimitedHints || state.hintsUsed < MAX_HINTS;
        if (!canUseFree && state.paidHintsRemaining <= 0) {
          return; // No hint available; caller can show HintAdSheet
        }
        const usePaidSlot = !canUseFree;

        // For placement hints, apply the value
        if (hint.targetValue) {
          set((draft) => {
            draft.hintsUsed++;
            if (usePaidSlot && draft.paidHintsRemaining > 0) draft.paidHintsRemaining--;
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
            if (usePaidSlot && draft.paidHintsRemaining > 0) draft.paidHintsRemaining--;
            draft.lastHint = null;
            draft.hintHighlightCells = [];
          });
        }
      },

      addPaidHints: (count: number) => {
        if (count <= 0) return;
        set((state) => {
          state.paidHintsRemaining += count;
        });
      },

      // Clear hint highlight cells
      clearHintHighlight: () => {
        set((draft) => {
          draft.lastHint = null;
          draft.hintHighlightCells = [];
        });
      },

      // Dismiss the hint explanation modal
      dismissHintModal: () => {
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
          draft.lastManualCorrectCell = null;
          draft.lastCompletedUnits = [];
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

      continueGame: (): boolean => {
        const { continueCount, gameStatus } = get();
        if (gameStatus !== 'lost' || continueCount >= MAX_CONTINUES) return false;

        set((draft) => {
          draft.mistakeCount = MAX_MISTAKES - 1;
          draft.gameStatus = 'playing';
          draft.isTimerRunning = true;
          draft.continueCount += 1;
        });

        return true;
      },

      canContinue: (): boolean => {
        const { continueCount, gameStatus } = get();
        return gameStatus === 'lost' && continueCount < MAX_CONTINUES;
      },

      debugDrainHints: () => {
        set((draft) => {
          draft.hintsUsed = MAX_HINTS;
          draft.paidHintsRemaining = 0;
        });
      },

      debugForceLose: () => {
        set((draft) => {
          draft.mistakeCount = MAX_MISTAKES;
          draft.gameStatus = 'lost';
          draft.isTimerRunning = false;
        });
      },

      debugForceWin: () => {
        set((draft) => {
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              const cell = draft.board[row][col];
              if (cell.value !== cell.correctValue) {
                cell.value = cell.correctValue;
                cell.isValid = true;
                cell.notes.clear();
              }
            }
          }
          draft.gameStatus = 'won';
          draft.isTimerRunning = false;
        });
      },

      debugTriggerAnimation: () => {
        const { selectedCell } = get();
        if (!selectedCell) return;
        set((draft) => {
          draft.lastCompletedUnits = [
            {
              type: 'row',
              index: selectedCell.row,
              epicenter: selectedCell,
              timestamp: Date.now(),
            },
          ];
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

// Handle game outcome side effects (streaks, mochi, XP, stats)
useGameStore.subscribe(
  (s) => s.gameStatus,
  (gameStatus) => {
    if (gameStatus === 'won') handleGameWon();
    if (gameStatus === 'lost') handleGameLost();
  },
);

// Log every game completion (win or loss) to Supabase for analytics
useGameStore.subscribe(
  (s) => s.gameStatus,
  (gameStatus) => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const { difficulty, timeElapsed, mistakeCount, hintsUsed } = useGameStore.getState();
      recordGameCompletion({
        difficulty,
        timeSeconds: timeElapsed,
        won: gameStatus === 'won',
        mistakeCount,
        hintsUsed,
      });
    }
  },
);

// Singleton timer: exactly one interval ever, regardless of how many game screens are mounted
let _timerInterval: ReturnType<typeof setInterval> | null = null;
useGameStore.subscribe(
  (s) => s.isTimerRunning,
  (isRunning) => {
    if (_timerInterval) {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }
    if (isRunning) {
      _timerInterval = setInterval(() => {
        useGameStore.getState().tick();
      }, 1000);
    }
  },
);

// Selectors for optimized subscriptions
export const useSelectedCell = () => useGameStore((s) => s.selectedCell);
export const useIsNotesMode = () => useGameStore((s) => s.isNotesMode);
export const useGameStatus = () => useGameStore((s) => s.gameStatus);
export const useMistakeCount = () => useGameStore((s) => s.mistakeCount);
export const useHintsUsed = () => useGameStore((s) => s.hintsUsed);
export const useCanUseHint = () => {
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const paidHintsRemaining = useGameStore((s) => s.paidHintsRemaining);
  const { unlimitedHints } = useSettingsStore.getState();
  return unlimitedHints || hintsUsed < MAX_HINTS || paidHintsRemaining > 0;
};
export const useTimeElapsed = () => useGameStore((s) => s.timeElapsed);
export const useDifficulty = () => useGameStore((s) => s.difficulty);
export const useCanContinue = () => useGameStore((s) => s.canContinue);

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

const EMPTY_RELATED_SET = new Set<string>();

// Selector for cells related to current selection
export const useRelatedCells = (): Set<string> => {
  const selectedCell = useGameStore((s) => s.selectedCell);
  return useMemo(() => {
    if (!selectedCell) return EMPTY_RELATED_SET;
    return new Set(getRelatedPositions(selectedCell).map(positionKey));
  }, [selectedCell?.row, selectedCell?.col]);
};

// Hint selectors
export const useLastHint = () => useGameStore((s) => s.lastHint);
export const useHintHighlightCells = () => useGameStore((s) => s.hintHighlightCells);

// Set of hint highlight cell keys for efficient lookup
export const useHintHighlightSet = (): Set<string> => {
  const hintCells = useGameStore((s) => s.hintHighlightCells);
  return new Set(hintCells.map(positionKey));
};

// Remaining count per number (9 - placed count). Index 0 is unused.
// Uses useShallow to prevent infinite re-renders from new array references.
export const useRemainingCounts = (): number[] => {
  return useGameStore(
    useShallow((s) => {
      const counts = new Array(10).fill(0);
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const val = s.board[row][col].value;
          if (val !== null && val >= 1 && val <= 9) {
            counts[val]++;
          }
        }
      }
      return counts.map((c) => 9 - c);
    })
  );
};
