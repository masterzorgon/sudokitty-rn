// Pause modal - displays game summary when paused
// Shows mistakes, hints, time, and difficulty
// Uses animated rolling numbers for stats

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../stores/gameStore';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { MAX_MISTAKES } from '../../engine/types';
import { RollingNumber, RollingTime } from '../ui';

interface PauseModalProps {
  visible: boolean;
  onResume: () => void;
}


const SCREEN_HEIGHT = Dimensions.get('window').height;

export const PauseModal = ({ visible, onResume }: PauseModalProps) => {
  const c = useColors();
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide up when modal becomes visible
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Reset position when modal closes
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleResume = () => {
    // Slide down before closing
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onResume();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleResume}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={handleResume} />
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          <Ionicons
            name="pause-circle"
            size={48}
            color={c.accent}
            style={styles.icon}
          />

          <Text style={styles.title}>game paused</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={[styles.statItem, { backgroundColor: c.cream }]}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>time</Text>
                <View style={styles.statValueContainer}>
                  <RollingTime
                    seconds={timeElapsed}
                    fontSize={18}
                    color={colors.textPrimary}
                    textStyle={typography.headline}
                  />
                </View>
              </View>

              <View style={[styles.statItem, { backgroundColor: c.cream }]}>
                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>difficulty</Text>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{difficulty}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statItem, { backgroundColor: c.cream }]}>
                <Ionicons name="close-circle-outline" size={20} color={mistakeCount > 0 ? colors.errorText : colors.textSecondary} />
                <Text style={styles.statLabel}>mistakes</Text>
                <View style={styles.statValueContainer}>
                  <View style={styles.counterRow}>
                    <RollingNumber
                      value={mistakeCount}
                      fontSize={18}
                      color={mistakeCount > 0 ? colors.errorText : colors.textPrimary}
                      textStyle={typography.headline}
                      maxDigits={1}
                    />
                    <Text style={[styles.counterText, mistakeCount > 0 && styles.errorValue]}>
                      /{MAX_MISTAKES}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.statItem, { backgroundColor: c.cream }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>hints</Text>
                <View style={styles.statValueContainer}>
                  <RollingNumber
                    value={hintsUsed}
                    fontSize={18}
                    color={colors.textPrimary}
                    textStyle={typography.headline}
                    maxDigits={1}
                  />
                </View>
              </View>
            </View>
          </View>

          <Pressable style={[styles.resumeButton, { backgroundColor: c.accent }]} onPress={handleResume}>
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.resumeText}>resume</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 20,
    alignItems: 'center',
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
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statValueContainer: {
    marginTop: spacing.xs,
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterText: {
    ...typography.headline,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  errorValue: {
    color: colors.errorText,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
