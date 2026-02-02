// Hook for contextual mascot messages during gameplay
// Uses priority-based message selection with debouncing

import { useState, useEffect, useRef } from 'react';
import { useGameStore, useProgress } from '../stores/gameStore';

// MARK: - Types

interface GameStateSnapshot {
  gameStatus: string;
  isNotesMode: boolean;
  mistakeCount: number;
  hintsUsed: number;
  progress: number;
}

interface MessageTrigger {
  condition: (state: GameStateSnapshot, prevState: GameStateSnapshot | null) => boolean;
  message: string;
  priority: number;
}

// MARK: - Message Configuration

// Priority-ordered message triggers
// Higher priority = shown first when multiple conditions match
const MESSAGE_TRIGGERS: MessageTrigger[] = [
  // Highest priority: Terminal/event states
  {
    condition: (s) => s.gameStatus === 'won',
    message: "Purrfect! You did it!",
    priority: 100,
  },
  {
    condition: (s) => s.gameStatus === 'lost',
    message: "Don't give up!",
    priority: 95,
  },
  {
    condition: (s, prev) => prev !== null && s.mistakeCount > prev.mistakeCount,
    message: "No worries, keep trying!",
    priority: 90,
  },
  {
    condition: (s, prev) => prev !== null && s.hintsUsed > prev.hintsUsed,
    message: "Smart move!",
    priority: 80,
  },

  // Medium priority: Mode states
  {
    condition: (s) => s.isNotesMode,
    message: "Good strategy!",
    priority: 50,
  },

  // Lowest priority: Progress-based (fallback messages)
  {
    condition: (s) => s.progress >= 0.9,
    message: "Just a few more cells!",
    priority: 10,
  },
  {
    condition: (s) => s.progress >= 0.6,
    message: "Almost there!",
    priority: 9,
  },
  {
    condition: (s) => s.progress >= 0.3,
    message: "Keep going, you're doing great!",
    priority: 8,
  },
  {
    condition: (s) => s.progress >= 0.05,
    message: "You're off to a great start!",
    priority: 7,
  },
  {
    condition: () => true, // Default fallback
    message: "Let's solve this puzzle!",
    priority: 1,
  },
];

// MARK: - Pure Functions (for testing)

/**
 * Derives the appropriate message based on game state
 * Pure function for easy unit testing
 */
export const deriveMessage = (
  state: GameStateSnapshot,
  prevState: GameStateSnapshot | null
): string => {
  const match = MESSAGE_TRIGGERS
    .filter((t) => t.condition(state, prevState))
    .sort((a, b) => b.priority - a.priority)[0];

  return match?.message ?? "Let's go!";
};

// MARK: - Hook

const DEBOUNCE_MS = 300;

/**
 * Hook that returns contextual mascot message based on game state
 * Includes debouncing to prevent message flicker
 */
export function useGameMascotMessage(): string {
  // Subscribe to relevant game state
  const gameStatus = useGameStore((s) => s.gameStatus);
  const isNotesMode = useGameStore((s) => s.isNotesMode);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const progress = useProgress();

  // Track previous state for detecting changes
  const prevStateRef = useRef<GameStateSnapshot | null>(null);

  // Create current state snapshot
  const currentState: GameStateSnapshot = {
    gameStatus,
    isNotesMode,
    mistakeCount,
    hintsUsed,
    progress,
  };

  // Derive message from current state
  const derivedMessage = deriveMessage(currentState, prevStateRef.current);

  // Debounced displayed message
  const [displayedMessage, setDisplayedMessage] = useState(derivedMessage);

  // Update previous state ref after deriving message
  useEffect(() => {
    prevStateRef.current = currentState;
  });

  // Debounce message updates to prevent flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedMessage(derivedMessage);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [derivedMessage]);

  return displayedMessage;
}
