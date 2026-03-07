# Phase 2 Plan: Technique Result Verification

## Goal

Verify that every curated lesson's stored `techniqueResult` is **correct** — that the target technique actually applies at the puzzle state, and that the stored highlight cells, eliminations, and placements match (or are logically equivalent to) what the solver would produce when run on that board.

## Why This Phase Comes After Phase 1

Phase 1 established that all remaining curated puzzles have valid structure (9x9 grids, complete solutions, consistent givens). Phase 2 now checks that the **teaching content** — which cells to highlight, which candidates to eliminate, which values to place — is correct. A lesson with valid boards can still teach the wrong pattern if the stored `techniqueResult` is inaccurate.

## Current State

[`curatedPuzzles.test.ts`](src/engine/__tests__/curatedPuzzles.test.ts) already performs partial verification:

- **technique applies at snapshot state**: Tries raw grid first, then `prepareGridForTechnique`; if neither finds the technique, falls back to "puzzle is solvable" (lenient).
- **technique result has valid highlight cells**: Only checks bounds (0–8).
- **technique result has eliminations/placements**: Compares counts only (`eliminations >= 1` when stored has any, `placements === stored.placements.length`).

What is **not** verified today:

- Stored highlight cells match (or overlap with) solver highlight cells.
- Stored eliminations match solver eliminations (position + candidates).
- Stored placements match solver placements (position + value).
- Whether the stored result is the **same logical move** the solver would make (vs. a different valid instance).

## Primary Files

- `src/engine/__tests__/curatedPuzzles.test.ts` — extend or refactor
- `src/engine/__tests__/lessonDataIntegrity.test.ts` — Phase 1; Phase 2 tests can live here or in a new file
- `src/engine/solver/CandidateGrid.ts` — used to build grid state
- `src/engine/solver/techniques/index.ts` — `ALL_TECHNIQUES`, `prepareGridForTechnique` pattern
- `src/engine/techniqueGenerator.ts` — `CuratedPuzzle`, `TECHNIQUE_IDS`
- `src/engine/validation.ts` — `validateSelection`, `positionKey`; may inform comparison helpers

## Detailed Work Breakdown

### 1. Define comparison semantics per technique category

Not all techniques can use strict equality. Define rules:

| Category | Highlight cells | Eliminations | Placements |
|----------|-----------------|--------------|------------|
| **Placement** (Naked/Hidden Single) | Exact match | N/A | Exact match (position + value) |
| **Subsets** (Pairs, Triples) | Set equality (order-independent) | Stored ⊆ solver OR exact | N/A |
| **Fish** (X-Wing, Swordfish, Finned, etc.) | Overlap or set equality (solver may find different pattern) | Stored eliminations ⊆ solver OR overlap | N/A |
| **Wings** (XY, XYZ, WXYZ) | Set equality | Stored ⊆ solver | N/A |
| **Uniqueness** (UR, AR, BUG) | Set equality | Stored ⊆ solver | N/A |
| **Chains/Coloring** (AIC, Simple Colors, etc.) | Overlap acceptable | Stored ⊆ solver | N/A |

Document these in a small config or comment block so future techniques can be categorized.

### 2. Implement reusable comparison helpers

Add helpers (in test file or shared test utils):

- `eliminationSetsMatch(stored, solver, mode: 'exact' | 'subset' | 'overlap')` — compare `{ position, candidates }` sets.
- `placementSetsMatch(stored, solver)` — compare `{ position, value }` (exact).
- `highlightCellsMatch(stored, solver, mode: 'exact' | 'subset' | 'overlap')` — compare position sets.
- `positionKey(pos)` — consistent key for set operations (reuse from `validation.ts` or `types`).

Normalize both stored and solver results to the same shape (e.g. `{ row, col }`) before comparison.

### 3. Implement solver result retrieval

Reuse the existing pattern from `curatedPuzzles.test.ts`:

1. Build `CandidateGrid` from `curated.puzzle`.
2. Try target technique on raw grid.
3. If `null`, call `prepareGridForTechnique(puzzle, info.level)` and retry.
4. If still `null`, the technique does not apply — test should fail (or skip with clear reason).

Return the first non-null `TechniqueResult` from the target technique. Do **not** use `getNextStep` (which picks by solver order); we need the specific technique.

### 4. Add strict verification tests

For each curated puzzle with content:

