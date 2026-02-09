import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { SudokuBoard, puzzleToCellData } from '../board';
import { GameMascot } from '../game';
import { AppButton } from '../ui/AppButton';
import type { PuzzleState } from '../../hooks/useTechniquePractice';

// ============================================
// Types
// ============================================

interface TechniqueDemoViewProps {
  puzzleState: PuzzleState;
  currentStep: number;
  mochiMessage: string | null;
  boardHighlightSet: Set<string>;
  onNext: () => void;
  onPrevious: () => void;
}

// ============================================
// Component
// ============================================

export function TechniqueDemoView({
  puzzleState,
  currentStep,
  mochiMessage,
  boardHighlightSet,
  onNext,
  onPrevious,
}: TechniqueDemoViewProps) {
  const isLastStep = currentStep === puzzleState.steps.length - 1;

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
          interactive={false}
          animateValues={false}
          showBoxTinting
        />
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomZone}>
        <View style={styles.stepNav}>
          <View style={styles.stepNavButtonWrapper}>
            {currentStep > 0 && (
              <AppButton onPress={onPrevious} label="back" variant="neutral" icon="chevron-left" iconPosition="left" />
            )}
          </View>
          <View style={styles.stepNavButtonWrapper}>
            <AppButton
              onPress={onNext}
              label={isLastStep ? 'practice' : 'next'}
              icon={isLastStep ? 'play' : 'chevron-right'}
            />
          </View>
        </View>
      </View>
    </Animated.View>
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
  stepNav: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNavButtonWrapper: {
    flex: 1,
  },
});
