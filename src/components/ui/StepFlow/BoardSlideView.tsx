import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { spacing } from '../../../theme';
import { GAME_LAYOUT } from '../../../constants/layout';
import { SudokuBoard, puzzleToCellData } from '../../board';
import { GameMascot } from '../../game';
import { AppButton } from '../AppButton';

interface BoardSlideViewProps {
  puzzle: number[][];
  highlightCells: Set<string>;
  mascotMessage: string | null;
  onNext: () => void;
  onPrevious: () => void;
  isFirst?: boolean;
  showBoxTinting?: boolean;
}

export function BoardSlideView({
  puzzle,
  highlightCells,
  mascotMessage,
  onNext,
  onPrevious,
  isFirst = false,
  showBoxTinting = true,
}: BoardSlideViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.mascotZone}>
        <GameMascot message={mascotMessage} maxLines={0} flexibleHeight skipEntering />
      </View>

      <View style={styles.boardContainer}>
        <SudokuBoard
          cells={puzzleToCellData(puzzle)}
          highlightedCells={highlightCells}
          interactive={false}
          animateValues={false}
          showBoxTinting={showBoxTinting}
        />
      </View>

      <View style={styles.bottomZone}>
        <View style={styles.stepNav}>
          <View style={styles.navButtonWrapper}>
            <AppButton
              onPress={onPrevious}
              label="Back"
              variant="neutral"
              disabled={isFirst}
            />
          </View>
          <View style={styles.navButtonWrapper}>
            <AppButton onPress={onNext} label="Next" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingTop: spacing.xxl + spacing.xxl, // 64pt — pushes nav buttons below the sudoku board
    paddingBottom: spacing.md,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  stepNav: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButtonWrapper: {
    flex: 1,
  },
});
