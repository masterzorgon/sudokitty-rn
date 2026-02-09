import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';


import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { SudokuBoard, puzzleToCellData } from '../board';
import { GameMascot } from '../game';
import { AppButton } from '../ui/AppButton';
import { ValidationFeedback } from './ValidationFeedback';
import type { ValidationResult } from '../../engine/validation';
import type { FindPhase, PuzzleState } from '../../hooks/useTechniquePractice';

// ============================================
// Types
// ============================================

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
  onTryAnother: () => void;
}

// ============================================
// Component
// ============================================

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
  onTryAnother,
}: TechniqueFindItViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.gameLayout}>
      {/* Mochi cat speech bubble — fills space above board */}
      <View style={styles.mascotZone}>
        <GameMascot message={mochiMessage} maxLines={0} flexibleHeight />
      </View>

      {/* Board (edge-to-edge) */}
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

      {/* Bottom controls */}
      <View style={styles.bottomZone}>
        {!validationResult ? (
          <FindItControls
            isElimination={isElimination}
            findPhase={findPhase}
            patternCellCount={patternCellCount}
            eliminationCellCount={eliminationCellCount}
            selectedCellCount={selectedCellCount}
            onConfirmPattern={onConfirmPattern}
            onBackToPattern={onBackToPattern}
            onSubmitSelection={onSubmitSelection}
          />
        ) : (
          <ValidationFeedback
            validationResult={validationResult}
            onTryAgain={onTryAgain}
            onTryAnother={onTryAnother}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// Sub-component: Find-it controls
// ============================================

interface FindItControlsProps {
  isElimination: boolean;
  findPhase: FindPhase;
  patternCellCount: number;
  eliminationCellCount: number;
  selectedCellCount: number;
  onConfirmPattern: () => void;
  onBackToPattern: () => void;
  onSubmitSelection: () => void;
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
}: FindItControlsProps) {
  if (isElimination && findPhase === 'pattern') {
    return (
      <AppButton
        onPress={onConfirmPattern}
        label="confirm pattern"
        icon="chevron-right"
        disabled={patternCellCount === 0}
      />
    );
  }

  if (isElimination && findPhase === 'elimination') {
    return (
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <AppButton onPress={onBackToPattern} label="back" variant="neutral" icon="chevron-left" iconPosition="left" />
        </View>
        <View style={styles.buttonWrapper}>
          <AppButton onPress={onSubmitSelection} label="check answer" disabled={eliminationCellCount === 0} />
        </View>
      </View>
    );
  }

  return (
    <AppButton onPress={onSubmitSelection} label="check answer" disabled={selectedCellCount === 0} />
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  gameLayout: {
    flex: 1,
  },
  mascotZone: {
    flex: 1,
    width: '100%',
    maxWidth: '90%',
    alignSelf: 'center',
    justifyContent: 'flex-end',
  },
  boardContainer: {
    alignItems: 'center',
  },
  bottomZone: {
    paddingTop: spacing.md,
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
