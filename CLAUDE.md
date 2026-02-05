```markdown
# Claude Instructions for Sudokitty

## Project Overview

**Sudokitty** is a React Native iOS sudoku game featuring Mochi Cat, an animated orange tabby mascot who reacts to gameplay. The app combines challenging sudoku puzzles with delightful character interactions in a kawaii-inspired pastel aesthetic.

- **Framework**: React Native (iOS 17+)
- **Language**: TypeScript
- **Styling**: StyleSheet API with centralized theme
- **Animation**: Rive (for Mochi Cat character states)
- **Target Audience**: Casual puzzle players who enjoy cute, polished mobile experiences

## Planning & Documentation

**Always refer to and create plan documents in**: `/Users/masterzorgon/Personal/.cursor/plans/sudokitty/`

- Before starting significant features, create or update planning docs in this directory
- Use descriptive filenames: `feature-mochi-reactions.md`, `refactor-game-logic.md`, etc.
- Include implementation steps, technical decisions, and open questions
- Reference existing plans when continuing work on features
- Update plans as implementation evolves or requirements change

## Code Style & Conventions

### Comments & Documentation
- **Always include detailed comments** explaining what each code section does and why
- Focus on the "why" behind non-obvious logic, not just describing what the code does
- Use section markers for organization:
  ```typescript
  // MARK: - State Management
  // MARK: - Animation Handlers
  // MARK: - Game Logic
  ```
- Add JSDoc for complex functions:
  ```typescript
  /**
   * Validates sudoku move and triggers Mochi reaction
   * @param row - Grid row index (0-8)
   * @param col - Grid column index (0-8)
   * @param value - Number placed (1-9)
   * @returns true if valid move
   */
  ```

### TypeScript Standards
- Strict mode enabled - no `any` types unless absolutely necessary
- Define interfaces for all props and complex state:
  ```typescript
  interface MochiState {
    animation: 'idle' | 'celebrate' | 'thinking' | 'oops';
    mood: number; // 0-100
  }
  ```
- Use explicit return types on functions
- Prefer `const` over `let`, functional patterns over mutations

### Component Structure
- Organize imports: React → React Native → Third-party → Local
- Structure components top-to-bottom: Props → Hooks → Handlers → Render
- Keep components under 300 lines - extract when larger
- Colocate related components in feature folders

## Design System

### Theme Location
- All colors, spacing, typography defined in `src/theme/index.ts`
- Reference theme values, never hardcode colors/sizes
- Pastel palette with soft gradients for feminine aesthetic

### Animation Guidelines
- Mochi Cat states managed via Rive animation controller
- Trigger reactions based on game events (correct move, mistake, puzzle completion)
- Keep animations smooth (60fps) - profile on real devices
- Use React Native Reanimated for UI transitions

## File Organization

```
src/
├── components/
│   ├── game/          # Sudoku grid, cell components
│   ├── mochi/         # Mochi Cat character & animations
│   └── ui/            # Reusable buttons, modals, etc.
├── screens/           # Main app screens
├── hooks/             # Custom React hooks
├── utils/             # Helper functions, game logic
├── theme/             # Design tokens
└── types/             # TypeScript definitions
```

## Key Principles

1. **Mobile-first**: Design for thumb-friendly touch targets (min 44x44pt)
2. **Performant**: Optimize re-renders, memoize expensive calculations
3. **Accessible**: Support VoiceOver, dynamic type sizing
4. **Delightful**: Smooth animations, satisfying feedback, personality in every interaction
5. **Maintainable**: Clear separation of concerns, well-documented, testable

## Testing Approach

- Unit tests for game logic (sudoku validation, hint generation)
- Snapshot tests for UI components
- Manual testing on physical iOS devices for animations/gestures
- Focus on edge cases (impossible puzzles, rapid input)

---

When working on Sudokitty, prioritize user experience - every tap should feel responsive, every animation should spark joy, and Mochi should feel like a companion, not just decoration.
```