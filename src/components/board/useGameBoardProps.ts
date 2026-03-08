// Bridge hook: reads gameStore and returns SudokuBoardProps for the main game screen.
// This keeps the game screen code clean while SudokuBoard stays props-driven.

import { useCallback, useMemo, useRef } from 'react';
import { useGameStore, useRelatedCells } from '../../stores/gameStore';
import { playFeedback } from '../../utils/feedback';
import type { SudokuBoardProps, SudokuCellData } from './SudokuBoard';

export function useGameBoardProps(): SudokuBoardProps {
  const board = useGameStore((s) => s.board);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const highlightedNumber = useGameStore((s) => s.highlightedNumber);
  const selectCell = useGameStore((s) => s.selectCell);
  const relatedCells = useRelatedCells();

  const prevCellsRef = useRef<SudokuCellData[][]>([]);

  const cells: SudokuCellData[][] = useMemo(() => {
    const prev = prevCellsRef.current;
    const next = board.map((row, r) =>
      row.map((cell, c) => {
        const p = prev[r]?.[c];
        if (
          p &&
          p.value === cell.value &&
          p.isGiven === cell.isGiven &&
          p.isValid === cell.isValid &&
          p.notes === cell.notes
        ) {
          return p;
        }
        return {
          value: cell.value,
          isGiven: cell.isGiven,
          isValid: cell.isValid,
          notes: cell.notes,
        };
      }),
    );
    prevCellsRef.current = next;
    return next;
  }, [board]);

  const onCellPress = useCallback(
    (row: number, col: number) => {
      // Intentional silence: tap on given cell gets no feedback
      if (!cells[row][col].isGiven) {
        playFeedback('selection');
      }
      selectCell({ row, col });
    },
    [cells, selectCell],
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
