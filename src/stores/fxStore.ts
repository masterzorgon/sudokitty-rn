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
    set((s) => {
      const nextId = s.burstId + 1;
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/0ae61ecd-caec-474e-bdeb-3b6e3b859537", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "337cb5" },
        body: JSON.stringify({
          sessionId: "337cb5",
          runId: "mochi-burst-monitor",
          hypothesisId: "H1_trigger",
          location: "fxStore.ts:triggerMochiBurst",
          message: "Mochi burst triggered",
          data: { burstId: nextId, burstAmount: amount },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return {
        burstId: nextId,
        burstAmount: amount,
      };
    }),

  setTargetLayout: (layout) => {
    set({ targetLayout: layout });
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/0ae61ecd-caec-474e-bdeb-3b6e3b859537", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "337cb5" },
      body: JSON.stringify({
        sessionId: "337cb5",
        runId: "mochi-burst-monitor",
        hypothesisId: "H2_target_layout",
        location: "fxStore.ts:setTargetLayout",
        message: layout ? "Header target set" : "Header target cleared",
        data: layout
          ? {
              x: Math.round(layout.x),
              y: Math.round(layout.y),
              w: Math.round(layout.width),
              h: Math.round(layout.height),
            }
          : null,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  },
}));
