// Action buttons: Undo, Erase, Notes, Hint
// Skeuomorphic 3D styling using SkeuButton

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore, useCanUseHint } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { SkeuButton } from '../ui/Skeuomorphic';

const BUTTON_HEIGHT = 56;
const BUTTON_RADIUS = 12;

// White custom colors for inactive buttons
const whiteColors = {
  gradient: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  edge: '#E0E0E0',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  borderDark: 'rgba(0, 0, 0, 0.1)',
  textColor: colors.textSecondary,
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
  const iconColor = disabled
    ? colors.textLight
    : isActive
    ? '#FFFFFF'
    : colors.textSecondary;

  return (
    <View style={styles.buttonWrapper}>
      <SkeuButton
        onPress={onPress}
        variant={isActive ? 'primary' : 'secondary'}
        customColors={isActive ? undefined : whiteColors}
        borderRadius={BUTTON_RADIUS}
        showHighlight={false}
        disabled={disabled}
        contentStyle={styles.buttonFace}
        accessibilityLabel={`${label} button`}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {label}
        </Text>
      </SkeuButton>
    </View>
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
    gap: 4, // Reduced to make buttons ~5% wider
    // No marginBottom - spacing controlled by parent container gap
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonFace: {
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Pally-Bold',
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
