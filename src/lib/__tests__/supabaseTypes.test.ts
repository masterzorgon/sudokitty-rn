import { compactToGrid, gridToCompact } from '../supabaseTypes';

describe('compactToGrid / gridToCompact', () => {
  it('round-trips a full board correctly', () => {
    const grid = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    const compact = gridToCompact(grid);
    expect(compact).toBe(
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    );
    expect(compact).toHaveLength(81);

    const roundTripped = compactToGrid(compact);
    expect(roundTripped).toEqual(grid);
  });

  it('round-trips an empty board correctly', () => {
    const grid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));

    const compact = gridToCompact(grid);
    expect(compact).toBe('0'.repeat(81));
    expect(compact).toHaveLength(81);

    const roundTripped = compactToGrid(compact);
    expect(roundTripped).toEqual(grid);
  });

  it('round-trips a partial puzzle correctly', () => {
    const grid = [
      [0, 0, 4, 1, 6, 0, 0, 0, 0],
      [8, 1, 0, 0, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const compact = gridToCompact(grid);
    const roundTripped = compactToGrid(compact);
    expect(roundTripped).toEqual(grid);
  });

  it('compactToGrid produces a 9x9 grid', () => {
    const compact = '5'.repeat(81);
    const grid = compactToGrid(compact);

    expect(grid).toHaveLength(9);
    for (const row of grid) {
      expect(row).toHaveLength(9);
      for (const cell of row) {
        expect(cell).toBe(5);
      }
    }
  });

  it('gridToCompact produces an 81-character string', () => {
    const grid = Array(9)
      .fill(null)
      .map((_, r) =>
        Array(9)
          .fill(null)
          .map((__, c) => ((r * 9 + c) % 9) + 1),
      );

    const compact = gridToCompact(grid);
    expect(compact).toHaveLength(81);
  });
});
