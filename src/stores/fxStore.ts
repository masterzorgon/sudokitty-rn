import { create } from "zustand";

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
