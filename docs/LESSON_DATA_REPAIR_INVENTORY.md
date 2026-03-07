# Lesson Data Repair Inventory (Phase 1)

Generated from Phase 1 Board and Data Integrity validation.

## Summary

- **Broken (removed)**: 10 techniques had invalid stored solutions (zeros, duplicates, or placeholder copies). These puzzles were removed; techniques now have empty curated arrays and will use on-device generation fallback.
- **Fixed**: 1 technique (xyz-wing) had a placeholder solution; the solver produced a valid solution which was applied.
- **Merely absent**: 4 techniques never had curated content (templates, forcing-net, kraken-fish, brute-force).

## Broken and Removed

| Technique ID       | Issue                                                                 |
|--------------------|-----------------------------------------------------------------------|
| jellyfish          | Solver cannot solve (hits iteration limit or gets stuck)              |
| turbot-fish        | Stored solution had zeros and duplicate digits                        |
| empty-rectangle    | Stored solution had zeros                                             |
| sue-de-coq         | Solution was placeholder (identical to puzzle)                        |
| simple-colors      | Stored solution had zeros and duplicate digits                        |
| franken-fish       | Stored solution had zeros                                             |
| mutant-fish        | Stored solution had zeros                                             |
| multi-colors       | Stored solution had zeros                                             |
| forcing-chain      | Solution was placeholder (identical to puzzle)                        |
| almost-locked-sets | Solution was placeholder (identical to puzzle)                       |
| siamese-fish       | Stored solution had zeros                                             |

## Fixed

| Technique ID | Action                                                              |
|--------------|---------------------------------------------------------------------|
| xyz-wing     | Replaced placeholder solution with solver output                    |

## Merely Absent (No Curated Content)

- templates
- forcing-net
- kraken-fish
- brute-force

## Phase 2 Removals (Technique Verification)

| Technique ID | Puzzle | Issue                                                                 |
|--------------|--------|-----------------------------------------------------------------------|
| naked-triple | 1      | Solver finds different naked triple instance; stored result did not match |
| xy-wing      | 0      | Solver could not find XY-Wing (candidate state not reproducible)     |

## Phase 3 (Description and Instruction Review)

- **Automated tests**: Added `lessonInstructionVerification.test.ts` — metadata completeness (non-empty descriptions, no placeholders, length bounds, consistency) and step template robustness (render without throw, valid highlight cells 0–8) for all curated techniques.
- **Manual checklist**: Created `docs/PHASE3_MANUAL_REVIEW_CHECKLIST.md` for human review of longDescription, shortDescription, step text, and Mochi hints.
- **Fallback steps**: No techniques currently use fallback. All techniques in TECHNIQUE_STEP_TEMPLATES have custom step templates; `renderSteps` falls back to raw `explanation` only when no template exists or a template throws.

## Next Steps

For techniques with empty curated arrays, the app uses `generateWithFallback` which tries on-device generation first. To restore curated content for removed techniques, add new puzzles with valid solutions (verified by running the solver or integrity tests).
