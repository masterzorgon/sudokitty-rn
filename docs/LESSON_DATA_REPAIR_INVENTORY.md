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

## Next Steps

For techniques with empty curated arrays, the app uses `generateWithFallback` which tries on-device generation first. To restore curated content for removed techniques, add new puzzles with valid solutions (verified by running the solver or integrity tests).
