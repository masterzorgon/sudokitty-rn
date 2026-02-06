// Level 3 - Advanced curated puzzles
// Naked Triple, Hidden Triple, X-Wing, Jellyfish, Finned Fish

import { PartialPuzzleBank } from './types';

export const level3Puzzles: PartialPuzzleBank = {
  'naked-triple': [
    {
      puzzle: [
        [6, 3, 9, 5, 1, 0, 0, 2, 0],
        [7, 4, 1, 0, 0, 0, 9, 5, 0],
        [8, 2, 5, 0, 0, 0, 0, 0, 1],
        [0, 0, 6, 0, 0, 8, 4, 3, 0],
        [4, 0, 7, 0, 6, 0, 0, 9, 5],
        [0, 0, 3, 4, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 5, 7, 9],
        [9, 0, 0, 2, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 9, 0, 0, 1, 0],
      ],
      solution: [
        [6, 3, 9, 5, 1, 4, 7, 2, 8],
        [7, 4, 1, 6, 8, 2, 9, 5, 3],
        [8, 2, 5, 7, 3, 9, 6, 4, 1],
        [1, 5, 6, 9, 2, 8, 4, 3, 7],
        [4, 8, 7, 1, 6, 3, 2, 9, 5],
        [2, 9, 3, 4, 7, 5, 1, 8, 6],
        [3, 1, 2, 8, 4, 6, 5, 7, 9],
        [9, 7, 8, 2, 5, 1, 3, 6, 4],
        [5, 6, 4, 3, 9, 7, 8, 1, 2],
      ],
      techniqueResult: {
        techniqueName: 'Naked Triple',
        level: 3,
        explanation: 'R4C5, R6C5, R8C5 form a naked triple with candidates 2, 5, 7 in column 5',
        highlightCells: [{ row: 3, col: 4 }, { row: 5, col: 4 }, { row: 7, col: 4 }],
        eliminations: [
          { position: { row: 1, col: 4 }, candidates: [2] },
          { position: { row: 2, col: 4 }, candidates: [7] },
        ],
        placements: [],
      },
    },
    {
      puzzle: [
        [1, 0, 2, 0, 0, 0, 5, 0, 8],
        [3, 0, 0, 1, 5, 6, 4, 9, 2],
        [0, 0, 4, 0, 2, 0, 0, 0, 0],
        [6, 0, 1, 0, 3, 4, 0, 0, 5],
        [2, 0, 0, 6, 0, 0, 3, 0, 0],
        [0, 4, 3, 0, 7, 2, 0, 1, 6],
        [4, 1, 0, 2, 0, 7, 0, 0, 3],
        [8, 3, 6, 0, 0, 0, 0, 0, 9],
        [7, 2, 0, 3, 6, 0, 0, 0, 0],
      ],
      solution: [
        [1, 9, 2, 7, 4, 3, 5, 6, 8],
        [3, 8, 7, 1, 5, 6, 4, 9, 2],
        [5, 6, 4, 9, 2, 8, 7, 3, 1],
        [6, 7, 1, 8, 3, 4, 9, 2, 5],
        [2, 5, 8, 6, 9, 1, 3, 4, 7],
        [9, 4, 3, 5, 7, 2, 8, 1, 6],
        [4, 1, 9, 2, 8, 7, 6, 5, 3],
        [8, 3, 6, 4, 1, 5, 2, 7, 9],
        [7, 2, 5, 3, 6, 9, 1, 8, 4],
      ],
      techniqueResult: {
        techniqueName: 'Naked Triple',
        level: 3,
        explanation: 'R5C3, R5C8, R5C9 form a naked triple with candidates 4, 7, 8 in row 5',
        highlightCells: [{ row: 4, col: 2 }, { row: 4, col: 7 }, { row: 4, col: 8 }],
        eliminations: [
          { position: { row: 4, col: 1 }, candidates: [7, 8] },
          { position: { row: 4, col: 4 }, candidates: [8] },
        ],
        placements: [],
      },
    },
  ],

  'hidden-triple': [
    {
      puzzle: [
        [1, 9, 5, 8, 6, 7, 0, 2, 0],
        [0, 0, 3, 4, 5, 1, 9, 0, 8],
        [8, 4, 0, 2, 3, 9, 5, 0, 1],
        [5, 1, 0, 7, 4, 0, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 8, 0, 1, 2, 0, 0, 0],
        [3, 5, 1, 6, 0, 0, 7, 9, 0],
        [9, 8, 2, 1, 7, 0, 6, 0, 0],
        [6, 7, 4, 0, 0, 0, 8, 1, 0],
      ],
      solution: [
        [1, 9, 5, 8, 6, 7, 4, 2, 3],
        [7, 2, 3, 4, 5, 1, 9, 6, 8],
        [8, 4, 6, 2, 3, 9, 5, 7, 1],
        [5, 1, 9, 7, 4, 3, 2, 8, 6],
        [2, 3, 7, 5, 8, 6, 1, 4, 9],
        [4, 6, 8, 9, 1, 2, 3, 5, 7],
        [3, 5, 1, 6, 2, 8, 7, 9, 4],
        [9, 8, 2, 1, 7, 4, 6, 3, 5],
        [6, 7, 4, 3, 9, 5, 8, 1, 2],
      ],
      techniqueResult: {
        techniqueName: 'Hidden Triple',
        level: 3,
        explanation: '6, 7, 9 form a hidden triple in R4C9, R5C9, R6C9 in box 6',
        highlightCells: [{ row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }],
        eliminations: [
          { position: { row: 3, col: 8 }, candidates: [3] },
          { position: { row: 4, col: 8 }, candidates: [3, 4, 5] },
          { position: { row: 5, col: 8 }, candidates: [3, 4, 5] },
        ],
        placements: [],
      },
    },
  ],

  'x-wing': [
    {
      puzzle: [
        [2, 7, 0, 0, 0, 6, 3, 9, 8],
        [3, 0, 0, 8, 0, 2, 4, 0, 0],
        [4, 8, 6, 0, 0, 3, 0, 0, 2],
        [8, 0, 0, 2, 0, 7, 0, 0, 0],
        [9, 0, 2, 0, 1, 0, 0, 0, 0],
        [1, 0, 7, 0, 6, 0, 0, 2, 4],
        [5, 2, 0, 6, 0, 4, 1, 8, 0],
        [7, 0, 8, 0, 2, 1, 6, 4, 0],
        [6, 1, 4, 0, 8, 9, 2, 3, 0],
      ],
      solution: [
        [2, 7, 5, 1, 4, 6, 3, 9, 8],
        [3, 9, 1, 8, 7, 2, 4, 5, 6],
        [4, 8, 6, 9, 5, 3, 7, 1, 2],
        [8, 4, 3, 2, 9, 7, 5, 6, 1],
        [9, 6, 2, 4, 1, 5, 8, 7, 3],
        [1, 5, 7, 3, 6, 8, 9, 2, 4],
        [5, 2, 9, 6, 3, 4, 1, 8, 7],
        [7, 3, 8, 5, 2, 1, 6, 4, 9],
        [6, 1, 4, 7, 8, 9, 2, 3, 5],
      ],
      techniqueResult: {
        techniqueName: 'X-Wing',
        level: 3,
        explanation: 'X-Wing: 3 in rows 6 and 8 aligns in columns 2 and 4',
        highlightCells: [
          { row: 5, col: 1 }, { row: 5, col: 3 },
          { row: 7, col: 1 }, { row: 7, col: 3 },
        ],
        eliminations: [{ position: { row: 4, col: 3 }, candidates: [3] }],
        placements: [],
      },
    },
  ],

  'jellyfish': [
    {
      puzzle: [
        [2, 0, 4, 1, 0, 3, 5, 8, 0],
        [0, 0, 0, 0, 2, 0, 3, 4, 1],
        [1, 0, 3, 4, 8, 5, 6, 0, 0],
        [7, 3, 2, 9, 5, 4, 1, 6, 8],
        [0, 0, 5, 0, 1, 0, 9, 0, 0],
        [6, 1, 9, 8, 3, 2, 4, 0, 0],
        [0, 0, 1, 5, 0, 8, 2, 0, 0],
        [3, 0, 0, 2, 4, 0, 0, 0, 0],
        [0, 2, 6, 3, 0, 0, 0, 0, 4],
      ],
      solution: [
        [2, 9, 4, 1, 6, 3, 5, 8, 7],
        [5, 6, 8, 7, 2, 9, 3, 4, 1],
        [1, 7, 3, 4, 8, 5, 6, 9, 2],
        [7, 3, 2, 9, 5, 4, 1, 6, 8],
        [4, 8, 5, 6, 1, 7, 9, 2, 3],
        [6, 1, 9, 8, 3, 2, 4, 7, 5],
        [9, 4, 1, 5, 7, 8, 2, 3, 6],
        [3, 5, 7, 2, 4, 6, 8, 1, 9],
        [8, 2, 6, 3, 9, 1, 7, 5, 4],
      ],
      techniqueResult: {
        techniqueName: 'Jellyfish',
        level: 4,
        explanation: 'Jellyfish: 7 in rows 1, 3, 6, 7 aligns in columns 2, 5, 8, 9',
        highlightCells: [
          { row: 0, col: 1 }, { row: 0, col: 4 }, { row: 0, col: 8 },
          { row: 2, col: 1 }, { row: 2, col: 7 }, { row: 2, col: 8 },
          { row: 5, col: 7 }, { row: 5, col: 8 },
          { row: 6, col: 1 }, { row: 6, col: 4 },
        ],
        eliminations: [
          { position: { row: 1, col: 1 }, candidates: [7] },
          { position: { row: 8, col: 4 }, candidates: [7] },
        ],
        placements: [],
      },
    },
  ],

  'finned-fish': [
    {
      puzzle: [
        [0, 5, 2, 6, 7, 0, 3, 0, 8],
        [0, 3, 0, 0, 0, 5, 6, 2, 7],
        [6, 7, 0, 0, 3, 2, 5, 0, 1],
        [2, 8, 0, 0, 0, 6, 1, 0, 5],
        [0, 6, 0, 0, 0, 0, 2, 0, 4],
        [7, 1, 4, 5, 2, 3, 8, 6, 9],
        [8, 2, 7, 3, 1, 4, 9, 5, 6],
        [0, 9, 0, 2, 6, 7, 4, 8, 3],
        [3, 4, 6, 9, 5, 8, 7, 1, 2],
      ],
      solution: [
        [9, 5, 2, 6, 7, 1, 3, 4, 8],
        [4, 3, 1, 8, 9, 5, 6, 2, 7],
        [6, 7, 8, 4, 3, 2, 5, 9, 1],
        [2, 8, 9, 7, 4, 6, 1, 3, 5],
        [5, 6, 3, 1, 8, 9, 2, 7, 4],
        [7, 1, 4, 5, 2, 3, 8, 6, 9],
        [8, 2, 7, 3, 1, 4, 9, 5, 6],
        [1, 9, 5, 2, 6, 7, 4, 8, 3],
        [3, 4, 6, 9, 5, 8, 7, 1, 2],
      ],
      techniqueResult: {
        techniqueName: 'Finned Fish',
        level: 3,
        explanation: 'Finned X-Wing: 9 in rows 4,2 columns 3,5 fin at R2C1',
        highlightCells: [
          { row: 3, col: 2 }, { row: 3, col: 4 },
          { row: 1, col: 2 }, { row: 1, col: 4 },
          { row: 1, col: 0 },
        ],
        eliminations: [{ position: { row: 2, col: 2 }, candidates: [9] }],
        placements: [],
      },
    },
  ],
};
