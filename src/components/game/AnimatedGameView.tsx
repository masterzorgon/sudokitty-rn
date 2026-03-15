// Animated game view - renders the Sudoku board with entrance animation
// Board is positioned in the middle zone, pushed toward the bottom

import React, { memo } from 'react';
import { View } from 'react-native';
import { SudokuBoard, useGameBoardProps, XPBadge, CELL_SIZE } from '../board';
import { useBoardAnimationsSync } from '../../hooks/useBoardAnimations';
import { useXPBadge } from '../../hooks/useXPBadge';

/** Subscribes to completion events and syncs to store. Renders nothing. */
const BoardAnimationLayer = memo(function BoardAnimationLayer() {
  useBoardAnimationsSync();
  return null;
});

const XPBadgeOverlay = memo(function XPBadgeOverlay() {
  const badgeEvent = useXPBadge();
  if (!badgeEvent) return null;
  return (
    <XPBadge
      row={badgeEvent.row}
      col={badgeEvent.col}
      xp={badgeEvent.xp}
      eventKey={badgeEvent.key}
    />
  );
});

export interface AnimatedGameViewProps {
  /** Skip entrance animation when resuming (board already visible). Default: true for new games. */
  animateEntrance?: boolean;
}

export const AnimatedGameView = ({ animateEntrance = true }: AnimatedGameViewProps) => {
  const boardProps = useGameBoardProps();

  return (
    <View
      style={{ width: 9 * CELL_SIZE, height: 9 * CELL_SIZE }}
      pointerEvents="box-none"
    >
      <BoardAnimationLayer />
      <SudokuBoard {...boardProps} animateEntrance={animateEntrance} />
      <XPBadgeOverlay />
    </View>
  );
};
