// Home screen - main game view
// Matches iOS HomeView.swift + GameView.swift

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';

import { SudokuBoard } from '../../src/components/board';
import { NumberPad, ActionButtons } from '../../src/components/controls';
import { useGameStore } from '../../src/stores/gameStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import { MAX_MISTAKES } from '../../src/engine/types';

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Game header with stats
const GameHeader = () => {
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  return (
    <View style={styles.header}>
      <Text style={styles.difficulty}>{difficulty}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>time</Text>
          <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>mistakes</Text>
          <Text style={[styles.statValue, mistakeCount > 0 && styles.statError]}>
            {mistakeCount}/{MAX_MISTAKES}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>hints</Text>
          <Text style={styles.statValue}>{hintsUsed}</Text>
        </View>
      </View>
    </View>
  );
};

// New game button
const NewGameButton = () => (
  <Link href="/modal" asChild>
    <Pressable style={styles.newGameButton}>
      <Text style={styles.newGameButtonText}>play</Text>
    </Pressable>
  </Link>
);

// Game status overlay
const GameStatusOverlay = () => {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
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
          onPress={() => newGame(difficulty)}
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const isPlaying = gameStatus === 'playing' || gameStatus === 'paused';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>sudokitty</Text>

        {isPlaying ? (
          <>
            {/* Game header */}
            <GameHeader />

            {/* Sudoku board */}
            <View style={styles.boardContainer}>
              <SudokuBoard />
            </View>

            {/* Action buttons */}
            <View style={styles.controlsContainer}>
              <ActionButtons />
            </View>

            {/* Number pad */}
            <View style={styles.numberPadContainer}>
              <NumberPad />
            </View>
          </>
        ) : (
          <>
            {/* Welcome message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                welcome back!{'\n'}ready to play?
              </Text>
            </View>

            {/* New game button */}
            <NewGameButton />
          </>
        )}
      </ScrollView>

      {/* Game status overlay */}
      <GameStatusOverlay />
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
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  difficulty: {
    ...typography.caption,
    color: colors.softOrange,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.captionLight,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  statError: {
    color: colors.errorText,
  },
  boardContainer: {
    marginBottom: spacing.xl,
  },
  controlsContainer: {
    marginBottom: spacing.lg,
  },
  numberPadContainer: {
    marginTop: spacing.md,
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
  newGameButton: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  newGameButtonText: {
    ...typography.button,
    color: colors.cardBackground,
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
