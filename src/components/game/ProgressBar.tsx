// Progress bar component - displays game completion progress
// Shows a capsule-shaped bar with fill based on cells completed
// Uses animated rolling numbers for percentage display

import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme';
import { RollingNumber } from '../ui';
import { GAME_LAYOUT } from '../../constants/layout';

interface ProgressBarProps {
  onBack: () => void;
  /** Optional trailing action element (e.g., settings button) */
  trailingAction?: React.ReactNode;
}

export const ProgressBar = ({ onBack, trailingAction }: ProgressBarProps) => {
  const progress = useProgress();
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${percentage}%` }]}>
            {/* Middle highlight layer - slightly lighter, inset 2px */}
            <View style={styles.barFillMiddle} />
            {/* Top gloss layer - lightest, thin strip near top */}
            <View style={styles.barFillGloss} />
          </View>
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

      {trailingAction && (
        <View style={styles.trailingSlot}>
          {trailingAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  barContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  barBackground: {
    height: GAME_LAYOUT.PROGRESS_BAR_HEIGHT, // Increased from 12 to 20
    backgroundColor: '#e8e5e9',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FF8C56', // Base layer - darkest
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFillMiddle: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: '#FF915E', // Middle highlight - slightly lighter
    borderRadius: borderRadius.full,
  },
  barFillGloss: {
    position: 'absolute',
    top: 3,
    left: 10,
    right: 10,
    height: 5,
    backgroundColor: '#FF9A6B', // Top gloss - lightest
    borderRadius: 2,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 36,
    justifyContent: 'flex-end',
  },
  percentSign: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 20,
    marginLeft: -12,
  },
  trailingSlot: {
    marginLeft: 8,
  },
});
