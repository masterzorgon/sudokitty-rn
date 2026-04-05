import { create } from "zustand";

/** High-frequency arrival signals — not Zustand state (avoids re-renders per hit). */
let _onMochiArrival: (() => void) | null = null;
let _onBurstComplete: (() => void) | null = null;

export function setOnMochiArrival(cb: (() => void) | null): void {
  _onMochiArrival = cb;
}

export function fireMochiArrival(): void {
  _onMochiArrival?.();
}

export function setOnBurstComplete(cb: (() => void) | null): void {
  _onBurstComplete = cb;
}

export function fireBurstComplete(): void {
  _onBurstComplete?.();
}

export interface MochiTargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FXState {
  burstId: number;
  burstAmount: number;
  targetLayout: MochiTargetLayout | null;
}

interface FXActions {
  triggerMochiBurst: (amount: number) => void;
  setTargetLayout: (layout: MochiTargetLayout | null) => void;
}

export const useFXStore = create<FXState & FXActions>((set) => ({
  burstId: 0,
  burstAmount: 0,
  targetLayout: null,

  triggerMochiBurst: (amount: number) =>
    set((s) => ({
      burstId: s.burstId + 1,
      burstAmount: amount,
    })),

  setTargetLayout: (layout) => set({ targetLayout: layout }),
}));
