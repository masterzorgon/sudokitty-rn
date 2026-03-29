// Hook that subscribes to lastManualCorrectCell + xpPerPlacement and produces
// a transient BadgeEvent for the XP placement badge overlay.
// Fires on manual and hinted placements (both set lastManualCorrectCell + xpPerPlacement).

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";

export interface BadgeEvent {
  row: number;
  col: number;
  xp: number;
  key: number; // Date.now() — ensures consecutive same-cell placements re-trigger
}

const BADGE_LIFECYCLE_MS = 1500;

type PlacementSnapshot = { row: number; col: number; xp: number };

export function useXPBadge(): BadgeEvent | null {
  const lastManualCorrectCell = useGameStore((s) => s.lastManualCorrectCell);
  const xpPerPlacement = useGameStore((s) => s.xpPerPlacement);
  const [badgeEvent, setBadgeEvent] = useState<BadgeEvent | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Last placement we showed a badge for — also seeded on mount from store (resume) so stale state does not re-fire the badge. */
  const lastShownPlacementRef = useRef<PlacementSnapshot | null>(null);

  // On mount, align with persisted store so resume (hook remount) does not show the badge again.
  useEffect(() => {
    const st = useGameStore.getState();
    if (st.lastManualCorrectCell) {
      lastShownPlacementRef.current = {
        row: st.lastManualCorrectCell.row,
        col: st.lastManualCorrectCell.col,
        xp: st.xpPerPlacement,
      };
    } else {
      lastShownPlacementRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!lastManualCorrectCell) {
      lastShownPlacementRef.current = null;
      return;
    }

    const prev = lastShownPlacementRef.current;
    const same =
      prev &&
      prev.row === lastManualCorrectCell.row &&
      prev.col === lastManualCorrectCell.col &&
      prev.xp === xpPerPlacement;
    if (same) {
      return;
    }

    lastShownPlacementRef.current = {
      row: lastManualCorrectCell.row,
      col: lastManualCorrectCell.col,
      xp: xpPerPlacement,
    };

    const event: BadgeEvent = {
      row: lastManualCorrectCell.row,
      col: lastManualCorrectCell.col,
      xp: xpPerPlacement,
      key: Date.now(),
    };
    setBadgeEvent(event);

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setBadgeEvent(null);
      clearTimerRef.current = null;
    }, BADGE_LIFECYCLE_MS);

    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, [lastManualCorrectCell, xpPerPlacement]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  return badgeEvent;
}
