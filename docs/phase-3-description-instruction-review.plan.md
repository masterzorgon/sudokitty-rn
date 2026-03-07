# Phase 3 Plan: Description and Instruction Review

## Goal

Verify that technique **descriptions** (metadata) and **instruction steps** (step templates) are complete, consistent, and correct. Phase 1 validated board data; Phase 2 validated technique results. Phase 3 focuses on the **teaching content** users see: overview text and step-by-step instructions.

## Why This Phase Comes After Phase 2

Phase 2 ensures stored `techniqueResult` matches solver output. Step templates consume that result to produce instruction text and highlight cells. If the result is wrong, step text will be wrong. With Phase 2 complete, we can trust that step templates receive valid, solver-verified data. Phase 3 then checks that the templates and metadata use that data correctly and present accurate, coherent content.

## Current State

### Metadata (`techniqueMetadata.ts`)

- **longDescription**: Shown on overview, locked, and coming-soon screens. Human-readable explanation of the technique.
- **shortDescription**: One-line summary (e.g. for cards or tooltips).
- **TECHNIQUE_METADATA**: Array of all techniques with display data.

### Step Templates (`techniqueSteps/`)

- **StepTemplate**: `getText(result)`, `getHighlightCells(result)`, optional `getMascotHint(result)`.
- **Helpers**: `extractUnit`, `extractCandidates`, `extractNumber` parse solver `explanation` strings.
- **renderSteps(result)**: Maps templates to `RenderedStep[]`; falls back to raw `explanation` if no template or on error.

### Existing Tests (`stepTemplates.test.ts`)

- Templates render without crashing for Level 1 (synthetic) and a subset of curated techniques.
- Step count matches template count.
- Fallback rendering for unknown techniques.
- Mochi hints exist for solver-backed techniques.

### Gaps

- No automated check that **all** techniques with curated content have step templates that render successfully with their curated results.
- No validation of metadata completeness (non-empty descriptions, no placeholders).
- No check that step template `getHighlightCells` returns positions within bounds (0–8).
- No verification that solver `explanation` format matches what helpers expect (extractUnit, extractCandidates, extractNumber).
- No manual review checklist for content quality.

## Primary Files

- `src/data/techniqueMetadata.ts` — longDescription, shortDescription
- `src/data/techniqueSteps/` — step templates (level1–4), helpers, types
- `src/engine/__tests__/stepTemplates.test.ts` — extend with Phase 3 checks
- `src/engine/__tests__/lessonTechniqueVerification.test.ts` — Phase 2; techniques with curated content
- `src/engine/solver/techniques/` — produces `explanation` strings consumed by helpers

## Detailed Work Breakdown

### 1. Metadata completeness and sanity checks

Add automated tests:

| Check | Description |
|-------|-------------|
| **Non-empty descriptions** | Every technique in TECHNIQUE_METADATA has non-empty `longDescription` and `shortDescription`. |
| **No placeholder text** | Descriptions do not contain "TODO", "TBD", "Coming soon", "Placeholder", "Lorem", etc. |
| **Reasonable length** | `shortDescription` ≤ 100 chars; `longDescription` between 50–500 chars (configurable). |
| **Metadata ↔ step templates** | Every technique in TECHNIQUE_STEP_TEMPLATES has matching TECHNIQUE_METADATA (by name). |
| **Solver ↔ metadata** | Every technique with `hasSolver: true` has step templates (or documented exception). |

Document any exceptions (e.g. techniques with solver but generic fallback steps).

### 2. Step template robustness for all curated techniques

Extend `stepTemplates.test.ts` (or add `lessonInstructionVerification.test.ts`):

- For **every** technique with curated puzzles (from Phase 2 list), run `renderSteps(curated.techniqueResult)`.
- Assert: no throw, all steps have non-empty `text`, all `highlightCells` are valid positions (row/col 0–8).
- Assert: `getHighlightCells` never returns positions outside the grid (e.g. from `eliminations` or `placements`).
- Use the same curated technique list as Phase 2 to avoid drift.

### 3. Explanation format validation (optional but valuable)

Step helpers parse `explanation` with regex:

- `extractUnit`: `in (row|column|box) (\d+)`
- `extractCandidates`: `candidates? ([\d, ]+)` or `can only be (\d)`
- `extractNumber`: `^(\d)`

If solver explanations don't match, step text may fall back to generic phrasing (e.g. "their shared unit" instead of "row 3").

