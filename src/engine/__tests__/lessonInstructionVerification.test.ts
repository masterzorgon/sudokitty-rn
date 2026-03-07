/**
 * Lesson Instruction Verification (Phase 3)
 *
 * Verifies that technique descriptions (metadata) and instruction steps (step templates)
 * are complete, consistent, and correct:
 * - Metadata: non-empty descriptions, no placeholders, reasonable length
 * - Step templates: render without throwing, valid highlight cells (0-8)
 */

import { TECHNIQUE_METADATA } from '../../data/techniqueMetadata';
import {
  renderSteps,
  TECHNIQUE_STEP_TEMPLATES,
} from '../../data/techniqueSteps';
import { CURATED_PUZZLE_BANK } from '../../data/techniquePuzzleBank';
import { TECHNIQUE_IDS, CuratedPuzzle } from '../techniqueGenerator';
import { TechniqueResult } from '../solver/types';

// ============================================
// Constants
// ============================================

const PLACEHOLDER_PATTERNS = [
  'TODO',
  'TBD',
  'Coming soon',
  'Placeholder',
  'Lorem',
  'ipsum',
  'XXX',
];

const SHORT_DESC_MAX_LEN = 100;
const LONG_DESC_MIN_LEN = 50;
const LONG_DESC_MAX_LEN = 600;

/** Techniques with hasSolver that use fallback (no custom templates or generic only) */
const FALLBACK_OK_TECHNIQUES: string[] = [];

// ============================================
// Helpers
// ============================================

function isPlaceholder(text: string): boolean {
  const lower = text.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row <= 8 && col >= 0 && col <= 8;
}

// ============================================
// Metadata Completeness (Phase 3)
// ============================================

describe('Metadata completeness (Phase 3)', () => {
  test('all techniques have non-empty longDescription and shortDescription', () => {
    for (const meta of TECHNIQUE_METADATA) {
      expect(meta.shortDescription?.trim()).toBeTruthy();
      expect(meta.longDescription?.trim()).toBeTruthy();
    }
  });

  test('no placeholder text in descriptions', () => {
    for (const meta of TECHNIQUE_METADATA) {
      expect(isPlaceholder(meta.shortDescription)).toBe(false);
      expect(isPlaceholder(meta.longDescription)).toBe(false);
    }
  });

  test('shortDescription length within bounds', () => {
    for (const meta of TECHNIQUE_METADATA) {
      expect(meta.shortDescription.length).toBeLessThanOrEqual(SHORT_DESC_MAX_LEN);
    }
  });

  test('longDescription length within bounds', () => {
    for (const meta of TECHNIQUE_METADATA) {
      expect(meta.longDescription.length).toBeGreaterThanOrEqual(LONG_DESC_MIN_LEN);
      expect(meta.longDescription.length).toBeLessThanOrEqual(LONG_DESC_MAX_LEN);
    }
  });

  test('every TECHNIQUE_STEP_TEMPLATES entry has matching TECHNIQUE_METADATA', () => {
    for (const name of Object.keys(TECHNIQUE_STEP_TEMPLATES)) {
      const meta = TECHNIQUE_METADATA.find((m) => m.name === name);
      expect(meta).toBeDefined();
    }
  });

  test('solver-backed techniques have step templates or documented fallback', () => {
    const solverTechniques = TECHNIQUE_METADATA.filter((t) => t.hasSolver);
    for (const meta of solverTechniques) {
      const templates = TECHNIQUE_STEP_TEMPLATES[meta.name];
      const hasCustomTemplates = templates && templates.length > 0;
      const isFallbackOk = FALLBACK_OK_TECHNIQUES.includes(meta.id);
      expect(hasCustomTemplates || isFallbackOk).toBe(true);
    }
  });
});

// ============================================
// Step Template Robustness (Phase 3)
// ============================================

describe('Step template robustness (Phase 3)', () => {
  const techniqueIds = Object.keys(CURATED_PUZZLE_BANK);

  for (const techniqueId of techniqueIds) {
    const puzzles = CURATED_PUZZLE_BANK[techniqueId];
    const info = TECHNIQUE_IDS[techniqueId];

    if (!info || !puzzles || puzzles.length === 0) continue;

    describe(`${info.name} (${techniqueId})`, () => {
      puzzles.forEach((curated: CuratedPuzzle, index: number) => {
        describe(`puzzle ${index}`, () => {
          test('renderSteps does not throw', () => {
            const result = curated.techniqueResult as TechniqueResult;
            expect(() => renderSteps(result)).not.toThrow();
          });

          test('all steps have non-empty text', () => {
            const result = curated.techniqueResult as TechniqueResult;
            const steps = renderSteps(result);
            expect(steps.length).toBeGreaterThan(0);
            for (const step of steps) {
              expect(step.text).toBeTruthy();
              expect(step.text.trim().length).toBeGreaterThan(0);
            }
          });

          test('all highlightCells are valid positions (0-8)', () => {
            const result = curated.techniqueResult as TechniqueResult;
            const steps = renderSteps(result);
            for (const step of steps) {
              expect(step.highlightCells).toBeDefined();
              expect(Array.isArray(step.highlightCells)).toBe(true);
              for (const pos of step.highlightCells) {
                expect(isValidPosition(pos.row, pos.col)).toBe(true);
              }
            }
          });
        });
      });
    });
  }
});
