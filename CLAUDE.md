# Claude Instructions for Sudokitty

## Code Style

### Comments
- Always leave detailed comments on code so it's easy to read and understand what each part does
- Explain the "why" not just the "what" when the logic isn't immediately obvious
- Use `// MARK: -` sections to organize code into logical groups
- Add brief inline comments for non-trivial logic

### Example
```swift
// MARK: - Animation

/// Animates the counter from 0 to the target value with an ease-out effect.
/// The animation starts fast and slows down as it approaches the final number,
/// creating a satisfying "slot machine" feel.
private func animateValue() {
    // Don't animate if target is 0 - just set it directly
    guard targetValue > 0 else {
        displayedValue = targetValue
        return
    }

    let startTime = Date()

    // Use a timer at 60fps (0.016s interval) for smooth animation
    let timer = Timer.scheduledTimer(withTimeInterval: 0.016, repeats: true) { timer in
        let elapsed = Date().timeIntervalSince(startTime)
        let progress = min(elapsed / duration, 1.0)

        // Ease-out cubic formula: 1 - (1 - x)^3
        // This makes the animation fast at the start, slow at the end
        let easedProgress = 1 - pow(1 - progress, 3)

        displayedValue = Int(Double(targetValue) * easedProgress)

        // Stop the timer when we reach 100% progress
        if progress >= 1.0 {
            timer.invalidate()
            displayedValue = targetValue
        }
    }

    // Add to common run loop mode so animation continues during scrolling
    RunLoop.current.add(timer, forMode: .common)
}
```

## Project Context

- **App**: Sudokitty - iOS sudoku game with feminine pastel aesthetic
- **Architecture**: MVVM with SwiftUI
- **Target**: iOS 17+
- **Mascot**: Mochi, an orange tabby cat who reacts to gameplay
- **Design System**: Defined in `Utilities/Theme.swift`