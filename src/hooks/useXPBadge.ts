// Hook that subscribes to lastManualCorrectCell + xpPerPlacement and produces
// a transient BadgeEvent for the XP placement badge overlay.
// Fires on manual and hinted placements (both set lastManualCorrectCell + xpPerPlacement).

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export interface BadgeEvent {
  row: number;
  col: number;
  xp: number;
  key: number; // Date.now() — ensures consecutive same-cell placements re-trigger
}

const BADGE_LIFECYCLE_MS = 1500;

export function useXPBadge(): BadgeEvent | null {
  const lastManualCorrectCell = useGameStore((s) => s.lastManualCorrectCell);
  const xpPerPlacement = useGameStore((s) => s.xpPerPlacement);
  const [badgeEvent, setBadgeEvent] = useState<BadgeEvent | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastManualCorrectCell) {
      return;
    }

    // Fire on every lastManualCorrectCell update. The key (Date.now()) ensures the badge
    // component re-mounts and re-animates even for same-cell placements (erase + re-enter).
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
