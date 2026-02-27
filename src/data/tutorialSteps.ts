// Static tutorial step definitions for the "how to play" flow.
// Steps 1–5 share a single partial puzzle with different highlight masks per step.

export type TutorialStepPhase = 'welcome' | 'slide' | 'complete';

export interface TutorialStep {
  phase: TutorialStepPhase;
  // ShowcasePage fields (welcome / complete)
  heading?: string;
  bodyText?: string;
  // Slide fields
  mascotMessage?: string;
  puzzle?: number[][];      // 9×9 grid, 0 = empty
  highlightCells?: string[]; // "row,col" position keys
}

// A single static partial puzzle used across all board slides.
// Non-zero values are shown as "given" cells on the board.
const DEMO_PUZZLE: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

// Highlight all cells in row 4 (0-indexed)
const ROW_HIGHLIGHTS = Array.from({ length: 9 }, (_, col) => `4,${col}`);

// Highlight all cells in column 4
const COL_HIGHLIGHTS = Array.from({ length: 9 }, (_, row) => `${row},4`);

// Highlight the center 3×3 box (rows 3–5, cols 3–5)
const BOX_HIGHLIGHTS: string[] = [];
for (let r = 3; r <= 5; r++) {
  for (let c = 3; c <= 5; c++) {
    BOX_HIGHLIGHTS.push(`${r},${c}`);
  }
}

// Highlight all non-zero (given) cells in the demo puzzle
const GIVEN_HIGHLIGHTS: string[] = [];
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    if (DEMO_PUZZLE[r][c] !== 0) {
      GIVEN_HIGHLIGHTS.push(`${r},${c}`);
    }
  }
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // Step 0 — Welcome
  {
    phase: 'welcome',
    heading: 'how to play',
    bodyText:
      "Sudoku is a number puzzle on a 9×9 grid. Fill every empty cell with the right number — no guessing needed!",
  },

  // Step 1 — The Grid
  {
    phase: 'slide',
    mascotMessage:
      "This is the sudoku board — a 9×9 grid divided into nine 3×3 boxes.",
    puzzle: DEMO_PUZZLE,
    highlightCells: [],
  },

  // Step 2 — Rows
  {
    phase: 'slide',
    mascotMessage:
      "Each of the 9 rows must contain every number from 1 to 9, exactly once.",
    puzzle: DEMO_PUZZLE,
    highlightCells: ROW_HIGHLIGHTS,
  },

  // Step 3 — Columns
  {
    phase: 'slide',
    mascotMessage:
      "Each of the 9 columns must also contain every number from 1 to 9, once.",
    puzzle: DEMO_PUZZLE,
    highlightCells: COL_HIGHLIGHTS,
  },

  // Step 4 — Boxes
  {
    phase: 'slide',
    mascotMessage:
      "And each of the nine 3×3 boxes must have every number from 1 to 9 too. That's the whole rule!",
    puzzle: DEMO_PUZZLE,
    highlightCells: BOX_HIGHLIGHTS,
  },

  // Step 5 — Given clues
  {
    phase: 'slide',
    mascotMessage:
      "Some cells are pre-filled as clues — these are the 'givens'. Use them to figure out the rest!",
    puzzle: DEMO_PUZZLE,
    highlightCells: GIVEN_HIGHLIGHTS,
  },

  // Step 6 — Complete
  {
    phase: 'complete',
    heading: "you're ready!",
    bodyText:
      "Every row, column, and box needs the numbers 1–9. Use the given clues to solve the puzzle. You've got this!",
  },
];
