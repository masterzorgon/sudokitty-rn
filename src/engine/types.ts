// Core types for Sudokitty - matching iOS models

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const MAX_MISTAKES = 3;
export const MAX_HINTS = 3;

// Position on the board
export interface Position {
  row: number;
  col: number;
}

// Individual cell in the sudoku grid
export interface Cell {
  row: number;
  col: number;
  value: number | null; // null = empty, 1-9 = filled
  correctValue: number; // The solution value
  isGiven: boolean; // Pre-filled clue (not editable)
  notes: Set<number>; // Pencil marks (candidates 1-9)
  isValid: boolean; // True if value matches correctValue
}

// Difficulty levels with clue ranges
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultyConfig {
  name: Difficulty;
  clueRange: [number, number]; // [min, max] clues
  maxTechniqueLevel: number; // 1-4
  mochiComment: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    clueRange: [36, 50],
    maxTechniqueLevel: 1,
    mochiComment: "purrfect for warming up~",
  },
  medium: {
    name: 'medium',
    clueRange: [30, 40],
    maxTechniqueLevel: 2,
    mochiComment: "let's get cozy with this one!",
  },
  hard: {
    name: 'hard',
    clueRange: [25, 32],
    maxTechniqueLevel: 3,
    mochiComment: "ooh, feeling brave today?",
  },
  expert: {
    name: 'expert',
    clueRange: [22, 28],
    maxTechniqueLevel: 4,
    mochiComment: "you've got this... i believe in you!",
  },
};

// Game state
export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

// Mochi mood states (matching iOS MochiMood)
export type MochiMood =
  | 'idle'
  | 'watching'
  | 'happy'
  | 'disappointed'
  | 'sleepy'
  | 'thinking'
  | 'celebrating'
  | 'sad'
  | 'curious';

export interface MochiMoodConfig {
  mood: MochiMood;
  comments: string[];
  animationDuration: number; // milliseconds
}

export const MOCHI_MOODS: Record<MochiMood, MochiMoodConfig> = {
  idle: {
    mood: 'idle',
    comments: ['*purrs softly*', '...', '*tail swish*'],
    animationDuration: 1000,
  },
  watching: {
    mood: 'watching',
    comments: ['hmm...', '*watches intently*', 'take your time~'],
    animationDuration: 1000,
  },
  happy: {
    mood: 'happy',
    comments: ['yay!', 'nice one!', 'purrfect!', '*happy purr*'],
    animationDuration: 1500,
  },
  disappointed: {
    mood: 'disappointed',
    comments: ['oops!', 'try again~', "that's not quite right..."],
    animationDuration: 1500,
  },
  sleepy: {
    mood: 'sleepy',
    comments: ['*zzz*', '*yawn*', '*stretches*'],
    animationDuration: 1000,
  },
  thinking: {
    mood: 'thinking',
    comments: ['hmm...', 'let me think...', '*tilts head*'],
    animationDuration: 3000,
  },
  celebrating: {
    mood: 'celebrating',
    comments: ['*happy dance*', 'you did it!', 'amazing!'],
    animationDuration: 2000,
  },
  sad: {
    mood: 'sad',
    comments: ['aww...', "don't give up!", 'we can try again~'],
    animationDuration: 1000,
  },
  curious: {
    mood: 'curious',
    comments: ['ooh?', 'a new puzzle!', "*ears perk up*"],
    animationDuration: 1000,
  },
};

// Completed unit for wave animations
export interface CompletedUnit {
  type: 'row' | 'column' | 'box';
  index: number;
  epicenter: Position; // Cell that triggered completion
  timestamp: number;
}

// Move record for undo/redo
export interface MoveRecord {
  position: Position;
  previousValue: number | null;
  previousNotes: Set<number>;
  newValue: number | null;
  newNotes: Set<number>;
}

// Input result after placing a number
export interface InputResult {
  isCorrect: boolean;
  completedUnits: CompletedUnit[];
  isGameWon: boolean;
  isGameLost: boolean;
}

// Generated puzzle result
export interface GeneratedPuzzle {
  puzzle: number[][]; // 0 = empty, 1-9 = given
  solution: number[][];
}

// Stats per difficulty
export interface DifficultyStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number | null; // seconds
  averageTime: number | null;
  currentWinStreak: number;
  longestWinStreak: number;
}

// User stats
export interface UserStats {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
  expert: DifficultyStats;
}

// Helper to create empty stats
export const createEmptyStats = (): DifficultyStats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: null,
  averageTime: null,
  currentWinStreak: 0,
  longestWinStreak: 0,
});

// Helper to get box index from position
export const getBoxIndex = (row: number, col: number): number => {
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
};

// Helper to get all positions in same row/col/box
export const getRelatedPositions = (pos: Position): Position[] => {
  const related: Position[] = [];
  const boxStartRow = Math.floor(pos.row / BOX_SIZE) * BOX_SIZE;
  const boxStartCol = Math.floor(pos.col / BOX_SIZE) * BOX_SIZE;

  for (let i = 0; i < BOARD_SIZE; i++) {
    // Same row
    if (i !== pos.col) {
      related.push({ row: pos.row, col: i });
    }
    // Same column
    if (i !== pos.row) {
      related.push({ row: i, col: pos.col });
    }
  }

  // Same box (avoiding duplicates from row/col)
  for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
    for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
      if (r !== pos.row && c !== pos.col) {
        related.push({ row: r, col: c });
      }
    }
  }

  return related;
};

// Helper to check if position is in completed row/col/box
export const positionKey = (pos: Position): string => `${pos.row}-${pos.col}`;

// ============================================
// Daily Challenge Types
// ============================================

// Daily challenge configuration
export interface DailyChallenge {
  date: string; // YYYY-MM-DD format
  difficulty: Difficulty;
  seed: number; // Deterministic seed for puzzle generation
  mochiPoints: number; // Reward for completion
}

// User's daily challenge state (persisted)
export interface DailyChallengeState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  completedDates: string[]; // Array of completed date strings
  totalMochiPoints: number;
}

// Activity calendar day for display
export interface ActivityDay {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// Mochi points awarded by difficulty
export const DAILY_MOCHI_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
  expert: 50,
};

// Daily difficulty schedule (0 = Sunday, 6 = Saturday)
export const DAILY_DIFFICULTY_SCHEDULE: Record<number, Difficulty> = {
  0: 'easy',    // Sunday
  1: 'medium',  // Monday
  2: 'hard',    // Tuesday
  3: 'expert',  // Wednesday
  4: 'hard',    // Thursday
  5: 'medium',  // Friday
  6: 'easy',    // Saturday
};

// Helper to get today's date as YYYY-MM-DD
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to get yesterday's date as YYYY-MM-DD
export const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Helper to generate deterministic seed from date string
export const getDateSeed = (dateString: string): number => {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Helper to create empty daily challenge state
export const createEmptyDailyChallengeState = (): DailyChallengeState => ({
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  completedDates: [],
  totalMochiPoints: 0,
});