- **technique applies**: Assert solver returns non-null for target technique (raw or prepared). Remove the fallback to "puzzle is solvable" for this test; if technique doesn't apply, fail.
- **stored result matches solver**: Compare stored vs solver result using the semantics from step 1. Use the appropriate mode per technique category.
- **stored eliminations are valid**: Each stored elimination's position must have the candidate in the grid (before applying the technique). Optional but strengthens correctness.
- **stored placements are valid**: Each stored placement's cell must be empty and have that value as a candidate. Optional.

### 5. Handle techniques where solver finds different instance

Some techniques (Fish, Skyscraper, etc.) can have multiple valid instances. Options:

- **Lenient mode**: Require only that stored eliminations are a **subset** of solver eliminations (or that at least one stored elimination is in solver result). Stored highlights may overlap.
- **Strict mode**: Require exact match for techniques where the solver deterministically finds one instance (e.g. Naked Single, Hidden Single).
- **Per-technique config**: Maintain a map of technique ID → comparison mode.

### 6. Document and handle "technique does not apply" cases

If the solver cannot find the technique (raw or prepared), possible causes:

- Stored snapshot assumed candidate state that cannot be reproduced from grid values alone.
- Stored result is wrong (wrong technique or wrong cells).
- Solver has a bug or limitation.

For Phase 2, if technique does not apply: **fail the test** with a clear message (technique ID, puzzle index, "solver could not find technique"). Do not fall back to "puzzle is solvable." This surfaces puzzles that need manual review or removal.

### 7. Add technique-category configuration

Create a small module or inline config:

```ts
const TECHNIQUE_COMPARISON_MODE: Record<string, 'strict' | 'lenient'> = {
  'Naked Single': 'strict',
  'Hidden Single': 'strict',
  'Naked Pair': 'lenient',
  // ... etc
};
```

Default to `lenient` for unknown techniques. Use this to choose comparison semantics.

### 8. Integrate with existing curatedPuzzles tests

Either:

- **Option A**: Add new describe block `Technique result matches solver` inside the existing loop, with the new comparison tests.
- **Option B**: Create `lessonTechniqueVerification.test.ts` and keep `curatedPuzzles.test.ts` for solvability/solution matching only.

Prefer Option B if the file grows large; otherwise Option A keeps related checks together.

## Suggested Test Layout

```
describe('Technique result verification (Phase 2)')
  for each techniqueId with curated puzzles
    for each puzzle
      test('target technique applies at puzzle state')
      test('stored highlight cells match or overlap solver result')
      test('stored eliminations match or are subset of solver result')
      test('stored placements match solver result')  // for placement techniques
```

## Deliverables

- Comparison helpers for technique results (position sets, elimination sets, placement sets).
- Technique-category configuration for strict vs lenient matching.
- New or extended tests that assert stored `techniqueResult` matches solver output.
- Clear failure messages when technique does not apply or when stored result diverges.

## Acceptance Criteria

Phase 2 is complete when:

- Every curated puzzle with content has a test that the target technique applies (raw or prepared grid).
- Every curated puzzle has a test that stored result matches solver result (per category semantics).
- Tests fail with actionable messages when stored result is wrong or technique does not apply.
- No silent fallbacks (e.g. "puzzle is solvable") that hide technique mismatches.

## Risks and Notes

- **Candidate state loss**: Serialized puzzles only store cell values, not candidate history. Some curated snapshots may assume prior eliminations that we cannot reproduce. Those puzzles will fail "technique applies" and may need to be removed or recreated.
- **Solver order**: The solver tries techniques in a fixed order. `prepareGridForTechnique` exhausts simpler techniques first. This may not reproduce the exact path the original author used. If the target technique still applies after preparation, we accept it.
- **Multiple instances**: For Fish and similar techniques, the solver may find a different valid instance. Lenient mode (stored ⊆ solver, or overlap) avoids false failures.
- **Empty banks**: Phase 1 removed many puzzles. Phase 2 only runs on techniques that still have curated content: naked-pair, hidden-pair, pointing-pair, box-line-reduction, naked-triple, hidden-triple, x-wing, finned-fish, skyscraper, two-string-kite, swordfish, xy-wing, xyz-wing, bug, unique-rectangle.

## To-Dos

- [ ] Define comparison semantics (strict vs lenient) per technique category
- [ ] Implement comparison helpers for highlight cells, eliminations, and placements
- [ ] Implement solver result retrieval (raw + prepareGridForTechnique)
- [ ] Add technique verification tests for all curated puzzles with content
- [ ] Handle and document technique-does-not-apply cases with clear failure messages
