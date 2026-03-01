// Animated game view - renders the Sudoku board with entrance animation
// Board is positioned in the middle zone, pushed toward the bottom

import React from 'react';
import { SudokuBoard, useGameBoardProps } from '../board';
import { useBoardAnimations } from '../../hooks/useBoardAnimations';

export const AnimatedGameView = () => {
  const boardProps = useGameBoardProps();
  const activeAnimations = useBoardAnimations();

  return (
    <SudokuBoard {...boardProps} activeAnimations={activeAnimations} animateEntrance />
  );
};
