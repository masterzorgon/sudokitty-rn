// Game screen - active game view with back navigation
// Separate from tabs for clean navigation experience

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  AnimatedGameView,
  GameHeader,
  ProgressBar,
  GameMascot,
  GameSettingsModal,
  GameStatusSheet,
  HintModal,
} from '../src/components/game';
import { NumberPad, ActionButtons } from '../src/components/controls';
import { useGameStore } from '../src/stores/gameStore';
import { useDailyChallengeStore } from '../src/stores/dailyChallengeStore';
import { useGameMascotMessage, useBackgroundMusic } from '../src/hooks';
import { colors, useColors } from '../src/theme/colors';
import { spacing, borderRadius } from '../src/theme';
import { startGameAnimations } from '../src/theme/animations';
import { GAME_LAYOUT } from '../src/constants/layout';
import { Difficulty } from '../src/engine/types';
import { triggerHaptic, ImpactFeedbackStyle } from '../src/utils/haptics';

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

  // Background music
  useBackgroundMusic();

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
    continueGame();
  }, [continueGame]);

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

      {/* Game status bottom sheet */}
      <GameStatusSheet
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        onContinue={handleContinue}
        onGetFishies={() => router.push('/(tabs)/store')}
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
