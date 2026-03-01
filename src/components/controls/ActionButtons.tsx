// Action buttons: Undo, Erase, Notes, Hint
// Skeuomorphic 3D styling using SkeuButton

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore, useCanUseHint } from '../../stores/gameStore';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { SkeuButton } from '../ui/Skeuomorphic';
import { BUTTON_HEIGHT, BUTTON_RADIUS, whiteSkeuColorsSecondary } from './constants';

const whiteColors = whiteSkeuColorsSecondary;

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
  feedbackId?: 'erase' | 'notesToggle' | 'hint';
}

const ActionButton = memo(({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
  feedbackId,
}: ActionButtonProps) => {
  const iconColor = disabled
    ? colors.textLight
    : isActive
    ? colors.white
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
        feedbackId={feedbackId}
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

interface ActionButtonsProps {
  onHintUnavailable?: () => void;
}

export const ActionButtons = memo(({ onHintUnavailable }: ActionButtonsProps) => {
  const undo = useGameStore((s) => s.undo);
  const canUndo = useGameStore((s) => s.canUndo);
  const eraseCell = useGameStore((s) => s.eraseCell);
  const toggleNotesMode = useGameStore((s) => s.toggleNotesMode);
  const isNotesMode = useGameStore((s) => s.isNotesMode);
  const useHint = useGameStore((s) => s.useHint);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const canUseHint = useCanUseHint();

  const isPlaying = gameStatus === 'playing';

  const handleHintPress = () => {
    if (canUseHint) {
      useHint();
    } else {
      onHintUnavailable?.();
    }
  };

  const hintDisabled = onHintUnavailable
    ? !isPlaying
    : !isPlaying || !canUseHint;

  return (
    <View style={styles.container}>
      <ActionButton
        icon="arrow-undo"
        label="Undo"
        onPress={undo}
        disabled={!isPlaying || !canUndo()}
      />
      <ActionButton
        icon="trash-outline"
        label="Erase"
        onPress={eraseCell}
        disabled={!isPlaying}
        feedbackId="erase"
      />
      <ActionButton
        icon={isNotesMode ? 'pencil' : 'pencil-outline'}
        label="Notes"
        onPress={toggleNotesMode}
        isActive={isNotesMode}
        disabled={!isPlaying}
        feedbackId="notesToggle"
      />
      <ActionButton
        icon="bulb-outline"
        label="Hint"
        onPress={handleHintPress}
        disabled={hintDisabled}
        feedbackId="hint"
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
    fontFamily: fontFamilies.bold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.white,
  },
});
