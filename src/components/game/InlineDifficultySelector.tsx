// Inline difficulty selection (replaces modal)
// Matches reference animation-demos flow with staggered button animations

import React, { useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { startGameAnimations } from '../../theme/animations';
import { Difficulty, DIFFICULTY_CONFIG } from '../../engine/types';
import { getFishiesRangeLabel } from '../../constants/economy';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DifficultyButtonProps {
  difficulty: Difficulty;
  onPress: () => void;
  index: number;
}

const DifficultyButton = ({ difficulty, onPress, index }: DifficultyButtonProps) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, startGameAnimations.buttonSpring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, startGameAnimations.buttonSpring);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * startGameAnimations.difficultyButtonStagger).duration(300)}
    >
      <AnimatedPressable
        style={[styles.difficultyButton, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.difficultyName}>{config.name}</Text>
        <Text style={styles.difficultyComment}>earn {getFishiesRangeLabel(difficulty)} fishies</Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

interface InlineDifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack?: () => void;
  entering?: typeof FadeIn;
  exiting?: typeof FadeOut;
}

export const InlineDifficultySelector = ({
  onSelect,
  onBack,
  entering,
  exiting,
}: InlineDifficultySelectorProps) => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

  return (
    <Animated.View
      entering={entering || FadeIn.duration(startGameAnimations.difficultyFadeIn.duration)}
      exiting={exiting || FadeOut.duration(startGameAnimations.difficultyFadeOut.duration)}
      style={styles.container}
    >
      <Text style={styles.title}>choose your challenge</Text>

      <View style={styles.buttonContainer}>
        {difficulties.map((difficulty, index) => (
          <DifficultyButton
            key={difficulty}
            difficulty={difficulty}
            index={index}
            onPress={() => onSelect(difficulty)}
          />
        ))}
      </View>

      {onBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>back</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  difficultyButton: {
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  difficultyName: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  difficultyComment: {
    ...typography.caption,
    color: colors.textLight,
  },
  backButton: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
