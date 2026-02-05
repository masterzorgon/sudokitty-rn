// Tests for the validation contract
// Verifies that user selections are correctly validated against solver results

import {
  validatePlacement,
  validateElimination,
  validateSelection,
  validateAgainstMultipleInstances,
  isPlacementTechnique,
  isEliminationTechnique,
  PlacementSelection,
  EliminationSelection,
} from '../validation';
import { TechniqueResult } from '../solver/types';

// ============================================
// Test Data
// ============================================

const nakedSingleResult: TechniqueResult = {
  techniqueName: 'Naked Single',
  level: 1,
  placements: [{ position: { row: 2, col: 5 }, value: 7 }],
  eliminations: [],
  explanation: 'R3C6 can only be 7 (no other candidates remain)',
  highlightCells: [{ row: 2, col: 5 }],
};

const nakedPairResult: TechniqueResult = {
  techniqueName: 'Naked Pair',
  level: 2,
  placements: [],
  eliminations: [
    { position: { row: 3, col: 1 }, candidates: [3, 5] },
    { position: { row: 3, col: 7 }, candidates: [5] },
  ],
  explanation: 'R4C3 and R4C6 form a naked pair with candidates 3, 5 in row 4',
  highlightCells: [
    { row: 3, col: 2 },
    { row: 3, col: 5 },
  ],
};

// ============================================
// Technique Categories
// ============================================

describe('Technique categories', () => {
  test('Naked Single is a placement technique', () => {
    expect(isPlacementTechnique('Naked Single')).toBe(true);
    expect(isEliminationTechnique('Naked Single')).toBe(false);
  });

  test('Hidden Single is a placement technique', () => {
    expect(isPlacementTechnique('Hidden Single')).toBe(true);
  });

  test('Naked Pair is an elimination technique', () => {
    expect(isPlacementTechnique('Naked Pair')).toBe(false);
    expect(isEliminationTechnique('Naked Pair')).toBe(true);
  });

  test('X-Wing is an elimination technique', () => {
    expect(isEliminationTechnique('X-Wing')).toBe(true);
  });
});

// ============================================
// Placement Validation
// ============================================

describe('Placement validation', () => {
  test('correct cell and value is valid', () => {
    const selection: PlacementSelection = {
      type: 'placement',
      cell: { row: 2, col: 5 },
      value: 7,
    };
    const result = validatePlacement(selection, nakedSingleResult);
    expect(result.correct).toBe(true);
    expect(result.placementCorrect).toBe(true);
  });

  test('correct cell wrong value is invalid', () => {
    const selection: PlacementSelection = {
      type: 'placement',
      cell: { row: 2, col: 5 },
      value: 3,
    };
    const result = validatePlacement(selection, nakedSingleResult);
    expect(result.correct).toBe(false);
    expect(result.patternCorrect).toBe(true); // cell is correct
    expect(result.feedback).toContain('7');
  });

  test('wrong cell correct value is invalid', () => {
    const selection: PlacementSelection = {
      type: 'placement',
      cell: { row: 0, col: 0 },
      value: 7,
    };
    const result = validatePlacement(selection, nakedSingleResult);
    expect(result.correct).toBe(false);
    expect(result.patternCorrect).toBe(false);
  });

  test('wrong cell wrong value is invalid', () => {
    const selection: PlacementSelection = {
      type: 'placement',
      cell: { row: 0, col: 0 },
      value: 1,
    };
    const result = validatePlacement(selection, nakedSingleResult);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain('Naked Single');
  });
});

// ============================================
// Elimination Validation
// ============================================

