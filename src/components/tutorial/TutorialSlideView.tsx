import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { spacing } from '../../theme';
import { GAME_LAYOUT } from '../../constants/layout';
import { SudokuBoard, puzzleToCellData } from '../board';
import { GameMascot } from '../game';
import { AppButton } from '../ui/AppButton';

interface TutorialSlideViewProps {
  puzzle: number[][];
  highlightCells: Set<string>;
  mascotMessage: string;
  isFirst: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function TutorialSlideView({
  puzzle,
  highlightCells,
  mascotMessage,
  isFirst,
  onNext,
  onPrevious,
}: TutorialSlideViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.mascotZone}>
        <GameMascot message={mascotMessage} maxLines={0} flexibleHeight />
      </View>

      <View style={styles.boardContainer}>
        <SudokuBoard
          cells={puzzleToCellData(puzzle)}
          highlightedCells={highlightCells}
          interactive={false}
          animateValues={false}
          showBoxTinting
        />
      </View>

      <View style={styles.bottomZone}>
        <View style={styles.stepNav}>
          <View style={styles.navButtonWrapper}>
            <AppButton
              onPress={onPrevious}
              label="back"
              variant="neutral"
              disabled={isFirst}
            />
          </View>
          <View style={styles.navButtonWrapper}>
            <AppButton onPress={onNext} label="next" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingTop: spacing.xxl + spacing.xxl,
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
