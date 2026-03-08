// Module-level store for completion wave animations.
// Allows cells to subscribe individually so only affected cells re-render
// when animations change, instead of the full 81-cell board.

import type { CellAnimationState } from '../engine/types';

const EMPTY_MAP = new Map<string, CellAnimationState[]>();

let currentMap = EMPTY_MAP;
const listeners = new Map<string, Set<(anim: CellAnimationState[] | undefined) => void>>();

export function setBoardAnimations(map: Map<string, CellAnimationState[]>): void {
  currentMap = map;

  // Notify all subscribed cells with their new animation state
  listeners.forEach((callbacks, key) => {
    const anim = currentMap.get(key);
    callbacks.forEach((cb) => cb(anim));
  });
}

export function getBoardAnimations(): Map<string, CellAnimationState[]> {
  return currentMap;
}

export function subscribeToCellAnimations(
  key: string,
  callback: (anim: CellAnimationState[] | undefined) => void
): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);

  // Initial value
  callback(currentMap.get(key));

  return () => {
    set?.delete(callback);
    if (set?.size === 0) {
      listeners.delete(key);
    }
  };
}
