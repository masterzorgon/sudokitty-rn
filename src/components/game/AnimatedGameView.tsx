// Animated game view - renders the Sudoku board with entrance animation
// Board is positioned in the middle zone, pushed toward the bottom

import React from 'react';
import { View } from 'react-native';
import { SudokuBoard, useGameBoardProps, XPBadge, CELL_SIZE } from '../board';
import { useBoardAnimations } from '../../hooks/useBoardAnimations';
import { useXPBadge } from '../../hooks/useXPBadge';

export const AnimatedGameView = () => {
  const boardProps = useGameBoardProps();
  const activeAnimations = useBoardAnimations();
  const badgeEvent = useXPBadge();

  return (
    <View
      style={{ width: 9 * CELL_SIZE, height: 9 * CELL_SIZE }}
      pointerEvents="box-none"
    >
      <SudokuBoard {...boardProps} activeAnimations={activeAnimations} animateEntrance />
      {badgeEvent && (
        <XPBadge
          key={badgeEvent.key}
          row={badgeEvent.row}
          col={badgeEvent.col}
          xp={badgeEvent.xp}
        />
      )}
    </View>
  );
};
