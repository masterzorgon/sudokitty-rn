// Progress bar component - displays game completion progress
// Shows a capsule-shaped bar with fill based on cells completed
// Uses animated rolling numbers for percentage display

import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, useProgress } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { PauseModal } from './PauseModal';
import { RollingNumber } from '../ui';

interface ProgressBarProps {
  onBack: () => void;
}

export const ProgressBar = ({ onBack }: ProgressBarProps) => {
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const progress = useProgress();
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
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

      <View style={styles.percentageContainer}>
        <RollingNumber
          value={percentage}
          fontSize={20}
          color={colors.textLight}
          textStyle={typography.caption}
          maxDigits={3}
        />
        <Text style={styles.percentSign}>%</Text>
      </View>

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
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  percentSign: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 20,
    marginLeft: 1,
  },
  pauseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
