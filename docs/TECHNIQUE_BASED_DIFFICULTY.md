# Technique-Based Difficulty System

## Overview

This document outlines a plan to upgrade Sudokitty's difficulty system from simple clue-count-based grading to technique-based grading. This ensures that puzzles labeled "hard" actually require advanced solving techniques, not just trial and error.

---

## Current State

### How Difficulty Works Now

The current system in `Difficulty.swift` uses **fixed, exact clue counts**:

| Difficulty | Cells Removed | Clues Given |
|------------|---------------|-------------|
| Easy       | 30 (always)   | 51          |
| Medium     | 40 (always)   | 41          |
| Hard       | 50 (always)   | 31          |
| Expert     | 55 (always)   | 26          |

Every Medium puzzle has exactly 41 clues. Every Hard puzzle has exactly 31 clues. No variation.

**Problems:**
1. **Fixed counts ≠ consistent difficulty** — A puzzle with 41 clues might require X-wings, while one with 26 clues might only need naked singles. The number of clues doesn't determine what techniques are needed.
2. **No validation that puzzles have a unique solution** — Random removal can create puzzles with multiple solutions
3. **Random cell removal can create unsolvable-without-guessing puzzles** — Some configurations require bifurcation (trial and error)
4. **No way to teach players specific techniques progressively** — Players can't learn techniques in order of difficulty
5. **No variety within difficulty levels** — Every Medium game feels the same in terms of clue distribution

---

## The Key Insight: Technique Level > Clue Count

Traditional Sudoku difficulty is **backwards** from how Sudokitty currently works:

| Current Approach (Wrong) | Better Approach (Proposed) |
|--------------------------|---------------------------|
| Fixed clue count defines difficulty | Required techniques define difficulty |
| "Medium = exactly 41 clues" | "Medium = requires at most Level 2 techniques" |
| Clue count is the input | Clue count is the output (varies) |
| No guaranteed solvability | Always logically solvable |

### Why Clue Count Should Vary

Two puzzles with the same clue count can have wildly different difficulties:

```
Puzzle A: 35 clues, solvable with only Naked Singles     → Actually Easy
Puzzle B: 35 clues, requires X-Wing to solve             → Actually Hard
Puzzle C: 35 clues, requires guessing (no logical path)  → Broken/Unfair
```

In a technique-based system:
- An **Easy** puzzle might have 40-50 clues (whatever it takes to stay at Level 1)
- A **Hard** puzzle might have 28-38 clues (depends on the specific puzzle)
- The clue count becomes a **result** of generation, not a **constraint**

---

## Solving Techniques by Difficulty

### Technique Hierarchy

| Level | Technique | Description |
|-------|-----------|-------------|
| **1 - Easy** | Naked Single | Only one candidate remains in a cell |
| **1 - Easy** | Hidden Single | A candidate appears only once in a row/column/box |
| **2 - Medium** | Naked Pair | Two cells in a unit share exactly two candidates |
| **2 - Medium** | Hidden Pair | Two candidates appear only in two cells of a unit |
| **2 - Medium** | Pointing Pair | Candidates in a box aligned in a row/column |
| **2 - Medium** | Box/Line Reduction | Candidates in a row/column confined to one box |
| **3 - Hard** | Naked Triple/Quad | Three/four cells share three/four candidates |
| **3 - Hard** | Hidden Triple/Quad | Three/four candidates confined to three/four cells |
| **3 - Hard** | X-Wing | Two rows have a candidate in exactly the same two columns |
| **4 - Expert** | Swordfish | Three rows have a candidate in the same three columns |
| **4 - Expert** | XY-Wing | Three cells form a chain eliminating candidates |
| **4 - Expert** | Simple Coloring | Single-candidate chain analysis |
| **5 - Master** | Forcing Chains | Multi-step hypothetical reasoning |
| **5 - Master** | Unique Rectangles | Using uniqueness to eliminate candidates |

### Proposed Difficulty Mapping

| Difficulty | Max Technique Level | Required Techniques |
|------------|---------------------|---------------------|
| Easy       | 1                   | Naked/Hidden Singles only |
| Medium     | 2                   | May require Pairs, Pointing |
| Hard       | 3                   | May require Triples, X-Wing |
| Expert     | 4                   | May require Swordfish, XY-Wing |

---

## Implementation Plan

### Phase 1: Solver Engine

Create a new `Solver/` directory with a technique-based solver.

#### New Files

