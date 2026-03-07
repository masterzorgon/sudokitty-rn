// Level 4 - Expert curated puzzles
// Swordfish, XY-Wing, XYZ-Wing, BUG, Unique Rectangle

import { PartialPuzzleBank } from './types';

export const level4Puzzles: PartialPuzzleBank = {
  'swordfish': [
    {
      puzzle: [
        [0, 0, 4, 3, 1, 9, 0, 0, 0],
        [5, 0, 9, 0, 6, 0, 0, 0, 0],
        [0, 1, 0, 0, 5, 0, 0, 9, 0],
        [9, 0, 6, 8, 0, 1, 0, 7, 0],
        [0, 0, 0, 6, 0, 0, 0, 0, 9],
        [3, 0, 7, 9, 0, 5, 0, 0, 8],
        [0, 6, 5, 4, 9, 0, 0, 8, 3],
        [0, 9, 0, 1, 0, 6, 0, 5, 0],
        [2, 0, 0, 5, 8, 0, 9, 0, 0],
      ],
      solution: [
        [6, 7, 4, 3, 1, 9, 8, 2, 5],
        [5, 2, 9, 7, 6, 8, 4, 3, 1],
        [8, 1, 3, 2, 5, 4, 7, 9, 6],
        [9, 5, 6, 8, 4, 1, 3, 7, 2],
        [1, 8, 2, 6, 7, 3, 5, 4, 9],
        [3, 4, 7, 9, 2, 5, 6, 1, 8],
        [7, 6, 5, 4, 9, 2, 1, 8, 3],
        [4, 9, 8, 1, 3, 6, 2, 5, 7],
        [2, 3, 1, 5, 8, 7, 9, 6, 4],
      ],
      techniqueResult: {
        techniqueName: 'Swordfish',
        level: 4,
        explanation: 'Swordfish: 3 in rows 3, 4, 8 aligns in columns 3, 5, 7',
        highlightCells: [
          { row: 2, col: 2 }, { row: 2, col: 6 },
          { row: 3, col: 4 }, { row: 3, col: 6 },
          { row: 7, col: 2 }, { row: 7, col: 4 },
        ],
        eliminations: [
          { position: { row: 8, col: 2 }, candidates: [3] },
          { position: { row: 4, col: 4 }, candidates: [3] },
          { position: { row: 1, col: 6 }, candidates: [3] },
          { position: { row: 4, col: 6 }, candidates: [3] },
        ],
        placements: [],
      },
    },
  ],

  'xy-wing': [
    {
      puzzle: [
        [0, 0, 0, 7, 9, 5, 8, 1, 4],
        [0, 0, 0, 4, 1, 2, 6, 3, 9],
        [0, 4, 9, 8, 3, 6, 5, 7, 2],
        [9, 0, 0, 5, 8, 0, 7, 2, 6],
        [7, 8, 0, 1, 0, 0, 9, 4, 5],
        [5, 2, 0, 0, 7, 9, 3, 8, 1],
        [2, 0, 8, 0, 4, 7, 1, 0, 3],
        [0, 0, 0, 0, 0, 8, 2, 0, 7],
        [6, 0, 7, 0, 5, 0, 4, 9, 8],
      ],
      solution: [
        [3, 6, 2, 7, 9, 5, 8, 1, 4],
        [8, 7, 5, 4, 1, 2, 6, 3, 9],
        [1, 4, 9, 8, 3, 6, 5, 7, 2],
        [9, 1, 3, 5, 8, 4, 7, 2, 6],
        [7, 8, 6, 1, 2, 3, 9, 4, 5],
        [5, 2, 4, 6, 7, 9, 3, 8, 1],
        [2, 5, 8, 9, 4, 7, 1, 6, 3],
        [4, 9, 1, 3, 6, 8, 2, 5, 7],
        [6, 3, 7, 2, 5, 1, 4, 9, 8],
      ],
      techniqueResult: {
        techniqueName: 'XY-Wing',
        level: 4,
        explanation: 'XY-Wing: Pivot R6C4 (4,6), wings R2C4 (4,2) and R5C5 (6,2) eliminate 2',
        highlightCells: [{ row: 5, col: 3 }, { row: 1, col: 3 }, { row: 4, col: 4 }],
        eliminations: [{ position: { row: 1, col: 4 }, candidates: [2] }],
        placements: [],
      },
    },
    {
      puzzle: [
        [0, 2, 0, 4, 8, 0, 5, 0, 3],
        [0, 5, 0, 6, 2, 0, 9, 0, 8],
        [0, 0, 0, 5, 9, 0, 0, 0, 7],
        [7, 6, 5, 3, 1, 4, 8, 9, 2],
        [0, 1, 0, 2, 5, 9, 3, 7, 6],
        [0, 9, 0, 8, 7, 6, 1, 5, 4],
        [0, 8, 0, 7, 0, 5, 0, 3, 1],
        [5, 0, 0, 1, 0, 2, 7, 8, 9],
        [1, 7, 0, 9, 3, 8, 6, 0, 5],
      ],
      solution: [
        [6, 2, 9, 4, 8, 7, 5, 1, 3],
        [3, 5, 7, 6, 2, 1, 9, 4, 8],
        [8, 4, 1, 5, 9, 3, 2, 6, 7],
        [7, 6, 5, 3, 1, 4, 8, 9, 2],
        [4, 1, 8, 2, 5, 9, 3, 7, 6],
        [2, 9, 3, 8, 7, 6, 1, 5, 4],
        [9, 8, 2, 7, 6, 5, 4, 3, 1],
        [5, 3, 6, 1, 4, 2, 7, 8, 9],
        [1, 7, 4, 9, 3, 8, 6, 2, 5],
      ],
      techniqueResult: {
        techniqueName: 'XY-Wing',
        level: 4,
        explanation: 'XY-Wing: Pivot R9C3 (2,4), wings R6C3 (2,3) and R8C2 (4,3) eliminate 3',
        highlightCells: [{ row: 8, col: 2 }, { row: 5, col: 2 }, { row: 7, col: 1 }],
        eliminations: [{ position: { row: 7, col: 2 }, candidates: [3] }],
        placements: [],
      },
    },
  ],

  'xyz-wing': [
    {
      // Verified: solver finds XYZ-Wing on raw grid
      puzzle: [[0,0,0,0,2,4,7,3,0],[5,4,0,3,7,0,2,6,0],[2,3,7,0,0,0,0,0,4],[7,0,0,0,3,0,8,4,0],[0,0,3,4,8,1,0,0,0],[0,8,4,0,6,0,0,0,3],[3,0,0,0,0,0,0,5,9],[0,7,0,0,9,3,0,0,2],[0,0,6,2,0,0,3,0,0]],
      solution: [[1,6,9,8,2,4,7,3,5],[5,4,8,3,7,9,2,6,1],[2,3,7,1,5,6,9,8,4],[7,5,1,9,3,2,8,4,6],[6,2,3,4,8,1,5,9,7],[9,8,4,5,6,7,1,2,3],[3,1,2,7,4,8,6,5,9],[8,7,5,6,9,3,4,1,2],[4,9,6,2,1,5,3,7,8]],
      techniqueResult: {
        techniqueName: 'XYZ-Wing',
        level: 4,
        explanation: 'XYZ-Wing: Pivot R6C7 (1,5,9), wings R6C1 (1,9) and R5C7 (5,9) eliminate 9',
        highlightCells: [{ row: 5, col: 6 }, { row: 5, col: 0 }, { row: 4, col: 6 }],
        eliminations: [{ position: { row: 5, col: 7 }, candidates: [9] }],
        placements: [],
      },
    },
  ],

  'bug': [
    {
      puzzle: [
        [1, 4, 0, 7, 8, 0, 0, 0, 9],
        [2, 8, 0, 4, 5, 0, 1, 0, 7],
        [3, 7, 0, 6, 1, 0, 0, 0, 8],
        [9, 5, 3, 8, 7, 1, 0, 0, 2],
        [7, 2, 4, 9, 6, 5, 8, 1, 3],
        [8, 6, 1, 3, 2, 4, 9, 7, 5],
        [6, 1, 8, 2, 3, 7, 5, 9, 4],
        [5, 9, 7, 1, 4, 8, 3, 2, 6],
        [4, 3, 2, 5, 9, 6, 7, 8, 1],
      ],
      solution: [
        [1, 4, 5, 7, 8, 3, 2, 6, 9],
        [2, 8, 6, 4, 5, 9, 1, 3, 7],
        [3, 7, 9, 6, 1, 2, 4, 5, 8],
        [9, 5, 3, 8, 7, 1, 6, 4, 2],
        [7, 2, 4, 9, 6, 5, 8, 1, 3],
        [8, 6, 1, 3, 2, 4, 9, 7, 5],
        [6, 1, 8, 2, 3, 7, 5, 9, 4],
        [5, 9, 7, 1, 4, 8, 3, 2, 6],
        [4, 3, 2, 5, 9, 6, 7, 8, 1],
      ],
      techniqueResult: {
        techniqueName: 'BUG',
        level: 4,
        explanation: 'BUG+1: R1C8 must be 6 to avoid a Bivalue Universal Grave',
        highlightCells: [{ row: 0, col: 7 }],
        eliminations: [{ position: { row: 0, col: 7 }, candidates: [3, 5] }],
        placements: [],
      },
    },
  ],

  'unique-rectangle': [
    {
      puzzle: [
        [5, 0, 2, 0, 0, 8, 9, 6, 7],
        [1, 0, 0, 7, 0, 0, 4, 5, 2],
        [0, 6, 7, 5, 0, 0, 3, 8, 1],
        [2, 1, 3, 6, 5, 7, 8, 4, 9],
        [6, 5, 4, 8, 9, 1, 2, 7, 3],
        [7, 0, 0, 0, 0, 4, 6, 1, 5],
        [8, 2, 1, 9, 0, 0, 0, 3, 4],
        [3, 0, 6, 0, 0, 0, 0, 9, 8],
        [0, 0, 5, 0, 8, 3, 0, 2, 6],
      ],
      solution: [
        [5, 4, 2, 3, 1, 8, 9, 6, 7],
        [1, 3, 8, 7, 6, 9, 4, 5, 2],
        [9, 6, 7, 5, 4, 2, 3, 8, 1],
        [2, 1, 3, 6, 5, 7, 8, 4, 9],
        [6, 5, 4, 8, 9, 1, 2, 7, 3],
        [7, 8, 9, 2, 3, 4, 6, 1, 5],
        [8, 2, 1, 9, 7, 6, 5, 3, 4],
        [3, 7, 6, 4, 2, 5, 1, 9, 8],
        [4, 9, 5, 1, 8, 3, 7, 2, 6],
      ],
      techniqueResult: {
        techniqueName: 'Unique Rectangle',
        level: 4,
        explanation: 'Uniqueness Test 1: 8/9 in R2C3,R6C2,R6C3,R2C2 => R2C2<>8, R2C2<>9',
        highlightCells: [
          { row: 1, col: 2 }, { row: 5, col: 1 },
          { row: 5, col: 2 }, { row: 1, col: 1 },
        ],
        eliminations: [{ position: { row: 1, col: 1 }, candidates: [8, 9] }],
        placements: [],
      },
    },
  ],

  'franken-fish': [], // REMOVED: stored solution had zeros; solver could not reproduce

  'mutant-fish': [], // REMOVED: stored solution had zeros; solver could not reproduce

  'multi-colors': [], // REMOVED: stored solution had zeros; solver could not reproduce

  'templates': [],

  'forcing-chain': [], // REMOVED: solution was placeholder (identical to puzzle); solver could not reproduce

  'forcing-net': [],

  'kraken-fish': [],

  'brute-force': [],

  'almost-locked-sets': [], // REMOVED: solution was placeholder (identical to puzzle); solver could not reproduce

  'siamese-fish': [], // REMOVED: stored solution had zeros; solver could not reproduce
};
