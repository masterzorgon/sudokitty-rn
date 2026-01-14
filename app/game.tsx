// Game screen - active game view with back navigation
// Separate from tabs for clean navigation experience

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnimatedGameView, GameHeader, ProgressBar } from '../src/components/game';
import { NumberPad, ActionButtons } from '../src/components/controls';
import { useGameStore } from '../src/stores/gameStore';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius, shadows } from '../src/theme';
import { startGameAnimations } from '../src/theme/animations';
import { Difficulty } from '../src/engine/types';

// Game status overlay
const GameStatusOverlay = ({
  onPlayAgain,
  onGoHome,
}: {
  onPlayAgain: (difficulty: Difficulty) => void;
  onGoHome: () => void;
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
        <View style={styles.overlayButtons}>
          <Pressable
            style={styles.overlayButton}
            onPress={() => onPlayAgain(difficulty)}
          >
            <Text style={styles.overlayButtonText}>play again</Text>
          </Pressable>
          <Pressable
            style={styles.overlayButtonSecondary}
            onPress={onGoHome}
          >
            <Text style={styles.overlayButtonTextSecondary}>home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ difficulty: Difficulty }>();
  
  const tick = useGameStore((s) => s.tick);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize game on mount
  useEffect(() => {
    if (params.difficulty) {
      newGame(params.difficulty);
      setTimeout(() => {
        startTimer();
      }, startGameAnimations.controlsDelay);
    }
  }, []);

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

  // Handle back button - pause game instead of resetting
  const handleGoBack = useCallback(() => {
    // Only pause if game is still in progress
    if (gameStatus === 'playing') {
      pauseGame();
    }
    router.back();
  }, [gameStatus, pauseGame, router]);

  // Handle going home after game over - reset game state
  const handleGoHome = useCallback(() => {
    resetGame();
    router.back();
  }, [resetGame, router]);

  const handlePlayAgain = useCallback(
    (difficulty: Difficulty) => {
      newGame(difficulty);
      setTimeout(() => {
        startTimer();
      }, startGameAnimations.controlsDelay);
    },
    [newGame, startTimer]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP ZONE - Progress bar with back button */}
      <View style={styles.topZone}>
        <ProgressBar onBack={handleGoBack} />
      </View>

      {/* MIDDLE ZONE - Flex space + game content + flex space */}
      <View style={styles.middleZone}>
        <View style={styles.flexSpacer} />

        {/* Game content block: stats row + grid */}
        <View style={styles.gameContent}>
          <GameHeader />
          <View style={styles.gridContainer}>
            <AnimatedGameView />
          </View>
        </View>

        <View style={styles.flexSpacer} />
      </View>

      {/* BOTTOM ZONE - Controls */}
      <View style={styles.bottomZone}>
        <Animated.View entering={FadeIn.duration(startGameAnimations.controlsFadeIn.duration)}>
          <ActionButtons />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100).duration(startGameAnimations.controlsFadeIn.duration)}>
          <NumberPad />
        </Animated.View>
      </View>

      {/* Game status overlay */}
      <GameStatusOverlay onPlayAgain={handlePlayAgain} onGoHome={handleGoHome} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topZone: {
    paddingTop: spacing.sm,
  },
  middleZone: {
    flex: 1,
  },
  flexSpacer: {
    flex: 1,
  },
  gameContent: {
    alignItems: 'center',
  },
  gridContainer: {
    marginTop: spacing.md,
  },
  bottomZone: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
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
  overlayButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overlayButton: {
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  overlayButtonText: {
    ...typography.button,
    color: colors.cardBackground,
  },
  overlayButtonSecondary: {
    backgroundColor: colors.cream,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gridLine,
  },
  overlayButtonTextSecondary: {
    ...typography.button,
    color: colors.textSecondary,
  },
});