describe('Elimination validation', () => {
  test('correct pattern cells + correct eliminations is valid', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 3, col: 2 },
        { row: 3, col: 5 },
      ],
      eliminationCells: [
        { row: 3, col: 1 },
        { row: 3, col: 7 },
      ],
    };
    const result = validateElimination(selection, nakedPairResult, false);
    expect(result.correct).toBe(true);
    expect(result.patternCorrect).toBe(true);
    expect(result.eliminationCorrect).toBe(true);
  });

  test('pattern cells are order-independent', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 3, col: 5 }, // reversed order
        { row: 3, col: 2 },
      ],
      eliminationCells: [
        { row: 3, col: 1 },
      ],
    };
    const result = validateElimination(selection, nakedPairResult, false);
    expect(result.patternCorrect).toBe(true);
  });

  test('lenient mode: one correct elimination is sufficient', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 3, col: 2 },
        { row: 3, col: 5 },
      ],
      eliminationCells: [
        { row: 3, col: 1 }, // Only one of two targets
      ],
    };
    const result = validateElimination(selection, nakedPairResult, false);
    expect(result.correct).toBe(true);
    expect(result.eliminationCorrect).toBe(true);
  });

  test('strict mode: must select ALL elimination targets', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 3, col: 2 },
        { row: 3, col: 5 },
      ],
      eliminationCells: [
        { row: 3, col: 1 }, // Only one of two
      ],
    };
    const result = validateElimination(selection, nakedPairResult, true);
    expect(result.correct).toBe(false); // Missing one target
    expect(result.patternCorrect).toBe(true);
    expect(result.eliminationCorrect).toBe(false);
  });

  test('wrong pattern cells', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ],
      eliminationCells: [
        { row: 3, col: 1 },
      ],
    };
    const result = validateElimination(selection, nakedPairResult, false);
    expect(result.correct).toBe(false);
    expect(result.patternCorrect).toBe(false);
    expect(result.eliminationCorrect).toBe(true); // elimination is still correct
  });

  test('no elimination cells selected', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [
        { row: 3, col: 2 },
        { row: 3, col: 5 },
      ],
      eliminationCells: [],
    };
    const result = validateElimination(selection, nakedPairResult, false);
    expect(result.correct).toBe(false);
    expect(result.patternCorrect).toBe(true);
    expect(result.eliminationCorrect).toBe(false);
  });
});

// ============================================
// Multi-instance Validation
// ============================================

describe('Multi-instance validation', () => {
  const instance1: TechniqueResult = {
    techniqueName: 'Naked Pair',
    level: 2,
    placements: [],
    eliminations: [{ position: { row: 0, col: 0 }, candidates: [1, 2] }],
    explanation: 'Instance 1',
    highlightCells: [{ row: 0, col: 1 }, { row: 0, col: 2 }],
  };

  const instance2: TechniqueResult = {
    techniqueName: 'Naked Pair',
    level: 2,
    placements: [],
    eliminations: [{ position: { row: 5, col: 5 }, candidates: [3, 4] }],
    explanation: 'Instance 2',
    highlightCells: [{ row: 5, col: 6 }, { row: 5, col: 7 }],
  };

  test('accepts first valid instance', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [{ row: 0, col: 1 }, { row: 0, col: 2 }],
      eliminationCells: [{ row: 0, col: 0 }],
    };
    const result = validateAgainstMultipleInstances(selection, [instance1, instance2]);
    expect(result.correct).toBe(true);
  });

  test('accepts second valid instance', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [{ row: 5, col: 6 }, { row: 5, col: 7 }],
      eliminationCells: [{ row: 5, col: 5 }],
    };
    const result = validateAgainstMultipleInstances(selection, [instance1, instance2]);
    expect(result.correct).toBe(true);
  });

  test('rejects invalid selection against all instances', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [{ row: 8, col: 8 }, { row: 8, col: 7 }],
      eliminationCells: [{ row: 8, col: 6 }],
    };
    const result = validateAgainstMultipleInstances(selection, [instance1, instance2]);
    expect(result.correct).toBe(false);
  });

  test('handles empty instances array', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [{ row: 0, col: 0 }],
      eliminationCells: [],
    };
    const result = validateAgainstMultipleInstances(selection, []);
    expect(result.correct).toBe(false);
  });
});

// ============================================
// Unified validateSelection
// ============================================

describe('validateSelection dispatch', () => {
  test('dispatches placement selection correctly', () => {
    const selection: PlacementSelection = {
      type: 'placement',
      cell: { row: 2, col: 5 },
      value: 7,
    };
    const result = validateSelection(selection, nakedSingleResult);
    expect(result.correct).toBe(true);
  });

  test('dispatches elimination selection correctly', () => {
    const selection: EliminationSelection = {
      type: 'elimination',
      patternCells: [{ row: 3, col: 2 }, { row: 3, col: 5 }],
      eliminationCells: [{ row: 3, col: 1 }],
    };
    const result = validateSelection(selection, nakedPairResult);
    expect(result.correct).toBe(true);
  });
});
