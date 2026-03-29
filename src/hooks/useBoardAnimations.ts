// Hook that subscribes to game store completion events and syncs
// a per-cell animation map to the boardAnimationStore.
// Cells subscribe individually via useBoardAnimationsForCell so only
// affected cells re-render when animations change.

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/gameStore";
import {
  setBoardAnimations,
  getBoardAnimations,
  subscribeToCellAnimations,
} from "../stores/boardAnimationStore";
import {
  Position,
  CompletedUnit,
  CellAnimationState,
  BOARD_SIZE,
  BOX_SIZE,
  positionKey,
} from "../engine/types";
import { delays, durations } from "../theme/animations";

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
  type: "row" | "column" | "box",
): number {
  switch (type) {
    case "row":
      return Math.abs(target.col - epicenter.col) * DELAY_PER_CELL;
    case "column":
      return Math.abs(target.row - epicenter.row) * DELAY_PER_CELL;
    case "box":
      // Manhattan distance within the box
      return (
        (Math.abs(target.row - epicenter.row) + Math.abs(target.col - epicenter.col)) *
        DELAY_PER_CELL
      );
  }
}

/** Get all cell positions affected by a completed unit. */
function getAffectedCells(unit: CompletedUnit): Position[] {
  const cells: Position[] = [];

  switch (unit.type) {
    case "row":
      for (let col = 0; col < BOARD_SIZE; col++) {
        cells.push({ row: unit.index, col });
      }
      break;
    case "column":
      for (let row = 0; row < BOARD_SIZE; row++) {
        cells.push({ row, col: unit.index });
      }
      break;
    case "box": {
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
// Hooks
// ============================================

const EMPTY_MAP = new Map<string, CellAnimationState[]>();

/**
 * Syncs completion events to boardAnimationStore. Call from a component that
 * renders nothing (or is isolated) so animation updates don't trigger board re-renders.
 */
export function useBoardAnimationsSync(): void {
  const lastCompletedUnits = useGameStore((s) => s.lastCompletedUnits);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBatchIdRef = useRef<number>(0);

  // On mount, align ref with any persisted lastCompletedUnits (e.g. resume). The ref
  // resets when this layer unmounts; the game store keeps lastCompletedUnits, so without
  // seeding we would replay the completion wave on every re-entry to the game screen.
  useEffect(() => {
    const units = useGameStore.getState().lastCompletedUnits;
    if (units.length > 0) {
      lastBatchIdRef.current = units[0].timestamp;
    }
  }, []);

  useEffect(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (lastCompletedUnits.length === 0) {
      setBoardAnimations(EMPTY_MAP);
      return;
    }

    const batchId = lastCompletedUnits[0].timestamp;
    if (batchId === lastBatchIdRef.current) {
      return;
    }
    lastBatchIdRef.current = batchId;

    const map = buildAnimationMap(lastCompletedUnits, batchId);
    setBoardAnimations(map);

    clearTimerRef.current = setTimeout(() => {
      setBoardAnimations(EMPTY_MAP);
      clearTimerRef.current = null;
    }, WAVE_DURATION + CLEAR_BUFFER);
  }, [lastCompletedUnits]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);
}

/**
 * Subscribe to completion animations for a single cell. Only this cell re-renders
 * when its animation state changes, not the full board.
 */
export function useBoardAnimationsForCell(key: string): CellAnimationState[] | undefined {
  const [animations, setAnimations] = useState<CellAnimationState[] | undefined>(() =>
    getBoardAnimations().get(key),
  );

  useEffect(() => {
    return subscribeToCellAnimations(key, setAnimations);
  }, [key]);

  return animations;
}
