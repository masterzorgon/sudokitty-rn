// Home screen - main game view with animated transitions
// Matches iOS HomeView.swift + GameView.swift

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  AnimatedStartButton,
  InlineDifficultySelector,
  AnimatedGameView,
} from '../../src/components/game';
import { useGameStore } from '../../src/stores/gameStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import { startGameAnimations } from '../../src/theme/animations';
import { Difficulty } from '../../src/engine/types';

// Animation phases for start game flow
type AnimationPhase = 'idle' | 'selecting' | 'transitioning' | 'playing';

// Game status overlay
const GameStatusOverlay = ({
  onPlayAgain,
}: {
  onPlayAgain: (difficulty: Difficulty) => void;
}) => {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const difficulty = useGameStore((s) => s.difficulty);

  if (gameStatus !== 'won' && gameStatus !== 'lost') {
    return null;
  }

  const isWon = gameStatus === 'won';

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <Text style={styles.overlayTitle}>
          {isWon ? 'purrfect!' : 'game over'}
        </Text>
        <Text style={styles.overlayMessage}>
          {isWon
            ? 'you solved the puzzle!'
            : 'too many mistakes... try again?'}
        </Text>
        <Pressable
          style={styles.overlayButton}
          onPress={() => onPlayAgain(difficulty)}
        >
          <Text style={styles.overlayButtonText}>play again</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const tick = useGameStore((s) => s.tick);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const newGame = useGameStore((s) => s.newGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation phase state
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [controlsReady, setControlsReady] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, tick]);

  // Sync phase with game status
  useEffect(() => {
    if (gameStatus === 'idle' && phase !== 'idle' && phase !== 'selecting') {
      setPhase('idle');
      setControlsReady(false);
    }
  }, [gameStatus, phase]);

  // Handle start game button press
  const handleStartGame = useCallback(() => {
    setPhase('selecting');
  }, []);

  // Handle back from difficulty selection
  const handleBack = useCallback(() => {
    setPhase('idle');
  }, []);

  // Handle difficulty selection
  const handleSelectDifficulty = useCallback(
    (difficulty: Difficulty) => {
      // Generate new game
      newGame(difficulty);

      // Transition to playing phase
      setPhase('transitioning');

      // Schedule controls to appear after board animation
      setTimeout(() => {
        setControlsReady(true);
        // Start timer after all animations complete
        startTimer();
        setPhase('playing');
      }, startGameAnimations.controlsDelay);
    },
    [newGame, startTimer]
  );

  // Handle play again from overlay
  const handlePlayAgain = useCallback(
    (difficulty: Difficulty) => {
      // Reset animation state
      setControlsReady(false);
      setPhase('transitioning');

      // Generate new game
      newGame(difficulty);

      // Schedule controls to appear after board animation
      setTimeout(() => {
        setControlsReady(true);
        startTimer();
        setPhase('playing');
      }, startGameAnimations.controlsDelay);
    },
    [newGame, startTimer]
  );

  const isPlaying = gameStatus === 'playing' || gameStatus === 'paused';
  const showGame = phase === 'transitioning' || phase === 'playing' || isPlaying;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>sudokitty</Text>

        <Animated.View layout={LinearTransition}>
          {/* Phase: Idle - Show welcome + start button */}
          {phase === 'idle' && !isPlaying && (
            <>
              {/* Welcome message */}
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  welcome back!{'\n'}ready to play?
                </Text>
              </View>

              {/* Animated start button */}
              <AnimatedStartButton
                onPress={handleStartGame}
                exiting={FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
              />
            </>
          )}

          {/* Phase: Selecting - Show difficulty options */}
          {phase === 'selecting' && (
            <InlineDifficultySelector
              onSelect={handleSelectDifficulty}
              onBack={handleBack}
            />
          )}

          {/* Phase: Playing - Show game UI with animations */}
          {showGame && phase !== 'idle' && phase !== 'selecting' && (
            <AnimatedGameView controlsReady={controlsReady} />
          )}
        </Animated.View>
      </ScrollView>

      {/* Game status overlay */}
      <GameStatusOverlay onPlayAgain={handlePlayAgain} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  welcomeText: {
    ...typography.title,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 36,
  },
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.large,
  },
  overlayTitle: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  overlayMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  overlayButton: {
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  overlayButtonText: {
    ...typography.button,
    color: colors.cardBackground,
  },
});
