// Pause modal - displays game summary when paused
// Shows mistakes, hints, time, and difficulty

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';
import { MAX_MISTAKES } from '../../engine/types';

interface PauseModalProps {
  visible: boolean;
  onResume: () => void;
}

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Capitalize first letter
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const PauseModal = ({ visible, onResume }: PauseModalProps) => {
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons
            name="pause-circle"
            size={48}
            color={colors.softOrange}
            style={styles.icon}
          />
          
          <Text style={styles.title}>Game Paused</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{capitalize(difficulty)}</Text>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="close-circle-outline" size={20} color={mistakeCount > 0 ? colors.errorText : colors.textSecondary} />
                <Text style={styles.statLabel}>Mistakes</Text>
                <Text style={[styles.statValue, mistakeCount > 0 && styles.errorValue]}>
                  {mistakeCount}/{MAX_MISTAKES}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="bulb-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Hints</Text>
                <Text style={styles.statValue}>{hintsUsed}</Text>
              </View>
            </View>
          </View>
          
          <Pressable style={styles.resumeButton} onPress={onResume}>
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.resumeText}>Resume</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    ...shadows.large,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statValue: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  errorValue: {
    color: colors.errorText,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  resumeText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
