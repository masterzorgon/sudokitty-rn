// Action buttons: Undo, Erase, Notes, Hint
// Skeuomorphic 3D styling using SkeuButton

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore, useCanUseHint } from '../../stores/gameStore';
import { useUnlimitedHints } from '../../stores/settingsStore';
import { useEffectivePremium } from '../../stores/premiumStore';
import { MAX_HINTS } from '../../engine/types';
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
  /** Small circular badge over top-right of icon (e.g. hint count / "Ad") */
  badge?: string;
  /** Horizontal inset for badge (negative = overlap past icon edge); e.g. -14 for "Ad", -10 for "1" */
  badgeInsetRight?: number;
}

const ActionButton = memo(({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
  feedbackId,
  badge,
  badgeInsetRight = -10,
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
        <View style={styles.iconWithBadge}>
          <Ionicons name={icon} size={24} color={iconColor} />
          {badge != null && badge !== '' && (
            <View style={[styles.hintBadge, { right: badgeInsetRight }]}>
              <Text style={[styles.hintBadgeText, badge === '∞' && styles.hintBadgeTextInfinity]}>
                {badge}
              </Text>
            </View>
          )}
        </View>
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
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const paidHintsRemaining = useGameStore((s) => s.paidHintsRemaining);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const canUseHint = useCanUseHint();
  const unlimitedHints = useUnlimitedHints();
  const isPremium = useEffectivePremium();

  const isPlaying = gameStatus === 'playing';

  const hintsRemaining =
    Math.max(MAX_HINTS - hintsUsed, 0) + paidHintsRemaining;
  const hintBadgeContent =
    isPremium && unlimitedHints
      ? '∞'
      : hintsRemaining > 0
        ? String(hintsRemaining)
        : 'Ad';

  const hintBadgeInsetRight = hintBadgeContent === 'Ad' ? -14 : -10;

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
        badge={hintBadgeContent}
        badgeInsetRight={hintBadgeInsetRight}
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
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBadge: {
    position: 'absolute',
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8a7878',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hintBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamilies.bold,
    lineHeight: 13,
  },
  hintBadgeTextInfinity: {
    fontSize: 10.8,
    lineHeight: 14,
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
