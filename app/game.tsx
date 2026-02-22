// Game screen - active game view with back navigation
// Separate from tabs for clean navigation experience

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  AnimatedGameView,
  GameHeader,
  ProgressBar,
  GameMascot,
  GameSettingsModal,
  HintModal,
} from '../src/components/game';
import { NumberPad, ActionButtons } from '../src/components/controls';
import { useGameStore } from '../src/stores/gameStore';
import { useDailyChallengeStore } from '../src/stores/dailyChallengeStore';
import { useGameMascotMessage } from '../src/hooks';
import { colors, useColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { startGameAnimations } from '../src/theme/animations';
import { GAME_LAYOUT } from '../src/constants/layout';
import {
  Difficulty,
  DAILY_MOCHI_POINTS,
  CONTINUE_COST,
  calculateMochiReward,
} from '../src/engine/types';
import { useTotalMochiPoints } from '../src/stores/dailyChallengeStore';
import { showRewardedAd } from '../src/lib/rewardedAds';
import { triggerHaptic, ImpactFeedbackStyle } from '../src/utils/haptics';

// Game status overlay
const GameStatusOverlay = ({
  onPlayAgain,
  onGoHome,
  onContinue,
  isDaily,
}: {
  onPlayAgain: (difficulty: Difficulty) => void;
  onGoHome: () => void;
  onContinue: () => void;
  isDaily: boolean;
}) => {
  const c = useColors();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const canContinue = useGameStore((s) => s.canContinue);
  const totalMochis = useTotalMochiPoints();

  if (gameStatus !== 'won' && gameStatus !== 'lost') {
    return null;
  }

  const isWon = gameStatus === 'won';
  const mochiPointsEarned = isWon
    ? isDaily
      ? DAILY_MOCHI_POINTS[difficulty]
      : calculateMochiReward(difficulty, timeElapsed)
    : 0;

  const continueCost = CONTINUE_COST[difficulty];
  const canAfford = totalMochis >= continueCost;
  const showContinue = !isWon && canContinue();

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <Text style={styles.overlayTitle}>
          {isWon ? 'purrfect!' : 'game over'}
        </Text>
        <Text style={styles.overlayMessage}>
          {isWon
            ? `you earned ${mochiPointsEarned} mochis!`
            : 'too many mistakes...'}
        </Text>

        {showContinue && (
          <View style={styles.continueSection}>
            <Text style={styles.mochiBalance}>{totalMochis} mochis</Text>
            {canAfford ? (
              <Pressable
                style={[styles.overlayButton, { backgroundColor: '#F5C542' }]}
                onPress={onContinue}
              >
                <Text style={[styles.overlayButtonText, { color: '#3D2E00' }]}>
                  continue ({continueCost} mochis)
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.overlayButton, { backgroundColor: '#F5C542' }]}
                onPress={async () => {
                  const earned = await showRewardedAd();
                  if (earned) onContinue();
                }}
              >
                <Text style={[styles.overlayButtonText, { color: '#3D2E00' }]}>
                  watch ad to continue
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.overlayButtons}>
          {isDaily && isWon ? (
            <Pressable style={[styles.overlayButton, { backgroundColor: c.accent }]} onPress={onGoHome}>
              <Text style={styles.overlayButtonText}>back to daily</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.overlayButton, { backgroundColor: c.accent }]}
                onPress={() => onPlayAgain(difficulty)}
              >
                <Text style={styles.overlayButtonText}>
                  {isDaily ? 'try again' : 'play again'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.overlayButtonSecondary, { backgroundColor: c.cream }]}
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
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    difficulty: Difficulty;
    isDaily?: string;
    seed?: string;
  }>();

  const isDaily = params.isDaily === 'true';
  const difficulty = params.difficulty;

  const tick = useGameStore((s) => s.tick);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const spendMochis = useDailyChallengeStore((s) => s.spendMochis);
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
      if (isDaily) {
        useGameStore.setState({ isDaily: true });
      }
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

  const handleContinue = useCallback(() => {
    const cost = CONTINUE_COST[difficulty];
    const spent = spendMochis(cost, 'continue');
    if (spent) {
      continueGame();
    }
  }, [difficulty, spendMochis, continueGame]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]}>
      {/* TOP ZONE - Progress bar with back button and settings */}
      <View style={styles.topZone}>
        <ProgressBar onBack={handleGoBack} onSettingsPress={openSettingsModal} />
      </View>

      {/* Flex spacer to push mascot+grid down toward controls */}
      <View style={styles.flexSpacer} />

      {/* MASCOT ZONE - Cat with contextual speech bubble (directly above stats bar) */}
      <View style={styles.mascotZone}>
        <GameMascot message={mascotMessage} />
      </View>

      {/* STATS BAR - Time | Mistakes | Hints (directly below mascot, above grid) */}
      <GameHeader />

      {/* GRID ZONE - Game board (edge-to-edge) */}
      <View style={styles.gridContainer}>
        <AnimatedGameView />
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
        onContinue={handleContinue}
        isDaily={isDaily}
      />

      {/* Settings modal */}
      <GameSettingsModal
        visible={isSettingsModalVisible}
        onClose={closeSettingsModal}
      />

      {/* Hint explanation modal */}
      <HintModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topZone: {
    paddingTop: spacing.sm,
  },
  flexSpacer: {
    flex: 1,
  },
  mascotZone: {
    width: '100%',
    maxWidth: '80%',
    alignSelf: 'center',
  },
  gridContainer: {
    // NO horizontal padding - grid spans edge-to-edge
    alignItems: 'center',
  },
  bottomZone: {
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.md,
  },
  controlsContainer: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
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
  continueSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  mochiBalance: {
    ...typography.caption,
    color: colors.textLight,
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overlayButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  overlayButtonText: {
    ...typography.button,
    color: colors.cardBackground,
  },
  overlayButtonSecondary: {
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
  // DEV ONLY: debug animation triggers
  debugBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  debugButton: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'Pally-Medium',
    color: colors.textLight,
  },
});