```
Sudokitty/
├── Solver/
│   ├── SudokuSolver.swift       # Main solver orchestrator
│   ├── CandidateGrid.swift      # Manages candidates for all cells
│   ├── Techniques/
│   │   ├── Technique.swift      # Protocol for all techniques
│   │   ├── NakedSingle.swift    # Level 1
│   │   ├── HiddenSingle.swift   # Level 1
│   │   ├── NakedPair.swift      # Level 2
│   │   ├── HiddenPair.swift     # Level 2
│   │   ├── PointingPair.swift   # Level 2
│   │   ├── BoxLineReduction.swift # Level 2
│   │   ├── NakedTriple.swift    # Level 3
│   │   ├── XWing.swift          # Level 3
│   │   ├── Swordfish.swift      # Level 4
│   │   └── XYWing.swift         # Level 4
│   └── SolveResult.swift        # Tracks techniques used
```

#### Technique Protocol

```swift
protocol Technique {
    static var name: String { get }
    static var level: Int { get }

    /// Attempts to apply this technique to the grid
    /// Returns eliminations made, or nil if technique doesn't apply
    static func apply(to grid: CandidateGrid) -> TechniqueResult?
}

struct TechniqueResult {
    let technique: String
    let level: Int
    let eliminations: [(row: Int, col: Int, candidates: Set<Int>)]
    let placements: [(row: Int, col: Int, value: Int)]
    let explanation: String  // For hints/teaching
}
```

#### CandidateGrid

```swift
class CandidateGrid {
    private var candidates: [[Set<Int>]]  // 9x9 grid of candidate sets
    private var values: [[Int?]]          // Current placed values

    init(from board: SudokuBoard)

    func candidates(at row: Int, col: Int) -> Set<Int>
    func eliminate(_ candidate: Int, at row: Int, col: Int)
    func place(_ value: Int, at row: Int, col: Int)

    // Peer queries
    func rowPeers(of row: Int, col: Int) -> [(Int, Int)]
    func colPeers(of row: Int, col: Int) -> [(Int, Int)]
    func boxPeers(of row: Int, col: Int) -> [(Int, Int)]
    func allPeers(of row: Int, col: Int) -> [(Int, Int)]

    // Unit queries (for technique implementations)
    func candidatePositions(for value: Int, in unit: Unit) -> [(Int, Int)]
}
```

#### SudokuSolver

```swift
class SudokuSolver {
    private let techniques: [Technique.Type] = [
        // Level 1
        NakedSingle.self,
        HiddenSingle.self,
        // Level 2
        NakedPair.self,
        HiddenPair.self,
        PointingPair.self,
        BoxLineReduction.self,
        // Level 3
        NakedTriple.self,
        XWing.self,
        // Level 4
        Swordfish.self,
        XYWing.self,
    ]

    /// Solves the puzzle and returns difficulty analysis
    func solve(_ board: SudokuBoard) -> SolveResult

    /// Checks if puzzle is solvable without guessing
    func isSolvableLogically(_ board: SudokuBoard) -> Bool

    /// Returns the minimum difficulty level required
    func analyzeDifficulty(_ board: SudokuBoard) -> Difficulty
}

struct SolveResult {
    let solved: Bool
    let hasUniqueSolution: Bool
    let techniquesUsed: [String: Int]  // technique name -> usage count
    let maxLevelRequired: Int
    let difficulty: Difficulty
    let steps: [TechniqueResult]  // For hint system
}
```

### Phase 2: Puzzle Generator Upgrade

Modify `SudokuBoard.generateNewBoard()` to use solver validation.

#### Updated Generation Flow

```
generateNewBoard(difficulty: Difficulty)
  ↓
1. Generate complete solution (existing backtracking)
  ↓
2. Strategic cell removal loop:
   a. Remove a cell
   b. Run solver to check:
      - Still has unique solution?
      - Required difficulty level?
   c. If difficulty exceeds target, restore cell
   d. Repeat until target clue count reached
  ↓
3. Final validation:
   - Verify unique solution
   - Verify max technique level matches difficulty
   - If failed, regenerate
```

#### Key Changes to SudokuBoard

