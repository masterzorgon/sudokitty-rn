// Progress bar component - displays game completion progress
// Shows a capsule-shaped bar with fill based on cells completed

import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { PauseModal } from './PauseModal';

interface ProgressBarProps {
  onBack: () => void;
}

export const ProgressBar = ({ onBack }: ProgressBarProps) => {
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const getProgress = useGameStore((s) => s.getProgress);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const progress = getProgress();
  const percentage = Math.round(progress * 100);

  const handlePause = () => {
    pauseGame();
    setIsPauseModalVisible(true);
  };

  const handleResume = () => {
    setIsPauseModalVisible(false);
    resumeGame();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${percentage}%` }]} />
        </View>
      </View>

      <Text style={styles.percentage}>{percentage}%</Text>

      <Pressable style={styles.pauseButton} onPress={handlePause}>
        <Ionicons name="pause" size={24} color={colors.textSecondary} />
      </Pressable>

      <PauseModal visible={isPauseModalVisible} onResume={handleResume} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  barContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  barBackground: {
    height: 12,
    backgroundColor: colors.gridLine,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.softOrange,
    borderRadius: borderRadius.full,
  },
  percentage: {
    ...typography.caption,
    color: colors.textLight,
    minWidth: 36,
    textAlign: 'right',
    fontSize: 20,
  },
  pauseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
