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
  HintModal,
  HintAdSheet,
} from '../src/components/game';
import { NumberPad, ActionButtons } from '../src/components/controls';
import { useGameStore } from '../src/stores/gameStore';
import { useGameMascotMessage, useBackgroundMusic } from '../src/hooks';
import { useColors } from '../src/theme/colors';
import { spacing } from '../src/theme';
import { startGameAnimations } from '../src/theme/animations';
import { GAME_LAYOUT } from '../src/constants/layout';
import { Difficulty, getTodayDateString, DAILY_DIFFICULTY_SCHEDULE } from '../src/engine/types';
import { playFeedback } from '../src/utils/feedback';
import { loadSfx, unloadSfx } from '../src/services/sfxService';
import { useIsPremium } from '../src/stores/premiumStore';

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

  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
  const newDailyGame = useGameStore((s) => s.newDailyGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const isPremium = useIsPremium();
  const navigatedToEndGame = useRef(false);

  // Settings modal state
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Hint ad sheet state
  const [hintAdSheetVisible, setHintAdSheetVisible] = useState(false);
  const wasPausedBeforeModal = useRef(false);

  // Mascot message hook
  const mascotMessage = useGameMascotMessage();

  // Background music
  useBackgroundMusic();

  // SFX lifecycle: load on mount, unload on unmount
  useEffect(() => {
    loadSfx();
    return () => {
      unloadSfx();
    };
  }, []);

  // Initialize game on mount
  useEffect(() => {
    if (difficulty) {
      const st = useGameStore.getState();
      const today = getTodayDateString();
      const dayOfWeek = new Date().getDay();
      const dailyDifficulty = DAILY_DIFFICULTY_SCHEDULE[dayOfWeek];

      let skipNewGame = false;
      if (isDaily) {
        skipNewGame =
          st.gameStatus === 'playing' &&
          st.isDaily &&
          st.difficulty === dailyDifficulty &&
          st.getProgress() === 0;
      } else {
        skipNewGame =
          st.gameStatus === 'playing' &&
          !st.isDaily &&
          st.difficulty === difficulty &&
          st.getProgress() === 0;
      }

      if (!skipNewGame) {
        if (isDaily) {
          newDailyGame(today, dailyDifficulty);
        } else {
          newGame(difficulty);
        }
      }
      setTimeout(() => {
        startTimer();
      }, startGameAnimations.controlsDelay);
    }
  }, []);

  // Navigate to end-game screen when game ends
  useEffect(() => {
    const currentStatus = useGameStore.getState().gameStatus;
    if ((currentStatus === 'won' || currentStatus === 'lost') && !navigatedToEndGame.current) {
      navigatedToEndGame.current = true;
      const {
        difficulty: d,
        timeElapsed,
        mistakeCount,
        hintsUsed,
        continueCount,
        getProgress,
        xpEarnedThisGame,
      } = useGameStore.getState();
      const progress = getProgress();
      const endGameParams = {
        status: currentStatus,
        difficulty: d,
        timeElapsed: String(timeElapsed),
        mistakeCount: String(mistakeCount),
        hintsUsed: String(hintsUsed),
        continueCount: String(continueCount),
        isDaily: String(isDaily),
        progress: String(Math.round(progress * 100)),
        xpEarned: String(xpEarnedThisGame),
      };

      if (currentStatus === 'won') {
        router.replace({ pathname: '/end-game', params: endGameParams });
      } else {
        router.push({ pathname: '/end-game', params: endGameParams });
      }
    } else if (currentStatus === 'playing') {
      navigatedToEndGame.current = false;
    }
  }, [gameStatus, isDaily, router]);

  // Handle back button - pause game instead of resetting
  const handleGoBack = useCallback(() => {
    playFeedback('tap');
    // Only pause if game is still in progress
    if (gameStatus === 'playing') {
      pauseGame();
    }
    router.back();
  }, [gameStatus, pauseGame, router]);

  // Settings modal handlers with pause state preservation
  const openSettingsModal = useCallback(() => {
    playFeedback('tap');
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
        <AnimatedGameView animateEntrance={!!difficulty} />
      </View>

      {/* BOTTOM ZONE - Controls */}
      <View style={styles.bottomZone}>
        <View style={styles.controlsContainer}>
          <Animated.View entering={FadeIn.duration(startGameAnimations.controlsFadeIn.duration)}>
            <ActionButtons
              onHintUnavailable={!isPremium ? () => setHintAdSheetVisible(true) : undefined}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(100).duration(startGameAnimations.controlsFadeIn.duration)}>
            <NumberPad />
          </Animated.View>
        </View>
      </View>

      {/* Settings modal */}
      <GameSettingsModal
        visible={isSettingsModalVisible}
        onClose={closeSettingsModal}
      />

      {/* Hint explanation modal */}
      <HintModal />

      {/* Hint ad sheet for non-premium users */}
      <HintAdSheet
        visible={hintAdSheetVisible}
        onClose={() => setHintAdSheetVisible(false)}
      />
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
});