Add a test that, for each curated puzzle's `techniqueResult`:

- Logs or asserts that `extractUnit` / `extractCandidates` / `extractNumber` return non-null when the template expects them (e.g. Naked Pair expects candidates).
- Or: document which techniques rely on which helper and add a "explanation format" contract test per technique.

Start simple: one test that collects techniques where helpers return null for curated results, and report them for manual review. No hard failure initially.

### 4. Manual review checklist

Create `docs/PHASE3_MANUAL_REVIEW_CHECKLIST.md`:

- **longDescription**: Does it correctly describe the technique? Is it clear for a learner? Any jargon that needs explanation?
- **shortDescription**: Does it match the technique? Concise and accurate?
- **Step text**: For each technique with curated content, manually review rendered steps. Do they correctly describe the pattern? Are highlights correct? Any confusing or wrong wording?
- **Mochi hints**: Are they appropriate and on-brand?

Format: table with technique ID, status (pending/reviewed/needs-fix), notes.

### 5. Handle techniques without step templates

Some techniques have metadata and solver but no custom step templates (e.g. if not in TECHNIQUE_STEP_TEMPLATES). They use fallback: single step with raw `explanation`.

- Document which techniques use fallback.
- Optionally: add a test that techniques with curated content either have custom templates or are explicitly listed as "fallback OK".

### 6. Integrate with existing tests

- **Option A**: Extend `stepTemplates.test.ts` with new describe blocks for metadata checks and full curated coverage.
- **Option B**: Create `lessonInstructionVerification.test.ts` for Phase 3–specific checks; keep `stepTemplates.test.ts` for template/rendering behavior.

Prefer Option B if the file would grow large; otherwise Option A keeps step-related tests together.

## Suggested Test Layout

```
describe('Metadata completeness (Phase 3)')
  test('all techniques have non-empty longDescription and shortDescription')
  test('no placeholder text in descriptions')
  test('shortDescription length within bounds')
  test('every TECHNIQUE_STEP_TEMPLATES entry has matching TECHNIQUE_METADATA')
  test('solver-backed techniques have step templates or documented fallback')

describe('Step template robustness (Phase 3)')
  for each technique with curated puzzles (from Phase 2)
    for each puzzle
      test('renderSteps does not throw')
      test('all steps have non-empty text')
      test('all highlightCells are valid positions (0-8)')
```

## Deliverables

- Automated tests for metadata completeness and sanity.
- Automated tests for step template robustness across all curated techniques.
- Optional: explanation format validation / contract test.
- Manual review checklist document (`docs/PHASE3_MANUAL_REVIEW_CHECKLIST.md`).
- Update `docs/LESSON_DATA_REPAIR_INVENTORY.md` with Phase 3 findings (if any repairs).

## Acceptance Criteria

Phase 3 is complete when:

- All metadata completeness tests pass.
- All step template robustness tests pass for every curated technique and puzzle.
- Manual review checklist exists and is filled out (or explicitly deferred).
- Any techniques with missing/placeholder descriptions or broken step templates are documented and either fixed or tracked.

## Risks and Notes

- **Explanation format drift**: Solver techniques produce `explanation` strings. If a technique's explanation format changes, step helpers may fail to extract values. Consider adding a comment in each solver technique documenting the expected explanation format.
- **Manual review scope**: Full manual review of 30+ techniques is time-consuming. Prioritize techniques with curated content (15) and those with high traffic.
- **Fallback behavior**: `renderSteps` catches errors and falls back to raw explanation. Tests should ensure we don't silently fall back when we expect custom steps; that would indicate a bug in the template or helper.

## Techniques With Curated Content (Phase 2)

naked-pair, hidden-pair, pointing-pair, box-line-reduction, naked-triple, hidden-triple, x-wing, finned-fish, skyscraper, two-string-kite, swordfish, xy-wing, xyz-wing, bug, unique-rectangle.

## To-Dos

- [x] Add metadata completeness tests (non-empty, no placeholders, length, consistency)
- [x] Add step template robustness tests for all curated techniques
- [x] Add highlight cell bounds validation (0-8)
- [ ] Optional: explanation format validation / contract test
- [x] Create manual review checklist document
- [x] Document techniques using fallback steps
- [x] Update LESSON_DATA_REPAIR_INVENTORY if any Phase 3 repairs
