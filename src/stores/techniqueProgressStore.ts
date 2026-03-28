// Technique progress state management with Zustand
// Tracks user's learning progress through each technique
//
// Per-technique state:
//   - Demo completion
//   - Find-it successes/failures/attempts
//   - Completion status (demo + 3 finds)
//   - Timestamps (ISO strings for clean serialization)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { TECHNIQUE_METADATA, isTechniqueLessonVisible } from '../data/techniqueMetadata';

// ============================================
// Types
// ============================================

export interface TechniqueProgress {
  id: string;
  demoCompleted: boolean;
  findSuccesses: number;
  findAttempts: number;
  findFailures: number;
  lastPracticedISO: string | null;
  firstCompletedISO: string | null;
  isCompleted: boolean; // Derived: demoCompleted && findSuccesses >= COMPLETION_THRESHOLD
  fastestDemoTimeSeconds: number | null;
}

export interface TechniqueProgressState {
  techniques: Record<string, TechniqueProgress>;
  currentTechniqueId: string | null;
  isLoaded: boolean;
}

// ============================================
// Constants
// ============================================

/** Number of successful find-it completions required to master a technique */
export const COMPLETION_THRESHOLD = 3;

/** Number of consecutive failures before offering a demo refresher */
export const STRUGGLE_THRESHOLD = 3;

// ============================================
// Helpers
// ============================================

function createEmptyProgress(id: string): TechniqueProgress {
  return {
    id,
    demoCompleted: false,
    findSuccesses: 0,
    findAttempts: 0,
    findFailures: 0,
    lastPracticedISO: null,
    firstCompletedISO: null,
    isCompleted: false,
    fastestDemoTimeSeconds: null,
  };
}

function nowISO(): string {
  return new Date().toISOString();
}

function deriveCompleted(progress: TechniqueProgress): boolean {
  return progress.demoCompleted && progress.findSuccesses >= COMPLETION_THRESHOLD;
}

// ============================================
// Storage Key
// ============================================

// Add to STORAGE_KEYS - we use a direct key here since storage.ts has a fixed set
const TECHNIQUE_PROGRESS_KEY = '@sudokitty/technique_progress' as const;

// ============================================
// Store
// ============================================

interface TechniqueProgressActions {
  // Initialization
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  resetState: () => void;

  // Demo mode
  completeDemo: (techniqueId: string, timeSeconds?: number) => void;

  // Find-it mode
  recordFindAttempt: (techniqueId: string, success: boolean) => void;

  // Navigation
  setCurrentTechnique: (techniqueId: string | null) => void;

  // Queries
  getProgress: (techniqueId: string) => TechniqueProgress;
  isCompleted: (techniqueId: string) => boolean;
  isStruggling: (techniqueId: string) => boolean;
  getCompletionCount: () => number;
  getTotalCount: () => number;
  getOverallProgress: () => number; // 0-1
}

export const useTechniqueProgressStore = create<
  TechniqueProgressState & TechniqueProgressActions
