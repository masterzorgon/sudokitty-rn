// Home screen - welcome view with difficulty selection
// Navigates to game screen when starting a game

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  AnimatedStartButton,
  InlineDifficultySelector,
  ContinueGameButton,
} from '../../src/components/game';
import { useGameStore, useHasResumableGame } from '../../src/stores/gameStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import { startGameAnimations } from '../../src/theme/animations';
import { Difficulty } from '../../src/engine/types';

// Animation phases for start game flow
type AnimationPhase = 'idle' | 'selecting';

export default function HomeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const hasResumableGame = useHasResumableGame();
  const resumeGame = useGameStore((s) => s.resumeGame);
  const startTimer = useGameStore((s) => s.startTimer);

  // Handle continue game - resume existing game
  const handleContinueGame = useCallback(() => {
    resumeGame();
    router.push('/game');
    // Start timer after navigation
    setTimeout(() => {
      startTimer();
    }, startGameAnimations.controlsDelay);
  }, [resumeGame, router, startTimer]);

  // Handle start game button press
  const handleStartGame = useCallback(() => {
    setPhase('selecting');
  }, []);

  // Handle back from difficulty selection
  const handleBack = useCallback(() => {
    setPhase('idle');
  }, []);

  // Handle difficulty selection - navigate to game screen
  const handleSelectDifficulty = useCallback(
    (difficulty: Difficulty) => {
      router.push({
        pathname: '/game',
        params: { difficulty },
      });
      // Reset phase after navigation
      setTimeout(() => setPhase('idle'), 300);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP ZONE - Header area */}
      <View style={styles.topZone}>
        <Text style={styles.title}>sudokitty</Text>
      </View>

      {/* MIDDLE ZONE - Content area */}
      <View style={styles.middleZone}>
        <Animated.View style={styles.middleContent} layout={LinearTransition}>
          {/* Phase: Idle - Show welcome + buttons */}
          {phase === 'idle' && (
            <>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  {hasResumableGame
                    ? 'welcome back!\npick up where you left off?'
                    : 'welcome back!\nready to play?'}
                </Text>
              </View>

              {/* Continue game button - only shows if there's a paused game */}
              {hasResumableGame && (
                <ContinueGameButton onPress={handleContinueGame} />
              )}

              <AnimatedStartButton
                onPress={handleStartGame}
                label={hasResumableGame ? 'new game' : 'start game'}
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
        </Animated.View>
      </View>

      {/* BOTTOM ZONE - Empty placeholder for layout consistency */}
      <View style={styles.bottomZone} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topZone: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  middleZone: {
    flex: 1,
  },
  middleContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 80,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.title,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 36,
  },
  bottomZone: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
