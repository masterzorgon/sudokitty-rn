import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { SudokuBoard, puzzleToCellData } from '../board';
import { GameMascot } from '../game';
import { AppButton } from '../ui/AppButton';
import { BottomSheet } from '../ui/Sheet/BottomSheet';
import type { ValidationResult } from '../../engine/validation';
import type { FindPhase, PuzzleState } from '../../hooks/useTechniquePractice';

interface TechniqueFindItViewProps {
  puzzleState: PuzzleState;
  mochiMessage: string | null;
  isElimination: boolean;
  findPhase: FindPhase;
  boardHighlightSet: Set<string>;
  boardSecondarySet: Set<string>;
  validationResult: ValidationResult | null;
  patternCellCount: number;
  eliminationCellCount: number;
  selectedCellCount: number;
  onCellPress: (row: number, col: number) => void;
  onConfirmPattern: () => void;
  onBackToPattern: () => void;
  onSubmitSelection: () => void;
  onTryAgain: () => void;
  onBack: () => void;
}

export function TechniqueFindItView({
  puzzleState,
  mochiMessage,
  isElimination,
  findPhase,
  boardHighlightSet,
  boardSecondarySet,
  validationResult,
  patternCellCount,
  eliminationCellCount,
  selectedCellCount,
  onCellPress,
  onConfirmPattern,
  onBackToPattern,
  onSubmitSelection,
  onTryAgain,
  onBack,
}: TechniqueFindItViewProps) {
  const showIncorrectModal = validationResult !== null && !validationResult.correct;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.gameLayout}>
      <View style={styles.mascotZone}>
        <GameMascot message={mochiMessage} flexibleHeight skipEntering />
      </View>

      <View style={styles.boardContainer}>
        <SudokuBoard
          cells={puzzleToCellData(puzzleState.puzzle)}
          highlightedCells={boardHighlightSet}
          secondaryHighlightedCells={boardSecondarySet}
          onCellPress={onCellPress}
          interactive
          animateValues={false}
          showBoxTinting
        />
      </View>

      <View style={styles.bottomZone}>
        <FindItControls
          isElimination={isElimination}
          findPhase={findPhase}
          patternCellCount={patternCellCount}
          eliminationCellCount={eliminationCellCount}
          selectedCellCount={selectedCellCount}
          onConfirmPattern={onConfirmPattern}
          onBackToPattern={onBackToPattern}
          onSubmitSelection={onSubmitSelection}
          onBack={onBack}
        />
      </View>

      <BottomSheet
        visible={showIncorrectModal}
        onDismiss={onTryAgain}
        title="not quite!"
        description={validationResult?.feedback ?? ''}
        action={{ label: 'Try Again', onPress: onTryAgain }}
        dismissOnTapOutside={false}
      />
    </Animated.View>
  );
}

interface ButtonConfig {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'neutral';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

interface FindItControlsConfig {
  primary: ButtonConfig;
  secondary: ButtonConfig;
}

function getControlsConfig(
  isElimination: boolean,
  findPhase: FindPhase,
  patternCellCount: number,
  eliminationCellCount: number,
  selectedCellCount: number,
  onConfirmPattern: () => void,
  onBackToPattern: () => void,
  onSubmitSelection: () => void,
  onBack: () => void,
): FindItControlsConfig {
  if (isElimination && findPhase === 'pattern') {
    return {
      secondary: { label: 'Back', onPress: onBack, variant: 'neutral', icon: 'chevron-left', iconPosition: 'left' },
      primary: { label: 'Submit', onPress: onConfirmPattern, icon: 'chevron-right', disabled: patternCellCount === 0 },
    };
  }
  if (isElimination && findPhase === 'elimination') {
    return {
      secondary: { label: 'Back', onPress: onBackToPattern, variant: 'neutral' },
      primary: { label: 'Submit', onPress: onSubmitSelection, disabled: eliminationCellCount === 0 },
    };
  }
  return {
    secondary: { label: 'Back', onPress: onBack, variant: 'neutral' },
    primary: { label: 'Submit', onPress: onSubmitSelection, disabled: selectedCellCount === 0 },
  };
}

interface FindItControlsProps {
  isElimination: boolean;
  findPhase: FindPhase;
  patternCellCount: number;
  eliminationCellCount: number;
  selectedCellCount: number;
  onConfirmPattern: () => void;
  onBackToPattern: () => void;
  onSubmitSelection: () => void;
  onBack: () => void;
}

function FindItControls({
  isElimination,
  findPhase,
  patternCellCount,
  eliminationCellCount,
  selectedCellCount,
  onConfirmPattern,
  onBackToPattern,
  onSubmitSelection,
  onBack,
}: FindItControlsProps) {
  const config = getControlsConfig(
    isElimination,
    findPhase,
    patternCellCount,
    eliminationCellCount,
    selectedCellCount,
    onConfirmPattern,
    onBackToPattern,
    onSubmitSelection,
    onBack,
  );

  return (
    <View style={styles.buttonRow}>
      <View style={styles.buttonWrapper}>
        <AppButton
          onPress={config.secondary.onPress}
          label={config.secondary.label}
          variant={config.secondary.variant ?? 'neutral'}
          icon={config.secondary.icon}
          iconPosition={config.secondary.iconPosition}
          disabled={config.secondary.disabled}
        />
      </View>
      <View style={styles.buttonWrapper}>
        <AppButton
          onPress={config.primary.onPress}
          label={config.primary.label}
          icon={config.primary.icon}
          iconPosition={config.primary.iconPosition}
          disabled={config.primary.disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gameLayout: {
    flex: 1,
    overflow: 'visible',
  },
  mascotZone: {
    flex: 1,
    width: '100%',
    maxWidth: '90%',
    alignSelf: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    zIndex: 0,
  },
  boardContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  bottomZone: {
    paddingTop: spacing.xxl + spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