>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      techniques: {},
      currentTechniqueId: null,
      isLoaded: false,

      // Load from AsyncStorage
      loadState: async () => {
        try {
          const value = await AsyncStorage.getItem(TECHNIQUE_PROGRESS_KEY);
          if (value) {
            const stored = JSON.parse(value) as Record<string, TechniqueProgress>;
            set((state) => {
              state.techniques = stored;
              state.isLoaded = true;
            });
          } else {
            set((state) => {
              state.isLoaded = true;
            });
          }
        } catch (error) {
          console.error('[TechniqueProgress] Error loading state:', error);
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // Save to AsyncStorage
      saveState: async () => {
        try {
          const { techniques } = get();
          await AsyncStorage.setItem(TECHNIQUE_PROGRESS_KEY, JSON.stringify(techniques));
        } catch (error) {
          console.error('[TechniqueProgress] Error saving state:', error);
        }
      },

      // Reset all progress
      resetState: () => {
        set((state) => {
          state.techniques = {};
          state.currentTechniqueId = null;
        });
        get().saveState();
      },

      // Complete the guided demo for a technique
      completeDemo: (techniqueId: string, timeSeconds?: number) => {
        set((state) => {
          if (!state.techniques[techniqueId]) {
            state.techniques[techniqueId] = createEmptyProgress(techniqueId);
          }
          const progress = state.techniques[techniqueId];
          progress.demoCompleted = true;
          progress.lastPracticedISO = nowISO();

          // Track fastest demo time
          if (
            timeSeconds !== undefined &&
            (progress.fastestDemoTimeSeconds === null ||
              timeSeconds < progress.fastestDemoTimeSeconds)
          ) {
            progress.fastestDemoTimeSeconds = timeSeconds;
          }

          // Update completion
          progress.isCompleted = deriveCompleted(progress);
          if (progress.isCompleted && !progress.firstCompletedISO) {
            progress.firstCompletedISO = nowISO();
          }
        });
        get().saveState();
      },

      // Record a find-it attempt (success or failure)
      recordFindAttempt: (techniqueId: string, success: boolean) => {
        set((state) => {
          if (!state.techniques[techniqueId]) {
            state.techniques[techniqueId] = createEmptyProgress(techniqueId);
          }
          const progress = state.techniques[techniqueId];
          progress.findAttempts++;
          progress.lastPracticedISO = nowISO();

          if (success) {
            progress.findSuccesses++;
            progress.findFailures = 0; // Reset consecutive failure counter

          } else {
            progress.findFailures++;
          }

          // Update completion
          progress.isCompleted = deriveCompleted(progress);
          if (progress.isCompleted && !progress.firstCompletedISO) {
            progress.firstCompletedISO = nowISO();
          }
        });
        get().saveState();
      },

      // Set the current active technique
      setCurrentTechnique: (techniqueId: string | null) => {
        set((state) => {
          state.currentTechniqueId = techniqueId;
        });
      },

      // Get progress for a technique (never undefined)
      getProgress: (techniqueId: string): TechniqueProgress => {
        const progress = get().techniques[techniqueId];
        return progress ?? createEmptyProgress(techniqueId);
      },

      // Check if a technique is completed
      isCompleted: (techniqueId: string): boolean => {
        const progress = get().techniques[techniqueId];
        return progress?.isCompleted ?? false;
      },

      // Check if user is struggling (3+ consecutive failures)
      isStruggling: (techniqueId: string): boolean => {
        const progress = get().techniques[techniqueId];
        return (progress?.findFailures ?? 0) >= STRUGGLE_THRESHOLD;
      },

      // Count of completed techniques
      getCompletionCount: (): number => {
        const visibleTechniqueIds = new Set(
          TECHNIQUE_METADATA.filter((t) => t.hasSolver && isTechniqueLessonVisible(t)).map((t) => t.id),
        );
        return Object.values(get().techniques).filter(
          (p) => p.isCompleted && visibleTechniqueIds.has(p.techniqueId),
        ).length;
      },

      // Total technique count (only solver-backed techniques)
      getTotalCount: (): number => {
        return TECHNIQUE_METADATA.filter((t) => t.hasSolver && isTechniqueLessonVisible(t)).length;
      },

      // Overall progress (0-1, only solver-backed techniques)
      getOverallProgress: (): number => {
        const visibleTechniqueIds = new Set(
          TECHNIQUE_METADATA.filter((t) => t.hasSolver && isTechniqueLessonVisible(t)).map((t) => t.id),
        );
        const total = visibleTechniqueIds.size;
        if (total === 0) return 0;
        const completed = Object.values(get().techniques).filter(
          (p) => p.isCompleted && visibleTechniqueIds.has(p.techniqueId),
        ).length;
        return completed / total;
      },
    })),
  ),
);

// ============================================
// Selectors
// ============================================

export const useCurrentTechniqueId = () =>
  useTechniqueProgressStore((s) => s.currentTechniqueId);

// Stable empty-progress cache to avoid creating new objects in selectors
// (returning a new object from a Zustand selector on every call causes infinite re-renders)
const emptyProgressCache: Record<string, TechniqueProgress> = {};
function getEmptyProgress(id: string): TechniqueProgress {
  if (!emptyProgressCache[id]) {
    emptyProgressCache[id] = createEmptyProgress(id);
  }
  return emptyProgressCache[id];
}

export const useTechniqueProgress = (techniqueId: string) =>
  useTechniqueProgressStore((s) => s.techniques[techniqueId] ?? getEmptyProgress(techniqueId));

export const useCompletionCount = () =>
  useTechniqueProgressStore((s) =>
    Object.values(s.techniques).filter((p) => {
      const metadata = TECHNIQUE_METADATA.find((t) => t.id === p.techniqueId);
      return Boolean(metadata?.hasSolver && metadata && isTechniqueLessonVisible(metadata) && p.isCompleted);
    }).length,
  );

export const useIsLoaded = () =>
  useTechniqueProgressStore((s) => s.isLoaded);
