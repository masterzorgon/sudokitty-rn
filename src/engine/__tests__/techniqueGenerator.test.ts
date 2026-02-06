// Spike test: Benchmark technique-specific puzzle generation
// This validates feasibility BEFORE building UI
//
// Expected results:
//   Level 1 (Naked/Hidden Single): Fast, <500ms, high success rate
//   Level 2 (Pairs, Pointing): Moderate, <1s, decent success rate
//   Level 3-4 (X-Wing, Swordfish, XY-Wing): Slow/rare, may need curated bank

import {
  generatePuzzleForTechnique,
  generateWithFallback,
  benchmarkTechnique,
  benchmarkAllTechniques,
  findAllTechniqueInstances,
  TECHNIQUE_IDS,
  TechniqueGenerationResult,
  GenerationConfig,
} from '../techniqueGenerator';
import { CURATED_PUZZLE_BANK } from '../../data/techniquePuzzleBank';
import { TECHNIQUE_METADATA } from '../../data/techniqueMetadata';
import { SudokuSolver } from '../solver/SudokuSolver';
import { CandidateGrid } from '../solver/CandidateGrid';

// ============================================
// Spike: Individual Technique Generation
// ============================================

describe('Technique Generator - Spike', () => {
  // Generous config for spike testing (we want to see what's feasible)
  const spikeConfig: GenerationConfig = {
    maxRetries: 100,
    timeoutMs: 5000, // 5s for spike (production will be 2s)
  };

  describe('Level 1 - Beginner', () => {
    test('should generate Naked Single puzzle', () => {
      const result = generatePuzzleForTechnique('naked-single', spikeConfig);

      console.log(`[Naked Single] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      expect(result.success).toBe(true);
      expect(result.puzzle).toBeDefined();
      expect(result.solution).toBeDefined();
      expect(result.techniqueResult).toBeDefined();
      expect(result.techniqueResult!.techniqueName).toBe('Naked Single');
      expect(result.timeMs).toBeLessThan(5000);
    });

    test('should generate Hidden Single puzzle', () => {
      const result = generatePuzzleForTechnique('hidden-single', spikeConfig);

      console.log(`[Hidden Single] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      expect(result.success).toBe(true);
      expect(result.puzzle).toBeDefined();
      expect(result.techniqueResult).toBeDefined();
      expect(result.techniqueResult!.techniqueName).toBe('Hidden Single');
    });
  });

  describe('Level 2 - Intermediate', () => {
    test('should generate Naked Pair puzzle', () => {
      const result = generatePuzzleForTechnique('naked-pair', spikeConfig);

      console.log(`[Naked Pair] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Naked Pair');
      }
      // May fail - that's OK for spike, we'll note it
    });

    test('should generate Hidden Pair puzzle', () => {
      const result = generatePuzzleForTechnique('hidden-pair', spikeConfig);

      console.log(`[Hidden Pair] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Hidden Pair');
      }
    });

    test('should generate Pointing Pair puzzle', () => {
      const result = generatePuzzleForTechnique('pointing-pair', spikeConfig);

      console.log(`[Pointing Pair] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Pointing Pair');
      }
    });

    test('should generate Box/Line Reduction puzzle', () => {
      const result = generatePuzzleForTechnique('box-line-reduction', spikeConfig);

      console.log(`[Box/Line Reduction] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Box/Line Reduction');
      }
    });
  });

  describe('Level 3 - Advanced', () => {
    test('should attempt Naked Triple puzzle generation', () => {
      const result = generatePuzzleForTechnique('naked-triple', spikeConfig);

      console.log(`[Naked Triple] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}, error=${result.error}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Naked Triple');
      }
      // Record whether this needs curated bank
    });

    test('should attempt X-Wing puzzle generation', () => {
      const result = generatePuzzleForTechnique('x-wing', spikeConfig);

      console.log(`[X-Wing] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}, error=${result.error}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('X-Wing');
      }
      // Record whether this needs curated bank
    });
  });

  describe('Level 4 - Expert', () => {
    test('should attempt Swordfish puzzle generation', () => {
      const result = generatePuzzleForTechnique('swordfish', spikeConfig);

      console.log(`[Swordfish] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}, error=${result.error}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('Swordfish');
      }
      // Very likely to fail - expected to need curated bank
    });

    test('should attempt XY-Wing puzzle generation', () => {
      const result = generatePuzzleForTechnique('xy-wing', spikeConfig);

      console.log(`[XY-Wing] success=${result.success}, time=${result.timeMs}ms, attempts=${result.attemptsTaken}, error=${result.error}`);

      if (result.success) {
        expect(result.techniqueResult!.techniqueName).toBe('XY-Wing');
      }
      // Very likely to fail - expected to need curated bank
    });
  });
});

// ============================================
// Validation: Generated puzzles are correct
// ============================================

describe('Technique Generator - Validation', () => {
  test('generated puzzle should be solvable', () => {
    const result = generatePuzzleForTechnique('naked-single', {
      maxRetries: 50,
      timeoutMs: 3000,
    });

    if (!result.success || !result.puzzle) return;

    const solver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: false });
    const solveResult = solver.solve(result.puzzle);

    expect(solveResult.solved).toBe(true);
  });

  test('generated puzzle should require the target technique at the current state', () => {
    const result = generatePuzzleForTechnique('naked-single', {
      maxRetries: 50,
      timeoutMs: 3000,
    });

    if (!result.success || !result.puzzle || !result.techniqueResult) return;

    // Verify the technique result matches
    expect(result.techniqueResult.techniqueName).toBe('Naked Single');
    expect(result.techniqueResult.placements.length).toBeGreaterThan(0);

    // Verify the technique actually applies to the returned puzzle
    const grid = new CandidateGrid(result.puzzle);
    const nakedSingle = new (require('../solver/techniques/level1/NakedSingle').NakedSingle)();
    const applied = nakedSingle.apply(grid);

    expect(applied).not.toBeNull();
    expect(applied!.techniqueName).toBe('Naked Single');
  });

  test('generated Hidden Single puzzle should have technique applicable', () => {
    const result = generatePuzzleForTechnique('hidden-single', {
      maxRetries: 50,
      timeoutMs: 3000,
    });

    if (!result.success || !result.puzzle || !result.techniqueResult) return;

    expect(result.techniqueResult.techniqueName).toBe('Hidden Single');

    // Verify on the actual grid
    const grid = new CandidateGrid(result.puzzle);
    const hiddenSingle = new (require('../solver/techniques/level1/HiddenSingle').HiddenSingle)();
    const applied = hiddenSingle.apply(grid);

    expect(applied).not.toBeNull();
    expect(applied!.techniqueName).toBe('Hidden Single');
  });
});

// ============================================
// Benchmark: Full technique set timing
// ============================================

describe('Technique Generator - Benchmark', () => {
  test('benchmark all techniques (3 trials each)', () => {
    const results = benchmarkAllTechniques(3, {
      maxRetries: 50,
      timeoutMs: 3000,
    });

    console.log('\n=== TECHNIQUE GENERATION BENCHMARK ===\n');
    console.log(
      'Technique'.padEnd(20) +
      'Level'.padEnd(8) +
      'Success'.padEnd(10) +
      'Avg Time'.padEnd(12) +
      'Avg Retries'.padEnd(14) +
      'Result'
    );
    console.log('-'.repeat(78));

    for (const r of results) {
      const status = r.successRate >= 0.67
        ? 'GENERATE'
        : r.successRate > 0
          ? 'UNRELIABLE'
          : 'CURATE';

      console.log(
        r.techniqueName.padEnd(20) +
        `L${r.level}`.padEnd(8) +
        `${Math.round(r.successRate * 100)}%`.padEnd(10) +
        `${Math.round(r.avgTimeMs)}ms`.padEnd(12) +
        `${Math.round(r.avgRetries)}`.padEnd(14) +
        status
      );
    }

    console.log('\n=== RECOMMENDATIONS ===');
    const needCurated = results.filter((r) => r.successRate < 0.67);
    const canGenerate = results.filter((r) => r.successRate >= 0.67);

    console.log(`Generate on-device: ${canGenerate.map((r) => r.techniqueName).join(', ') || 'none'}`);
    console.log(`Need curated bank: ${needCurated.map((r) => r.techniqueName).join(', ') || 'none'}`);
    console.log('');

    // At minimum, Level 1 should be generatable
    const level1Results = results.filter((r) => r.level === 1);
    for (const r of level1Results) {
      expect(r.successRate).toBeGreaterThan(0);
    }
  });
});

// ============================================
// Generation Reliability — Hard Assertions
// Each solver-backed technique MUST be obtainable via generateWithFallback
// ============================================

describe('Generation reliability', () => {
  const solverTechniques = TECHNIQUE_METADATA.filter((t) => t.hasSolver);

  for (const technique of solverTechniques) {
    const info = TECHNIQUE_IDS[technique.id];
    if (!info) continue;

    test(`${technique.name} can be obtained via generateWithFallback`, () => {
      const result = generateWithFallback(technique.id, CURATED_PUZZLE_BANK, {
        maxRetries: 50,
        timeoutMs: 3000,
      });

      expect(result.success).toBe(true);
      expect(result.puzzle).toBeDefined();
      expect(result.solution).toBeDefined();
      expect(result.techniqueResult).toBeDefined();
      expect(result.techniqueResult!.techniqueName).toBe(info.name);
    });
  }
});
