// Action buttons: Undo, Erase, Notes, Hint
// Skeuomorphic 3D styling

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, useCanUseHint } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { Pill3DContainer, Pill3DFace } from '../ui/Skeuomorphic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTTON_HEIGHT = 56;
const BUTTON_RADIUS = 12;
const PRESS_DEPTH = 2;

const timingConfig = {
  duration: 100,
  easing: Easing.out(Easing.ease),
};

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
  const pressProgress = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(1, timingConfig);
  }, [disabled, pressProgress]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    pressProgress.value = withTiming(0, timingConfig);
  }, [disabled, pressProgress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressProgress.value * PRESS_DEPTH }],
    opacity: disabled ? 0.5 : 1,
  }));

  // Use active colors (orange) or white background
  const customColors = isActive
    ? undefined // Use primary variant
    : {
        gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
        edge: '#E0E0E0',
        borderLight: 'rgba(255, 255, 255, 0.5)',
        borderDark: 'rgba(0, 0, 0, 0.1)',
        textColor: colors.textSecondary,
      };

  const iconColor = disabled
    ? colors.textLight
    : isActive
    ? '#FFFFFF'
    : colors.textSecondary;

  return (
    <Animated.View style={[styles.buttonWrapper, animatedContainerStyle]}>
      <Pill3DContainer
        variant={isActive ? 'primary' : 'secondary'}
        customColors={customColors}
        borderRadius={BUTTON_RADIUS}
        edgeHeight={4}
      >
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.buttonPressable}
        >
          <Pill3DFace
            variant={isActive ? 'primary' : 'secondary'}
            customColors={customColors}
            borderRadius={BUTTON_RADIUS}
            showHighlight={false}
            style={styles.buttonFace}
          >
            <Ionicons name={icon} size={24} color={iconColor} />
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {label}
            </Text>
          </Pill3DFace>
        </AnimatedPressable>
      </Pill3DContainer>
    </Animated.View>
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
        disabled={!isPlaying || !canUseHint}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonPressable: {
    height: BUTTON_HEIGHT,
  },
  buttonFace: {
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