```swift
extension SudokuBoard {
    mutating func generateNewBoard(difficulty: Difficulty) {
        let solver = SudokuSolver()
        var attempts = 0
        let maxAttempts = 100

        repeat {
            // Generate complete solution
            var solution = Array(repeating: Array(repeating: 0, count: 9), count: 9)
            _ = fillBoard(&solution)

            // Create cells from solution
            cells = solution.enumerated().map { row, values in
                values.enumerated().map { col, value in
                    Cell(row: row, column: col, value: value,
                         correctValue: value, isGiven: true)
                }
            }

            // Strategic removal based on technique level, not fixed count
            removeNumbersStrategically(
                clueRange: difficulty.clueRange,
                maxLevel: difficulty.maxTechniqueLevel,
                solver: solver
            )

            // Validate result
            let result = solver.solve(self)
            attempts += 1

        } while (!isValidPuzzle(result, for: difficulty) && attempts < maxAttempts)
    }

    private mutating func removeNumbersStrategically(
        clueRange: ClosedRange<Int>,
        maxLevel: Int,
        solver: SudokuSolver
    ) {
        var currentClues = 81
        var positions = allPositions.shuffled()

        for (row, col) in positions {
            // Stop if we've hit minimum clues for this difficulty
            guard currentClues > clueRange.lowerBound else { break }

            let backup = cells[row][col].value
            cells[row][col].value = nil
            cells[row][col].isGiven = false

            let result = solver.solve(self)

            if !result.hasUniqueSolution || result.maxLevelRequired > maxLevel {
                // Restore - removal breaks uniqueness or exceeds technique level
                cells[row][col].value = backup
                cells[row][col].isGiven = true
            } else {
                currentClues -= 1
            }
        }

        // Note: Final clue count will vary based on the specific puzzle.
        // A puzzle might end up with 38 clues if that's what Level 2 allows,
        // or 32 clues if the puzzle happens to stay at Level 2 with fewer.
    }

    private func isValidPuzzle(_ result: SolveResult, for difficulty: Difficulty) -> Bool {
        // Must have unique solution
        guard result.hasUniqueSolution else { return false }

        // Must be solvable without guessing
        guard result.solved else { return false }

        // Technique level must not exceed difficulty
        guard result.maxLevelRequired <= difficulty.maxTechniqueLevel else { return false }

        // Clue count must be within acceptable range
        let clueCount = cells.flatMap { $0 }.filter { $0.isGiven }.count
        guard difficulty.clueRange.contains(clueCount) else { return false }

        return true
    }
}
```

### Phase 3: Difficulty Enum Update

The key change: replace fixed `cellsToRemove` with `clueRange` and `maxTechniqueLevel`.

```swift
enum Difficulty: String, CaseIterable, Identifiable {
    case easy
    case medium
    case hard
    case expert

    var id: String { rawValue }

    var displayName: String {
        rawValue.capitalized
    }

    /// Acceptable range of clues for this difficulty.
    /// The actual count varies based on what the puzzle requires.
    /// Generator removes cells until technique level is reached OR minimum clues hit.
    var clueRange: ClosedRange<Int> {
        switch self {
        case .easy:   return 36...50  // More clues, simpler logic
        case .medium: return 30...40  // Moderate range
        case .hard:   return 25...32  // Fewer clues, complex logic
        case .expert: return 22...28  // Minimal clues, expert techniques
        }
    }

    /// Maximum technique level allowed for this difficulty.
    /// This is the PRIMARY difficulty constraint — not clue count.
    var maxTechniqueLevel: Int {
        switch self {
        case .easy:   return 1  // Naked/Hidden Singles only
        case .medium: return 2  // + Pairs, Pointing, Box/Line
        case .hard:   return 3  // + Triples, X-Wing
        case .expert: return 4  // + Swordfish, XY-Wing, Coloring
        }
    }

    /// Techniques the player should know for this level
    var techniquesRequired: [String] {
        switch self {
        case .easy:
            return ["Naked Single", "Hidden Single"]
        case .medium:
            return ["Naked Pair", "Hidden Pair", "Pointing Pair", "Box/Line Reduction"]
        case .hard:
            return ["Naked Triple", "X-Wing"]
        case .expert:
            return ["Swordfish", "XY-Wing", "Simple Coloring"]
        }
    }

    var mochiComment: String {
        switch self {
        case .easy:   return "purrfect for warming up~"
        case .medium: return "let's get cozy with this one!"
        case .hard:   return "ooh, feeling brave today?"
        case .expert: return "you've got this... i believe in you!"
        }
    }
}
```

**Key differences from current implementation:**

| Property | Current | Proposed |
|----------|---------|----------|
| `cellsToRemove` | Fixed: 30/40/50/55 | Removed entirely |
| `clueRange` | N/A | Range: 36-50 / 30-40 / 25-32 / 22-28 |
| `maxTechniqueLevel` | N/A | Primary constraint: 1/2/3/4 |

