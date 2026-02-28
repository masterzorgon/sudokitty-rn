// Hook for contextual mascot messages during gameplay
// Event-driven: messages appear only in response to events, then auto-dismiss
// Uses probability-based triggering for frequent events (mistakes, correct answers)

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

// MARK: - Types

interface GameStateSnapshot {
  gameStatus: string;
  mistakeCount: number;
  hintsUsed: number;
  lastCorrectCell: { row: number; col: number } | null;
}

interface EventConfig {
  messages: readonly string[];
  probability: number;
  persist?: boolean;
  duration?: number;
}

// MARK: - Event Configuration

const MESSAGE_DURATION_MS = 4500;

const EVENT_CONFIG = {
  gameStart: {
    messages: ["Good luck!", "Let's do this!", "You've got this!"],
    probability: 1.0,
    duration: 4500,
  },
  hint: {
    messages: ["Smart move!", "Good thinking!", "Nice strategy!"],
    probability: 1.0,
    duration: 4500,
  },
  win: {
    messages: ["Purrfect! You did it!", "Amazing work!", "You're a star!"],
    probability: 1.0,
    persist: true,
  },
  lose: {
    messages: ["Don't give up!", "Try again!", "You'll get it next time!"],
    probability: 1.0,
    persist: true,
  },
  mistake: {
    messages: ["No worries!", "Keep trying!", "You've got this!"],
    probability: 0.3,
    duration: 4500,
  },
  correct: {
    messages: ["Nice!", "Great!", "Perfect!", "Awesome!"],
    probability: 0.25,
    duration: 4500,
  },
} as const satisfies Record<string, EventConfig>;

type EventKey = keyof typeof EVENT_CONFIG;

// MARK: - Helpers

// Pick random message from pool
const pickRandom = (messages: readonly string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Probability check for whether to show a message
const shouldRespond = (probability: number): boolean => {
  return Math.random() < probability;
};

// MARK: - Hook

/**
 * Hook that returns contextual mascot message based on game events
 * Returns null when no message should be displayed
 * Messages auto-dismiss after MESSAGE_DURATION_MS
 */
export function useGameMascotMessage(): string | null {
  // Subscribe to relevant game state
  const gameStatus = useGameStore((s) => s.gameStatus);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const lastCorrectCell = useGameStore((s) => s.lastCorrectCell);

  // Track previous state for detecting changes
  const prevStateRef = useRef<GameStateSnapshot | null>(null);
  
  // Current displayed message (null = no bubble)
  const [message, setMessage] = useState<string | null>(null);
  
  // Timer ref for auto-dismiss
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to show a message with auto-dismiss
  const showMessage = (msg: string, persist = false, duration = MESSAGE_DURATION_MS) => {
    // Clear any existing timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    
    setMessage(msg);
    
    // Auto-dismiss unless persist is true (for win/lose states)
    if (!persist) {
      dismissTimerRef.current = setTimeout(() => {
        setMessage(null);
      }, duration);
    }
  };

  // Unified message trigger with probability check
  const tryShowMessage = (eventKey: EventKey) => {
    const config = EVENT_CONFIG[eventKey] as EventConfig;
    if (shouldRespond(config.probability)) {
      showMessage(
        pickRandom(config.messages),
        config.persist ?? false,
        config.duration ?? MESSAGE_DURATION_MS
      );
    }
  };

  // Create current state snapshot
  const currentState: GameStateSnapshot = {
    gameStatus,
    mistakeCount,
    hintsUsed,
    lastCorrectCell,
  };

  // Detect events and trigger messages
  useEffect(() => {
    const prevState = prevStateRef.current;

    // New game started from won/lost — clear persisted speech bubble
    if (prevState?.gameStatus && ['won', 'lost'].includes(prevState.gameStatus) && gameStatus === 'playing') {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      setMessage(null);
    }

    // Game just started (first render with playing status)
    if (prevState === null && gameStatus === 'playing') {
      tryShowMessage('gameStart');
    }
    
    // Game won
    if (prevState?.gameStatus !== 'won' && gameStatus === 'won') {
      tryShowMessage('win');
    }
    
    // Game lost
    if (prevState?.gameStatus !== 'lost' && gameStatus === 'lost') {
      tryShowMessage('lose');
    }
    
    // Mistake made (probability-based)
    if (prevState !== null && mistakeCount > prevState.mistakeCount) {
      tryShowMessage('mistake');
    }
    
    // Hint used (always respond)
    if (prevState !== null && hintsUsed > prevState.hintsUsed) {
      tryShowMessage('hint');
    }
    
    // Correct answer (probability-based, exclude hint-triggered fills)
    if (
      prevState !== null &&
      lastCorrectCell !== null &&
      (prevState.lastCorrectCell === null ||
        lastCorrectCell.row !== prevState.lastCorrectCell.row ||
        lastCorrectCell.col !== prevState.lastCorrectCell.col) &&
      hintsUsed === prevState.hintsUsed // Not from a hint
    ) {
      tryShowMessage('correct');
    }
    
    // Update previous state ref
    prevStateRef.current = currentState;
  }, [gameStatus, mistakeCount, hintsUsed, lastCorrectCell]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return message;
}

// Legacy export for testing (can be removed)
export const deriveMessage = () => null;
