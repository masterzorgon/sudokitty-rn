// Action buttons: Undo, Erase, Notes, Hint
// Matches iOS UtilityButtonsView.swift

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, useCanUseHint } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { springConfigs } from '../../theme/animations';
import { borderRadius, shadows, spacing } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ActionButton = memo(({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
}: ActionButtonProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.92, springConfigs.quick);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.default);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        isActive && styles.buttonActive,
        disabled && styles.buttonDisabled,
        animatedStyle,
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={
          disabled
            ? colors.textLight
            : isActive
            ? colors.softOrange
            : colors.textSecondary
        }
      />
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});

export const ActionButtons = memo(() => {
  const undo = useGameStore((s) => s.undo);
  const canUndo = useGameStore((s) => s.canUndo);
  const eraseCell = useGameStore((s) => s.eraseCell);
  const toggleNotesMode = useGameStore((s) => s.toggleNotesMode);
  const isNotesMode = useGameStore((s) => s.isNotesMode);
  const useHint = useGameStore((s) => s.useHint);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const canUseHint = useCanUseHint();

  const isPlaying = gameStatus === 'playing';

  return (
    <View style={styles.container}>
      <ActionButton
        icon="arrow-undo"
        label="undo"
        onPress={undo}
        disabled={!isPlaying || !canUndo()}
      />
      <ActionButton
        icon="trash-outline"
        label="erase"
        onPress={eraseCell}
        disabled={!isPlaying}
      />
      <ActionButton
        icon={isNotesMode ? 'pencil' : 'pencil-outline'}
        label="notes"
        onPress={toggleNotesMode}
        isActive={isNotesMode}
        disabled={!isPlaying}
      />
      <ActionButton
        icon="bulb-outline"
        label="hint"
        onPress={useHint}
        disabled={!isPlaying}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  buttonActive: {
    backgroundColor: colors.cellSelected,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.captionLight,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  labelActive: {
    color: colors.softOrange,
  },
  labelDisabled: {
    color: colors.textLight,
  },
});
