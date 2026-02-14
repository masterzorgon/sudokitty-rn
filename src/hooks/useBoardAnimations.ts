// Hook that subscribes to game store completion events and produces
// a per-cell animation map for the SudokuBoard.
//
// Returns a Map<string, CellAnimationState[]> keyed by position key ("row-col").
// Each entry contains staggered animation data that SudokuCell consumes to
// render wave pulses when rows, columns, or boxes are completed.

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  Position,
  CompletedUnit,
  CellAnimationState,
  BOARD_SIZE,
  BOX_SIZE,
  positionKey,
} from '../engine/types';
import { delays, durations } from '../theme/animations';

// ============================================
// Constants
// ============================================

const DELAY_PER_CELL = delays.wavePerCell; // 50ms
const WAVE_DURATION = durations.completionWave; // 700ms
const CLEAR_BUFFER = 200; // Extra buffer before clearing animation state

// ============================================
// Helpers
// ============================================

/** Compute the stagger delay for a target cell relative to the epicenter. */
function computeDelay(
  epicenter: Position,
  target: Position,
  type: 'row' | 'column' | 'box',
): number {
  switch (type) {
    case 'row':
      return Math.abs(target.col - epicenter.col) * DELAY_PER_CELL;
    case 'column':
      return Math.abs(target.row - epicenter.row) * DELAY_PER_CELL;
    case 'box':
      // Manhattan distance within the box
      return (
        (Math.abs(target.row - epicenter.row) +
          Math.abs(target.col - epicenter.col)) *
        DELAY_PER_CELL
      );
  }
}

/** Get all cell positions affected by a completed unit. */
function getAffectedCells(unit: CompletedUnit): Position[] {
  const cells: Position[] = [];

  switch (unit.type) {
    case 'row':
      for (let col = 0; col < BOARD_SIZE; col++) {
        cells.push({ row: unit.index, col });
      }
      break;
    case 'column':
      for (let row = 0; row < BOARD_SIZE; row++) {
        cells.push({ row, col: unit.index });
      }
      break;
    case 'box': {
      const boxStartRow = Math.floor(unit.index / 3) * BOX_SIZE;
      const boxStartCol = (unit.index % 3) * BOX_SIZE;
      for (let r = 0; r < BOX_SIZE; r++) {
        for (let c = 0; c < BOX_SIZE; c++) {
          cells.push({ row: boxStartRow + r, col: boxStartCol + c });
        }
      }
      break;
    }
  }

  return cells;
}

/**
 * Build a per-cell animation map from an array of completed units.
 * Cells at intersections (e.g., row + column) receive multiple entries.
 */
function buildAnimationMap(
  completedUnits: CompletedUnit[],
  batchId: number,
): Map<string, CellAnimationState[]> {
  const map = new Map<string, CellAnimationState[]>();

  for (const unit of completedUnits) {
    const cells = getAffectedCells(unit);
    for (const cell of cells) {
      const key = positionKey(cell);
      const animState: CellAnimationState = {
        type: unit.type,
        delay: computeDelay(unit.epicenter, cell, unit.type),
        batchId,
      };
      const existing = map.get(key);
      if (existing) {
        existing.push(animState);
      } else {
        map.set(key, [animState]);
      }
    }
  }

  return map;
}

// ============================================
// Hook
// ============================================

const EMPTY_MAP = new Map<string, CellAnimationState[]>();

export function useBoardAnimations(): Map<string, CellAnimationState[]> {
  const lastCompletedUnits = useGameStore((s) => s.lastCompletedUnits);
  const [activeAnimations, setActiveAnimations] =
    useState<Map<string, CellAnimationState[]>>(EMPTY_MAP);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBatchIdRef = useRef<number>(0);

  useEffect(() => {
    // Clear any existing auto-clear timer
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (lastCompletedUnits.length === 0) {
      // No completions — clear animations immediately
      if (activeAnimations.size > 0) {
        setActiveAnimations(EMPTY_MAP);
      }
      return;
    }

    // Use the first unit's timestamp as batch ID
    const batchId = lastCompletedUnits[0].timestamp;

    // Skip if we already processed this batch
    if (batchId === lastBatchIdRef.current) return;
    lastBatchIdRef.current = batchId;

    // Build animation map and set it
    const map = buildAnimationMap(lastCompletedUnits, batchId);
    setActiveAnimations(map);

    // Auto-clear after the wave finishes
    clearTimerRef.current = setTimeout(() => {
      setActiveAnimations(EMPTY_MAP);
      clearTimerRef.current = null;
    }, WAVE_DURATION + CLEAR_BUFFER);
  }, [lastCompletedUnits]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  return activeAnimations;
}
