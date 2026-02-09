import { generatePuzzleForTechnique, GenerationConfig } from '../techniqueGenerator';

const config: GenerationConfig = { maxRetries: 1000, timeoutMs: 120000 };

const techniques = [
  'avoidable-rectangle',
  'alternating-inference-chains',
  'templates',
  'forcing-net',
  'kraken-fish',
];

describe('Capture remaining puzzles (2min timeout each)', () => {
  for (const id of techniques) {
    test(`capture ${id}`, () => {
      const result = generatePuzzleForTechnique(id, config);
      if (result.success && result.puzzle && result.techniqueResult) {
        console.log(`\n=== ${id} === SUCCESS (${result.timeMs}ms)`);
        console.log(`PUZZLE:${JSON.stringify(result.puzzle)}`);
        console.log(`TECHNIQUE_RESULT:${JSON.stringify(result.techniqueResult)}`);
      } else {
        console.log(`\n=== ${id} === FAILED (${result.timeMs}ms): ${result.error}`);
      }
      expect(true).toBe(true);
    }, 130000);
  }
});
