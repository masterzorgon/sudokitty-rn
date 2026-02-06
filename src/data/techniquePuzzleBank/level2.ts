// Level 2 - Intermediate curated puzzles
// Naked Pair, Hidden Pair, Pointing Pair, Box/Line Reduction

import { PartialPuzzleBank } from './types';

export const level2Puzzles: PartialPuzzleBank = {
  'naked-pair': [
    {
      puzzle: [
        [0, 1, 6, 5, 3, 7, 0, 0, 8],
        [3, 0, 9, 0, 0, 0, 6, 5, 7],
        [7, 0, 5, 6, 9, 0, 1, 0, 3],
        [1, 6, 4, 7, 0, 0, 0, 0, 5],
        [5, 3, 2, 0, 0, 6, 7, 0, 0],
        [8, 9, 7, 0, 5, 0, 0, 0, 6],
        [0, 7, 0, 0, 4, 5, 0, 6, 0],
        [6, 0, 3, 1, 7, 2, 5, 0, 9],
        [0, 5, 0, 0, 6, 0, 0, 7, 0],
      ],
      solution: [
        [4, 1, 6, 5, 3, 7, 9, 2, 8],
        [3, 8, 9, 2, 1, 4, 6, 5, 7],
        [7, 2, 5, 6, 9, 8, 1, 4, 3],
        [1, 6, 4, 7, 2, 3, 8, 9, 5],
        [5, 3, 2, 9, 8, 6, 7, 1, 4],
        [8, 9, 7, 4, 5, 1, 2, 3, 6],
        [9, 7, 1, 8, 4, 5, 3, 6, 2],
        [6, 4, 3, 1, 7, 2, 5, 8, 9],
        [2, 5, 8, 3, 6, 9, 4, 7, 1],
      ],
      techniqueResult: {
        techniqueName: 'Naked Pair',
        level: 2,
        explanation: 'R7C3 and R9C3 form a naked pair with candidates 1, 8 in box 7',
        highlightCells: [{ row: 6, col: 2 }, { row: 8, col: 2 }],
        eliminations: [{ position: { row: 7, col: 1 }, candidates: [8] }],
        placements: [],
      },
    },
  ],

  'hidden-pair': [
    {
      puzzle: [
        [0, 6, 9, 0, 0, 0, 0, 0, 0],
        [2, 5, 7, 1, 6, 9, 8, 4, 3],
        [1, 0, 0, 7, 2, 0, 6, 5, 9],
        [0, 0, 5, 9, 0, 1, 0, 6, 0],
        [8, 1, 0, 0, 3, 0, 5, 9, 0],
        [0, 9, 6, 2, 5, 0, 4, 0, 0],
        [5, 0, 1, 0, 9, 0, 0, 7, 0],
        [6, 0, 0, 0, 0, 0, 9, 0, 0],
        [9, 0, 0, 0, 0, 4, 0, 0, 0],
      ],
      solution: [
        [3, 6, 9, 8, 4, 5, 7, 1, 2],
        [2, 5, 7, 1, 6, 9, 8, 4, 3],
        [1, 4, 8, 7, 2, 3, 6, 5, 9],
        [4, 3, 5, 9, 7, 1, 2, 6, 8],
        [8, 1, 2, 4, 3, 6, 5, 9, 7],
        [7, 9, 6, 2, 5, 8, 4, 3, 1],
        [5, 8, 1, 6, 9, 2, 3, 7, 4],
        [6, 2, 4, 3, 1, 7, 9, 8, 5],
        [9, 7, 3, 5, 8, 4, 1, 2, 6],
      ],
      techniqueResult: {
        techniqueName: 'Hidden Pair',
        level: 2,
        explanation: '5, 6 form a hidden pair in R9C4 and R9C9 in row 9',
        highlightCells: [{ row: 8, col: 3 }, { row: 8, col: 8 }],
        eliminations: [
          { position: { row: 8, col: 3 }, candidates: [3, 8] },
          { position: { row: 8, col: 8 }, candidates: [1, 2, 8] },
        ],
        placements: [],
      },
    },
  ],

  'pointing-pair': [
    {
      puzzle: [
        [9, 5, 4, 3, 1, 2, 6, 8, 7],
        [2, 1, 7, 4, 6, 8, 9, 3, 5],
        [0, 0, 0, 5, 9, 7, 2, 4, 1],
        [5, 2, 0, 1, 0, 9, 0, 0, 0],
        [0, 9, 1, 7, 0, 6, 5, 2, 0],
        [7, 0, 6, 2, 5, 3, 0, 1, 9],
        [1, 0, 5, 9, 3, 4, 0, 0, 2],
        [0, 7, 9, 6, 2, 1, 0, 5, 4],
        [0, 0, 2, 8, 7, 5, 1, 9, 0],
      ],
      solution: [
        [9, 5, 4, 3, 1, 2, 6, 8, 7],
        [2, 1, 7, 4, 6, 8, 9, 3, 5],
        [6, 3, 8, 5, 9, 7, 2, 4, 1],
        [5, 2, 3, 1, 4, 9, 7, 6, 8],
        [4, 9, 1, 7, 8, 6, 5, 2, 3],
        [7, 8, 6, 2, 5, 3, 4, 1, 9],
        [1, 6, 5, 9, 3, 4, 8, 7, 2],
        [8, 7, 9, 6, 2, 1, 3, 5, 4],
        [3, 4, 2, 8, 7, 5, 1, 9, 6],
      ],
      techniqueResult: {
        techniqueName: 'Pointing Pair',
        level: 2,
        explanation: '8 in box 9 is confined to column 7, eliminating from rest of column',
        highlightCells: [{ row: 6, col: 6 }, { row: 7, col: 6 }],
        eliminations: [
          { position: { row: 3, col: 6 }, candidates: [8] },
          { position: { row: 5, col: 6 }, candidates: [8] },
        ],
        placements: [],
      },
    },
  ],

  'box-line-reduction': [
    {
      puzzle: [
        [0, 4, 2, 0, 1, 6, 8, 7, 0],
        [6, 0, 7, 5, 4, 0, 0, 2, 0],
        [0, 3, 1, 2, 7, 0, 4, 6, 0],
        [0, 6, 4, 0, 8, 0, 2, 5, 7],
        [2, 0, 0, 0, 6, 0, 0, 0, 0],
        [7, 1, 0, 4, 5, 2, 6, 9, 0],
        [4, 0, 0, 0, 9, 0, 7, 3, 2],
        [0, 2, 0, 0, 3, 0, 0, 0, 0],
        [0, 7, 0, 0, 2, 4, 0, 8, 0],
      ],
      solution: [
        [5, 4, 2, 3, 1, 6, 8, 7, 9],
        [6, 9, 7, 5, 4, 8, 1, 2, 3],
        [8, 3, 1, 2, 7, 9, 4, 6, 5],
        [9, 6, 4, 1, 8, 3, 2, 5, 7],
        [2, 8, 5, 9, 6, 7, 3, 1, 4],
        [7, 1, 3, 4, 5, 2, 6, 9, 8],
        [4, 5, 6, 8, 9, 1, 7, 3, 2],
        [1, 2, 8, 7, 3, 5, 9, 4, 6],
        [3, 7, 9, 6, 2, 4, 5, 8, 1],
      ],
      techniqueResult: {
        techniqueName: 'Box/Line Reduction',
        level: 2,
        explanation: '1 in row 4 is confined to box 5, eliminating from rest of box',
        highlightCells: [{ row: 3, col: 3 }, { row: 3, col: 5 }],
        eliminations: [
          { position: { row: 4, col: 3 }, candidates: [1] },
          { position: { row: 4, col: 5 }, candidates: [1] },
        ],
        placements: [],
      },
    },
  ],
};
