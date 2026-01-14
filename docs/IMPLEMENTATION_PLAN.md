# Sudokitty React Native Implementation Plan

## Project Overview

This document outlines the complete implementation plan for recreating the Sudokitty iOS app as a React Native application using Expo.

### Original App

Sudokitty is an iOS sudoku game with a feminine, soft pastel aesthetic targeting a Gen Z female audience. The app features Mochi, a cute orange tabby cat mascot who observes gameplay, reacts to user actions, and provides hints.

### Target Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Expo (managed workflow) | Easier setup, OTA updates, built-in libraries |
| Navigation | Expo Router | File-based routing, modern, integrated with Expo |
| State Management | Zustand | Lightweight, simple API, minimal boilerplate |
| Animations | React Native Reanimated 3 | UI thread performance, spring physics |
| Haptics | expo-haptics | Native feel, simple API |
| Storage | AsyncStorage + Zustand persist | Simple, sufficient for game data |
| Target Platform | iOS only (initially) | Match original app |

---

## Architecture Overview

### Pattern Translation: SwiftUI → React Native

| SwiftUI Pattern | React Native Equivalent |
|----------------|------------------------|
| MVVM (ViewModel) | Zustand stores + custom hooks |
| `@Published` properties | Zustand selectors with shallow equality |
| `@StateObject` | Store initialization |
| SwiftUI Views | Functional components |
| `withAnimation {}` | Reanimated `withSpring/withTiming` |
| `@AppStorage` | AsyncStorage with Zustand persist |

### Project Structure

```
sudokitty-rn/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root layout
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home (game)
│   │   ├── daily.tsx             # Daily challenge
│   │   └── profile.tsx           # Stats & settings
│   └── modal.tsx                 # Difficulty selector
│
├── src/
│   ├── components/
│   │   ├── board/                # SudokuBoard, SudokuCell
│   │   ├── controls/             # NumberPad, ActionButtons
│   │   ├── mochi/                # MochiMascot, SpeechBubble
│   │   ├── overlays/             # Victory, GameOver, Confetti
│   │   └── ui/                   # Button, Card
│   │
│   ├── stores/
│   │   ├── gameStore.ts          # Core game state
│   │   ├── userStore.ts          # Persistent user data
│   │   └── mochiStore.ts         # Mascot mood state
│   │
│   ├── engine/
│   │   ├── types.ts              # Type definitions
│   │   ├── generator.ts          # Puzzle generation
│   │   ├── solver.ts             # Solver + techniques
│   │   └── techniques/           # 10 solving techniques
│   │
│   ├── hooks/                    # Custom React hooks
│   ├── theme/                    # Colors, typography, animations
│   └── utils/                    # Helpers
```

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

**Goal:** Minimal playable Sudoku with core mechanics

- [x] Project setup with Expo
- [x] Install dependencies (Reanimated, Zustand, AsyncStorage, expo-haptics)
- [x] Define core types (Cell, Position, Difficulty, GameState)
- [x] Implement puzzle generator with backtracking algorithm
- [x] Implement basic gameStore with Zustand
- [x] Create SudokuBoard and SudokuCell components
- [x] Create NumberPad component
- [x] Create theme (colors, typography, animations)
- [x] Set up Expo Router with tab navigation

**Deliverable:** Play a complete game of Sudoku with basic feedback

### Phase 2: Core Gameplay Polish

**Goal:** Match iOS app's core feel

- [ ] Cell selection animations (spring)
- [ ] Correct/incorrect input feedback animations
- [ ] Cell glow effect on correct input
- [ ] Notes mode toggle with visual state
- [ ] Undo/redo functionality
- [ ] Mistake counter with visual feedback
- [ ] Timer implementation
- [ ] Row/column/box completion detection
- [ ] Completion wave animation
- [ ] Haptic feedback integration

**Deliverable:** Core gameplay feels polished with animations and haptics

### Phase 3: Mochi Mascot

**Goal:** Bring the cat to life

- [ ] MochiStore setup (mood state)
- [ ] MochiSprite component (mood images or vector graphics)
- [ ] SpeechBubble component
- [ ] Mood reaction logic (correct/incorrect/completion)
- [ ] Idle animations (breathing, blinking)
- [ ] Mood-specific animations (happy bounce, worried shake)
- [ ] Context-aware dialog system
- [ ] Celebration animation (victory)

**Deliverable:** Interactive mascot responding to gameplay

### Phase 4: Game Flow & Overlays

**Goal:** Complete game lifecycle

- [ ] Victory overlay with confetti
- [ ] Game over overlay
- [ ] Difficulty selector improvements
- [ ] New game flow polish
- [ ] Pause/resume functionality
- [ ] Game state persistence (save/load)
- [ ] Tutorial overlay (first-time user)
- [ ] Hint system implementation

**Deliverable:** Full game flow from start to finish

### Phase 5: Navigation & Persistence

**Goal:** Multi-screen experience with data persistence

- [ ] Complete tab navigation polish
- [ ] Home screen enhancements
- [ ] Profile screen with stats
- [ ] User store with AsyncStorage persistence
- [ ] Stats display per difficulty
- [ ] Streak tracking
- [ ] Mochi points system
- [ ] Daily challenge screen (basic)

**Deliverable:** Navigable app with persistent progress

### Phase 6: Solver & Difficulty Validation

**Goal:** Authentic difficulty levels

- [ ] Solver infrastructure
- [ ] Naked Singles / Hidden Singles
- [ ] Naked Pairs / Hidden Pairs
- [ ] Pointing pairs & box-line reduction
- [ ] Naked Triples
- [ ] X-Wing
- [ ] XY-Wing
- [ ] Difficulty validation for generated puzzles

**Deliverable:** Proper difficulty-graded puzzles

