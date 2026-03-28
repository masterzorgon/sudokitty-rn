import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  AnimatedGameView,
  GameHeader,
  ProgressBar,
  GameMascot,
  GameSettingsModal,
  HintModal,
} from "../src/components/game";
import { NumberPad, ActionButtons } from "../src/components/controls";
import { useGameStore } from "../src/stores/gameStore";
import { useGameMascotMessage, useBackgroundMusic } from "../src/hooks";
import { useColors } from "../src/theme/colors";
import { spacing } from "../src/theme";
import { startGameAnimations } from "../src/theme/animations";
import { GAME_LAYOUT } from "../src/constants/layout";
import { Difficulty, getTodayDateString, DAILY_DIFFICULTY_SCHEDULE } from "../src/engine/types";
import { playFeedback } from "../src/utils/feedback";
import { loadSfx, unloadSfx } from "../src/services/sfxService";
import { showRewardedAd } from "../src/services/adService";
import { useIsPremium } from "../src/stores/premiumStore";

export default function GameScreen() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    difficulty: Difficulty;
    isDaily?: string;
    seed?: string;
  }>();

  const isDaily = params.isDaily === "true";
  const difficulty = params.difficulty;

  const gameStatus = useGameStore((s) => s.gameStatus);
  const newGame = useGameStore((s) => s.newGame);
  const newDailyGame = useGameStore((s) => s.newDailyGame);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const isPremium = useIsPremium();
  const navigatedToEndGame = useRef(false);

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const wasPausedBeforeModal = useRef(false);

  const mascotMessage = useGameMascotMessage();

  useBackgroundMusic();

  useEffect(() => {
    loadSfx();
    return () => {
      unloadSfx();
    };
  }, []);

  useEffect(() => {
    if (difficulty) {
      const st = useGameStore.getState();
      const today = getTodayDateString();
      const dayOfWeek = new Date().getDay();
      const dailyDifficulty = DAILY_DIFFICULTY_SCHEDULE[dayOfWeek];

      let skipNewGame = false;
      if (isDaily) {
        skipNewGame =
          st.gameStatus === "playing" &&
          st.isDaily &&
          st.difficulty === dailyDifficulty &&
          st.getProgress() === 0;
      } else {
        skipNewGame =
          st.gameStatus === "playing" &&
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
  }, [difficulty, isDaily, newDailyGame, newGame, startTimer]);

  useEffect(() => {
    const currentStatus = useGameStore.getState().gameStatus;
    if ((currentStatus === "won" || currentStatus === "lost") && !navigatedToEndGame.current) {
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

      if (currentStatus === "won") {
        router.replace({ pathname: "/end-game", params: endGameParams });
      } else {
        router.push({ pathname: "/end-game", params: endGameParams });
      }
    } else if (currentStatus === "playing") {
      navigatedToEndGame.current = false;
    }
  }, [gameStatus, isDaily, router]);

  const handleGoBack = useCallback(() => {
    playFeedback("tap");
    if (gameStatus === "playing") {
      pauseGame();
    }
    router.back();
  }, [gameStatus, pauseGame, router]);

  const openSettingsModal = useCallback(() => {
    playFeedback("tap");
    wasPausedBeforeModal.current = gameStatus === "paused";
    if (gameStatus === "playing") {
      pauseGame();
    }
    setIsSettingsModalVisible(true);
  }, [gameStatus, pauseGame]);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalVisible(false);
    if (!wasPausedBeforeModal.current && gameStatus === "paused") {
      resumeGame();
    }
  }, [gameStatus, resumeGame]);

  const handleHintUnavailable = useCallback(async () => {
    const earned = await showRewardedAd();
    if (!earned) return;
    const { addPaidHints, useHint: applyHint } = useGameStore.getState();
    addPaidHints(1);
    applyHint();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]}>
      <View style={styles.topZone}>
        <ProgressBar onBack={handleGoBack} onSettingsPress={openSettingsModal} />
      </View>

      <View style={styles.flexSpacer} />

      <View style={styles.mascotZone}>
        <GameMascot message={mascotMessage} />
      </View>

      <GameHeader />

      <View style={styles.gridContainer}>
        <AnimatedGameView animateEntrance={!!difficulty} />
      </View>

      <View style={styles.bottomZone}>
        <View style={styles.controlsContainer}>
          <Animated.View entering={FadeIn.duration(startGameAnimations.controlsFadeIn.duration)}>
            <ActionButtons onHintUnavailable={!isPremium ? handleHintUnavailable : undefined} />
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(100).duration(startGameAnimations.controlsFadeIn.duration)}
          >
            <NumberPad />
          </Animated.View>
        </View>
      </View>

      <GameSettingsModal visible={isSettingsModalVisible} onClose={closeSettingsModal} />

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
    width: "100%",
    maxWidth: "80%",
    alignSelf: "center",
  },
  gridContainer: {
    alignItems: "center",
  },
  bottomZone: {
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.md,
  },
  controlsContainer: {
    width: "100%",
    gap: spacing.md,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
});
