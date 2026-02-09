// Bridge hook: reads gameStore and returns SudokuBoardProps for the main game screen.
// This keeps the game screen code clean while SudokuBoard stays props-driven.

import { useCallback, useMemo } from 'react';
import { useGameStore, useRelatedCells } from '../../stores/gameStore';
import type { SudokuBoardProps, SudokuCellData } from './SudokuBoard';

export function useGameBoardProps(): SudokuBoardProps {
  const board = useGameStore((s) => s.board);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const selectCell = useGameStore((s) => s.selectCell);
  const relatedCells = useRelatedCells();

  const cells: SudokuCellData[][] = useMemo(
    () =>
      board.map((row) =>
        row.map((cell) => ({
          value: cell.value,
          isGiven: cell.isGiven,
          isValid: cell.isValid,
          notes: cell.notes,
        })),
      ),
    [board],
  );

  const onCellPress = useCallback(
    (row: number, col: number) => {
      selectCell({ row, col });
    },
    [selectCell],
  );

  return {
    cells,
    selectedCell,
    relatedCells,
    highlightedNumber,
    onCellPress,
    interactive: true,
    animateValues: true,
    showBoxTinting: true,
  };
}