### Phase 7: Daily Challenges & Polish

**Goal:** Daily engagement & final polish

- [ ] Daily puzzle generation (seeded random)
- [ ] Daily challenge calendar UI
- [ ] Daily completion tracking
- [ ] Streak bonuses
- [ ] Achievement system
- [ ] Settings screen
- [ ] App icon & splash screen
- [ ] Performance optimization

**Deliverable:** Feature-complete app

### Phase 8: Testing & Launch Prep

**Goal:** Quality assurance & app store readiness

- [ ] Unit tests for solver/generator
- [ ] Integration tests for game flow
- [ ] E2E tests for critical paths
- [ ] Performance profiling
- [ ] Accessibility audit (VoiceOver)
- [ ] App Store assets
- [ ] TestFlight beta
- [ ] Bug fixes from beta feedback

---

## Key Technical Details

### State Management

#### gameStore (replaces iOS GameViewModel)

```typescript
interface GameState {
  board: Cell[][];           // 9x9 grid
  difficulty: Difficulty;    // easy/medium/hard/expert
  selectedCell: Position | null;
  highlightedNumber: number | null;
  isNotesMode: boolean;
  mistakeCount: number;      // max 3
  hintsUsed: number;
  timeElapsed: number;       // seconds
  gameStatus: GameStatus;    // idle/playing/paused/won/lost
  history: BoardSnapshot[];  // for undo
  lastCompletedUnit: CompletedUnit | null;  // for wave animation
  lastCorrectCell: Position | null;         // for glow effect
}
```

#### userStore (persistent)

```typescript
interface UserState {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  mochiPoints: number;
  stats: Record<Difficulty, DifficultyStats>;
  hasCompletedTutorial: boolean;
  hapticsEnabled: boolean;
}
```

#### mochiStore

```typescript
interface MochiState {
  mood: MochiMood;  // 9 states
  currentDialog: string | null;
  isDialogVisible: boolean;
}
```

### Animation Strategy

| Animation | Implementation |
|-----------|----------------|
| Cell selection | `withSpring({ damping: 15, stiffness: 200 })` |
| Cell glow | `withSequence(withTiming(1, 150ms), withTiming(0, 600ms))` |
| Completion wave | Staggered delays (50ms per cell from epicenter) |
| Mochi idle | `withRepeat` breathing animation |
| Confetti | 50 pieces with random fall trajectories |

### Haptic Patterns

| Action | Haptic Type |
|--------|-------------|
| Cell select | `selectionAsync()` |
| Correct input | `ImpactFeedbackStyle.Light` |
| Incorrect input | `NotificationFeedbackType.Error` |
| Completion wave | Staggered `Medium` impacts |
| Victory | Success + escalating impacts |

### Puzzle Generation Algorithm

1. Generate complete board via backtracking
2. Remove clues strategically based on difficulty:
   - Easy: 36-50 clues
   - Medium: 30-40 clues
   - Hard: 25-32 clues
   - Expert: 22-28 clues
3. Validate unique solution exists (count solutions, limit to 2)
4. Validate difficulty matches required techniques (Phase 6)

---

## Files Created (Phase 1)

| File | Purpose |
|------|---------|
| `src/engine/types.ts` | Core type definitions |
| `src/engine/generator.ts` | Puzzle generation |
| `src/stores/gameStore.ts` | Game state management |
| `src/theme/colors.ts` | Pastel color palette |
| `src/theme/typography.ts` | Font styles |
| `src/theme/animations.ts` | Animation configs |
| `src/theme/index.ts` | Theme exports |
| `src/components/board/SudokuBoard.tsx` | 9x9 grid container |
| `src/components/board/SudokuCell.tsx` | Individual cell |
| `src/components/controls/NumberPad.tsx` | 1-9 input |
| `src/components/controls/ActionButtons.tsx` | Undo/erase/notes/hint |
| `app/(tabs)/index.tsx` | Home screen |
| `app/(tabs)/daily.tsx` | Daily challenge (placeholder) |
| `app/(tabs)/profile.tsx` | Profile (placeholder) |
| `app/modal.tsx` | Difficulty selector |

---

## Running the App

```bash
cd sudokitty-rn
npm start       # Start Expo dev server
npm run ios     # Run on iOS simulator
```

---

## Next Steps

1. Test Phase 1 implementation on iOS simulator
2. Add cell animations and haptic feedback (Phase 2)
3. Implement Mochi mascot (Phase 3)
4. Add overlays and game flow polish (Phase 4)
5. Complete persistence and navigation (Phase 5)

---

## iOS Feature Mapping

| iOS Feature | React Native Implementation | Status |
|-------------|----------------------------|--------|
| SudokuBoard | `SudokuBoard.tsx` | ✅ |
| CellView | `SudokuCell.tsx` | ✅ |
| NumberPadView | `NumberPad.tsx` | ✅ |
| GameViewModel | `gameStore.ts` | ✅ |
| Theme colors | `colors.ts` | ✅ |
| Cell highlighting | `useRelatedCells` selector | ✅ |
| Notes mode | `isNotesMode` state | ✅ |
| Undo/redo | `history` array + actions | ✅ |
| Timer | `useEffect` interval | ✅ |
| Haptics | expo-haptics | 🔲 Phase 2 |
| Cell animations | Reanimated | 🔲 Phase 2 |
| MochiView | `MochiMascot.tsx` | 🔲 Phase 3 |
| Victory overlay | `VictoryOverlay.tsx` | 🔲 Phase 4 |
| Confetti | `Confetti.tsx` | 🔲 Phase 4 |
| AsyncStorage | Zustand persist | 🔲 Phase 5 |
| Solver techniques | `techniques/` | 🔲 Phase 6 |
| Daily challenge | seeded generator | 🔲 Phase 7 |
