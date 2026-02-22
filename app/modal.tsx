// Difficulty selection modal
// Matches iOS DifficultyPickerSheet.swift

import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

import { useGameStore } from '../src/stores/gameStore';
import { colors, useColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { Difficulty, DIFFICULTY_CONFIG } from '../src/engine/types';

interface DifficultyButtonProps {
  difficulty: Difficulty;
  onPress: (difficulty: Difficulty) => void;
}

const DifficultyButton = ({ difficulty, onPress }: DifficultyButtonProps) => {
  const c = useColors();
  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.difficultyButton,
        pressed && { backgroundColor: c.cellSelected, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => onPress(difficulty)}
    >
      <Text style={styles.difficultyName}>{config.name}</Text>
      <Text style={styles.difficultyComment}>{config.mochiComment}</Text>
    </Pressable>
  );
};

export default function ModalScreen() {
  const c = useColors();
  const newGame = useGameStore((s) => s.newGame);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    newGame(difficulty);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.cream }]}>
      <Text style={styles.title}>choose your challenge</Text>

      <View style={styles.buttonContainer}>
        <DifficultyButton difficulty="easy" onPress={handleSelectDifficulty} />
        <DifficultyButton difficulty="medium" onPress={handleSelectDifficulty} />
        <DifficultyButton difficulty="hard" onPress={handleSelectDifficulty} />
        <DifficultyButton difficulty="expert" onPress={handleSelectDifficulty} />
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.headline,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  difficultyButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  difficultyButtonPressed: {},
  difficultyName: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  difficultyComment: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
