// Step template and Mochi hint tests
// Verifies:
//   - All step templates render without crashing
//   - Correct step count per technique
//   - Fallback rendering for unknown techniques
//   - All solver-backed techniques have Mochi hints

import {
  renderSteps,
  getStepCount,
  TECHNIQUE_STEP_TEMPLATES,
} from '../../data/techniqueSteps';
import { TECHNIQUE_METADATA } from '../../data/techniqueMetadata';
import { MOCHI_TECHNIQUE_HINTS, getMochiHint } from '../solver/types';
import { CURATED_PUZZLE_BANK } from '../../data/techniquePuzzleBank';
import { TechniqueResult, TechniqueLevel } from '../solver/types';
import { TECHNIQUE_IDS } from '../techniqueGenerator';

// ============================================
// Helpers
// ============================================

/** Get a TechniqueResult for a given technique from curated puzzles */
function getTestResult(techniqueId: string): TechniqueResult | null {
  const puzzles = CURATED_PUZZLE_BANK[techniqueId];
  if (!puzzles || puzzles.length === 0) return null;
  return puzzles[0].techniqueResult as TechniqueResult;
}

/** Create a simple Level 1 TechniqueResult for testing */
function createLevel1Result(techniqueName: string): TechniqueResult {
  return {
    techniqueName,
    level: 1 as TechniqueLevel,
    explanation: `${techniqueName} found at R1C1`,
    highlightCells: [{ row: 0, col: 0 }],
    eliminations: [],
    placements: [{ position: { row: 0, col: 0 }, value: 5 }],
  };
}

// ============================================
// Step Template Rendering
// ============================================

describe('Step templates', () => {
  // Level 1 — no curated puzzles, use synthetic results
  describe('Naked Single', () => {
    test('templates render without crashing', () => {
      const result = createLevel1Result('Naked Single');
      const steps = renderSteps(result);

      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.text).toBeTruthy();
        expect(step.text.length).toBeGreaterThan(0);
        expect(step.highlightCells).toBeDefined();
      }
    });
  });

  describe('Hidden Single', () => {
    test('templates render without crashing', () => {
      const result: TechniqueResult = {
        techniqueName: 'Hidden Single',
        level: 1 as TechniqueLevel,
        explanation: '5 can only go in R3C6 in row 3',
        highlightCells: [{ row: 2, col: 5 }],
        eliminations: [],
        placements: [{ position: { row: 2, col: 5 }, value: 5 }],
      };
      const steps = renderSteps(result);

      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.text).toBeTruthy();
        expect(step.highlightCells).toBeDefined();
      }
    });
  });

  // Level 2-4 — use curated puzzle data
  const curatedTechniques = [
    'naked-pair',
    'hidden-pair',
    'pointing-pair',
    'box-line-reduction',
    'naked-triple',
    'x-wing',
    'swordfish',
    'xy-wing',
  ];

  for (const techniqueId of curatedTechniques) {
    const info = TECHNIQUE_IDS[techniqueId];
    if (!info) continue;

    describe(info.name, () => {
      test('templates render without crashing', () => {
        const result = getTestResult(techniqueId);
        if (!result) return;

        const steps = renderSteps(result);

        expect(steps.length).toBeGreaterThan(0);
        for (const step of steps) {
          expect(step.text).toBeTruthy();
          expect(step.text.length).toBeGreaterThan(0);
          expect(step.highlightCells).toBeDefined();
          expect(Array.isArray(step.highlightCells)).toBe(true);
        }
      });

      test('step count matches template count', () => {
        const templates = TECHNIQUE_STEP_TEMPLATES[info.name];
        if (!templates) return;

        expect(getStepCount(info.name)).toBe(templates.length);
      });
    });
  }
});

// ============================================
// Fallback Rendering
// ============================================

describe('Fallback rendering', () => {
  test('renders for unknown technique', () => {
    const fakeResult: TechniqueResult = {
      techniqueName: 'Unknown Technique',
      level: 4 as TechniqueLevel,
      explanation: 'Some explanation',
      highlightCells: [{ row: 0, col: 0 }],
      eliminations: [],
      placements: [],
    };
    const steps = renderSteps(fakeResult);

    expect(steps).toHaveLength(1);
    expect(steps[0].text).toBe('Some explanation');
    expect(steps[0].highlightCells).toEqual([{ row: 0, col: 0 }]);
  });
});

// ============================================
// getStepCount
// ============================================

describe('getStepCount', () => {
  test('returns 3 for Naked Single', () => {
    expect(getStepCount('Naked Single')).toBe(3);
  });

  test('returns 3 for Hidden Single', () => {
    expect(getStepCount('Hidden Single')).toBe(3);
  });

  test('returns correct count for all registered templates', () => {
    for (const [name, templates] of Object.entries(TECHNIQUE_STEP_TEMPLATES)) {
      expect(getStepCount(name)).toBe(templates.length);
    }
  });

  test('returns 1 for unknown technique (fallback)', () => {
    expect(getStepCount('Unknown')).toBe(1);
  });
});

// ============================================
// Mochi Hints
// ============================================

describe('Mochi hints', () => {
  test('all solver-backed techniques have Mochi hints', () => {
    const solverTechniques = TECHNIQUE_METADATA.filter((t) => t.hasSolver);

    for (const technique of solverTechniques) {
      const hints = MOCHI_TECHNIQUE_HINTS[technique.name];
      expect(hints).toBeDefined();
      expect(hints.length).toBeGreaterThan(0);
    }
  });

  test('getMochiHint returns a string for each solver-backed technique', () => {
    const solverTechniques = TECHNIQUE_METADATA.filter((t) => t.hasSolver);

    for (const technique of solverTechniques) {
      const hint = getMochiHint(technique.name);
      expect(typeof hint).toBe('string');
      expect(hint.length).toBeGreaterThan(0);
    }
  });

  test('getMochiHint returns fallback for unknown technique', () => {
    const hint = getMochiHint('Totally Unknown');
    expect(typeof hint).toBe('string');
    expect(hint).toContain('Totally Unknown');
  });
});