The generator now:
1. Removes cells one by one
2. After each removal, runs the solver
3. Stops when EITHER:
   - Technique level would exceed `maxTechniqueLevel`, OR
   - Clue count would drop below `clueRange.lowerBound`
4. Validates final puzzle is within `clueRange`

### Phase 4: Enhanced Hint System

Upgrade `getHint()` to provide technique-based hints.

```swift
extension SudokuBoard {
    /// Returns a strategic hint based on the easiest applicable technique
    func getStrategicHint() -> Hint? {
        let solver = SudokuSolver()
        let grid = CandidateGrid(from: self)

        // Try techniques in order of difficulty
        for technique in solver.techniques {
            if let result = technique.apply(to: grid) {
                return Hint(
                    technique: result.technique,
                    level: result.level,
                    cell: result.placements.first ?? result.eliminations.first,
                    explanation: result.explanation
                )
            }
        }

        return nil
    }
}

struct Hint {
    let technique: String
    let level: Int
    let cell: (row: Int, col: Int)?
    let explanation: String

    var mochiHint: String {
        // Mochi-style explanation
        "psst... try looking for a \(technique.lowercased())~"
    }
}
```

### Phase 5: UI Enhancements (Optional)

#### Technique Learning Mode

- Show which technique applies to current board state
- Highlight relevant cells when hint is requested
- Track techniques the player has successfully used

#### Difficulty Badge Details

```swift
struct DifficultyBadge: View {
    let difficulty: Difficulty

    var body: some View {
        VStack {
            Text(difficulty.displayName)
            Text("Level \(difficulty.maxTechniqueLevel) techniques")
                .font(.caption)
        }
    }
}
```

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `Solver/SudokuSolver.swift` | New | Main solver engine |
| `Solver/CandidateGrid.swift` | New | Candidate management |
| `Solver/Techniques/*.swift` | New | Individual technique implementations |
| `Solver/SolveResult.swift` | New | Result/analysis types |
| `Models/Difficulty.swift` | Modify | Add technique level properties |
| `Models/SudokuBoard.swift` | Modify | Strategic generation with validation |
| `ViewModels/GameViewModel.swift` | Modify | Enhanced hint integration |

---

## Testing Strategy

### Unit Tests

1. **Technique Tests**: Each technique has test cases with known puzzles
2. **Solver Tests**: Verify solver finds correct solution
3. **Uniqueness Tests**: Verify puzzles have exactly one solution
4. **Difficulty Tests**: Verify generated puzzles match target difficulty

### Integration Tests

1. Generate 100 puzzles at each difficulty level
2. Verify all are solvable without guessing
3. Verify technique distribution matches expectations
4. Measure generation time (should be < 2s per puzzle)

### Test Puzzles

Include known puzzles from Sudoku databases:
- Easy: Puzzles solvable with singles only
- Hard: Puzzles requiring X-Wings
- Expert: Puzzles requiring Swordfish/XY-Wing

---

## Performance Considerations

### Generation Time

- Current: ~10ms (simple backtracking + random removal)
- Expected: ~500ms-2s (with solver validation loop)
- Mitigation: Cache generated puzzles, generate in background

### Caching Strategy

```swift
class PuzzleCache {
    static let shared = PuzzleCache()

    private var cache: [Difficulty: [SudokuBoard]] = [:]

    func pregenerate(count: Int, difficulty: Difficulty) async {
        // Generate puzzles in background
    }

    func getPuzzle(difficulty: Difficulty) -> SudokuBoard {
        // Return cached or generate new
    }
}
```

---

## Implementation Order

1. **CandidateGrid** - Foundation for all techniques
2. **Level 1 Techniques** - Naked/Hidden Singles
3. **SudokuSolver** - Basic orchestration with Level 1
4. **Uniqueness Check** - Verify single solution
5. **Level 2 Techniques** - Pairs, Pointing
6. **Level 3-4 Techniques** - Advanced techniques
7. **Generator Integration** - Strategic removal
8. **Hint System** - Technique-based hints
9. **UI Polish** - Technique display, learning mode

---

## References

- [Sudoku Solving Techniques](https://www.sudokuwiki.org/sudoku.htm)
- [Hodoku Solver](http://hodoku.sourceforge.net/en/techniques.php)
- [Cracking the Cryptic](https://www.youtube.com/c/CrackingTheCryptic) - Technique demonstrations