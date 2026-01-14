// Animated game view - orchestrates board and controls animations
// Handles staggered entrance of game UI components

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SudokuBoard } from '../board';
import { NumberPad, ActionButtons } from '../controls';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { startGameAnimations } from '../../theme/animations';
import { MAX_MISTAKES } from '../../engine/types';

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

interface AnimatedGameViewProps {
  controlsReady: boolean;
}

export const AnimatedGameView = ({ controlsReady }: AnimatedGameViewProps) => {
  return (
    <>
      {/* Game header - appears with board */}
      <Animated.View entering={FadeIn.duration(400)}>
        <GameHeader />
      </Animated.View>

      {/* Sudoku board with cascade animation */}
      <View style={styles.boardContainer}>
        <SudokuBoard animateEntrance />
      </View>

      {/* Controls - appear after board animation */}
      {controlsReady && (
        <>
          <Animated.View
            entering={FadeIn.duration(startGameAnimations.controlsFadeIn.duration)}
            style={styles.controlsContainer}
          >
            <ActionButtons />
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(100).duration(startGameAnimations.controlsFadeIn.duration)}
            style={styles.numberPadContainer}
          >
            <NumberPad />
          </Animated.View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
});
