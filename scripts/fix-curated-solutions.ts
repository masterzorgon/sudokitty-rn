/**
 * Script to fix broken curated puzzle solutions using the solver.
 * Run: npx ts-node --project scripts/tsconfig.scripts.json scripts/fix-curated-solutions.ts
 */

import { SudokuSolver } from '../src/engine/solver/SudokuSolver';
import { CURATED_PUZZLE_BANK } from '../src/data/techniquePuzzleBank';
import { CuratedPuzzle } from '../src/engine/techniqueGenerator';

function hasValidSolution(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v < 1 || v > 9) return false;
    }
  }
  return true;
}

function needsFix(curated: CuratedPuzzle): boolean {
  return !hasValidSolution(curated.solution);
}

const solver = new SudokuSolver({ maxTechniqueLevel: 4, trackSteps: false });
const fixes: Array<{ techniqueId: string; index: number; solved: boolean }> = [];

for (const [techniqueId, puzzles] of Object.entries(CURATED_PUZZLE_BANK)) {
  if (!puzzles || puzzles.length === 0) continue;
  for (let i = 0; i < puzzles.length; i++) {
    const curated = puzzles[i];
    if (!needsFix(curated)) continue;
    const result = solver.solve(curated.puzzle);
    fixes.push({ techniqueId, index: i, solved: result.solved });
    if (result.solved && result.finalGrid) {
      console.log(JSON.stringify({ techniqueId, index: i, solution: result.finalGrid }));
    } else {
      console.error(`FAILED to solve: ${techniqueId} puzzle ${i}`);
    }
  }
}

console.error(`\nTotal needing fix: ${fixes.length}`);
console.error(`Solved: ${fixes.filter((f) => f.solved).length}`);
