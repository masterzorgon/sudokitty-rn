// Game screen - active game view with back navigation
// Separate from tabs for clean navigation experience

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import {
  AnimatedGameView,
  GameHeader,
  ProgressBar,
  GameMascot,
  GameSettingsModal,
} from '../src/components/game';
import { NumberPad, ActionButtons } from '../src/components/controls';
import { useGameStore } from '../src/stores/gameStore';
import { useDailyChallengeStore } from '../src/stores/dailyChallengeStore';
import { useGameMascotMessage } from '../src/hooks';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius, shadows } from '../src/theme';
import { startGameAnimations } from '../src/theme/animations';
import { GAME_LAYOUT } from '../src/constants/layout';
import { Difficulty, DAILY_MOCHI_POINTS } from '../src/engine/types';
import { triggerHaptic, ImpactFeedbackStyle } from '../src/utils/haptics';

// Game status overlay
const GameStatusOverlay = ({
  onPlayAgain,
  onGoHome,
  isDaily,
  mochiPointsEarned,
}: {
  onPlayAgain: (difficulty: Difficulty) => void;
  onGoHome: () => void;
  isDaily: boolean;
  mochiPointsEarned: number;
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
            ? isDaily
              ? `you earned ${mochiPointsEarned} mochi points!`
              : 'you solved the puzzle!'
            : isDaily
              ? 'keep trying - you can do it!'
              : 'too many mistakes... try again?'}
        </Text>
        <View style={styles.overlayButtons}>
          {isDaily && isWon ? (
            <Pressable style={styles.overlayButton} onPress={onGoHome}>
              <Text style={styles.overlayButtonText}>back to daily</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.overlayButton}
                onPress={() => onPlayAgain(difficulty)}
              >
                <Text style={styles.overlayButtonText}>
                  {isDaily ? 'try again' : 'play again'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.overlayButtonSecondary}
                onPress={onGoHome}
              >
                <Text style={styles.overlayButtonTextSecondary}>
                  {isDaily ? 'back to daily' : 'home'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    difficulty: Difficulty;
    isDaily?: string;
    seed?: string;
  }>();

  const isDaily = params.isDaily === 'true';
  const difficulty = params.difficulty;
  const mochiPointsEarned = isDaily ? DAILY_MOCHI_POINTS[difficulty] : 0;

  const tick = useGameStore((s) => s.tick);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Daily challenge store
  const completeChallenge = useDailyChallengeStore((s) => s.completeChallenge);
  const isTodayCompleted = useDailyChallengeStore((s) => s.isTodayCompleted);
  const dailyCompletedRef = useRef(false);

  // Settings modal state
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const wasPausedBeforeModal = useRef(false);

  // Mascot message hook
  const mascotMessage = useGameMascotMessage();

  // Initialize game on mount
  useEffect(() => {
    if (difficulty) {
      newGame(difficulty);
      setTimeout(() => {
        startTimer();
      }, startGameAnimations.controlsDelay);
    }
  }, []);

  // Handle daily challenge completion
  useEffect(() => {
    if (isDaily && gameStatus === 'won' && !dailyCompletedRef.current && !isTodayCompleted()) {
      dailyCompletedRef.current = true;
      completeChallenge();
    }
  }, [gameStatus, isDaily, completeChallenge, isTodayCompleted]);

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

  // Settings modal handlers with pause state preservation
  const openSettingsModal = useCallback(() => {
    triggerHaptic(ImpactFeedbackStyle.Light);
    wasPausedBeforeModal.current = gameStatus === 'paused';
    if (gameStatus === 'playing') {
      pauseGame();
    }
    setIsSettingsModalVisible(true);
  }, [gameStatus, pauseGame]);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalVisible(false);
    // Only resume if game wasn't already paused before opening modal
    if (!wasPausedBeforeModal.current && gameStatus === 'paused') {
      resumeGame();
    }
  }, [gameStatus, resumeGame]);

  // Settings button for progress bar trailing action
  const settingsButton = (
    <Pressable
      onPress={openSettingsModal}
      hitSlop={12}
      style={styles.settingsButton}
    >
      <Feather name="settings" size={24} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP ZONE - Progress bar with back button and settings */}
      <View style={styles.topZone}>
        <ProgressBar onBack={handleGoBack} trailingAction={settingsButton} />
      </View>

      {/* HEADER ZONE - Game stats */}
      <View style={styles.headerZone}>
        <GameHeader />
      </View>

      {/* MASCOT ZONE - Cat with contextual speech bubble */}
      <GameMascot message={mascotMessage} />

      {/* MIDDLE ZONE - Grid (edge-to-edge) */}
      <View style={styles.middleZone}>
        <View style={styles.flexSpacer} />

        {/* Grid container - NO horizontal padding for edge-to-edge */}
        <View style={styles.gridContainer}>
          <AnimatedGameView />
        </View>

        <View style={styles.minimalSpacer} />
      </View>

      {/* BOTTOM ZONE - Controls */}
      <View style={styles.bottomZone}>
        <View style={styles.controlsContainer}>
          <Animated.View entering={FadeIn.duration(startGameAnimations.controlsFadeIn.duration)}>
            <ActionButtons />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(100).duration(startGameAnimations.controlsFadeIn.duration)}>
            <NumberPad />
          </Animated.View>
        </View>
      </View>

      {/* Game status overlay */}
      <GameStatusOverlay
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        isDaily={isDaily}
        mochiPointsEarned={mochiPointsEarned}
      />

      {/* Settings modal */}
      <GameSettingsModal
        visible={isSettingsModalVisible}
        onClose={closeSettingsModal}
      />
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
  headerZone: {
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  middleZone: {
    flex: 1,
  },
  flexSpacer: {
    flex: 1,
  },
  minimalSpacer: {
    height: spacing.md,
  },
  gridContainer: {
    // NO horizontal padding - grid spans edge-to-edge
    alignItems: 'center',
  },
  bottomZone: {
    paddingBottom: spacing.md,
  },
  controlsContainer: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  settingsButton: {
    padding: 4,
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
