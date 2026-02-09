import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { getTechniqueMetadata } from '../data/techniqueMetadata';
import { renderSteps, RenderedStep } from '../data/techniqueSteps';
import {
  getCuratedPuzzle,
  generateWithFallback,
} from '../engine/techniqueGenerator';
import { CURATED_PUZZLE_BANK } from '../data/techniquePuzzleBank';
import {
  getCachedPuzzle,
  consumeAndRefill,
} from '../services/puzzleCacheService';
import {
  validateSelection,
  PlacementSelection,
  EliminationSelection,
  ValidationResult,
  isPlacementTechnique,
} from '../engine/validation';
import { useTechniqueProgressStore } from '../stores/techniqueProgressStore';
import { triggerHaptic, ImpactFeedbackStyle } from '../utils/haptics';
import { Position, positionKey } from '../engine/types';
import { TechniqueResult } from '../engine/solver/types';

// ============================================
// Types (exported for sub-components)
// ============================================

export type PracticeMode = 'loading' | 'intro' | 'demo' | 'find-it' | 'error' | 'coming-soon';
export type FindPhase = 'pattern' | 'elimination';

export interface PuzzleState {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
  steps: RenderedStep[];
}

// ============================================
// Helpers (private)
// ============================================

/**
 * Get the next puzzle for a technique using the cache-first, curated-fallback
 * pattern. Supabase is never called synchronously — this is always instant.
 */
function getNextPuzzle(techniqueId: string): {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
} | null {
  // 1. Try cache (synchronous, instant)
  const cached = getCachedPuzzle(techniqueId);
  if (cached) {
    consumeAndRefill(techniqueId, cached.id);
    return {
      puzzle: cached.puzzle,
      solution: cached.solution,
      techniqueResult: cached.techniqueResult,
    };
  }

  // 2. Cache miss: fall back to curated bank (synchronous, instant)
  const curated = getCuratedPuzzle(CURATED_PUZZLE_BANK, techniqueId);
  if (curated.success && curated.puzzle && curated.solution && curated.techniqueResult) {
    return {
      puzzle: curated.puzzle,
      solution: curated.solution,
      techniqueResult: curated.techniqueResult,
    };
  }

  return null;
}

/** Convert a raw puzzle result into a PuzzleState with rendered steps. */
function toPuzzleState(raw: {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
}): PuzzleState {
  return {
    puzzle: raw.puzzle,
    solution: raw.solution,
    techniqueResult: raw.techniqueResult,
    steps: renderSteps(raw.techniqueResult),
  };
}

/**
 * Deduplicated puzzle-loading logic. Tries the instant path (cache + curated),
 * then falls back to on-device generation with a setTimeout to avoid blocking.
 */
function loadPuzzle(
  techniqueId: string,
  onSuccess: (ps: PuzzleState) => void,
  onError: (msg?: string) => void,
  setMode: (m: PracticeMode) => void,
) {
  // 1. Try instant paths (cache + curated bank)
  const next = getNextPuzzle(techniqueId);
  if (next) {
    onSuccess(toPuzzleState(next));
    return;
  }

  // 2. No instant puzzle — fall back to on-device generation
  setMode('loading');
  setTimeout(() => {
    const result = generateWithFallback(techniqueId, CURATED_PUZZLE_BANK, {
      maxRetries: 100,
      timeoutMs: 5000,
    });
    if (result.success && result.puzzle && result.solution && result.techniqueResult) {
      onSuccess(toPuzzleState({
        puzzle: result.puzzle,
        solution: result.solution,
        techniqueResult: result.techniqueResult,
      }));
    } else {
      onError();
    }
  }, 50);
}

// ============================================
// Hook
// ============================================

export function useTechniquePractice() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const techniqueId = id ?? '';
  const metadata = getTechniqueMetadata(techniqueId);

  // ---- State ----
  const [mode, setMode] = useState<PracticeMode>('loading');
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const demoStartTime = useRef<number>(0);

  // Two-phase selection for elimination techniques
  const [findPhase, setFindPhase] = useState<FindPhase>('pattern');
  const [patternCells, setPatternCells] = useState<Set<string>>(new Set());
  const [eliminationCells, setEliminationCells] = useState<Set<string>>(new Set());

  const isElimination = puzzleState
    ? !isPlacementTechnique(puzzleState.techniqueResult.techniqueName)
    : false;

  // ---- Store ----
  const completeDemo = useTechniqueProgressStore((s) => s.completeDemo);
  const recordFindAttempt = useTechniqueProgressStore((s) => s.recordFindAttempt);

  // ---- Shared helpers ----
  const resetFindState = useCallback(() => {
    setValidationResult(null);
    setSelectedCells(new Set());
    setPatternCells(new Set());
    setEliminationCells(new Set());
    setFindPhase('pattern');
  }, []);

  // ---- Mochi cat message ----
  const mochiMessage = useMemo((): string | null => {
    if (mode === 'demo' && puzzleState) {
      return puzzleState.steps[currentStep]?.text ?? null;
    }
    if (mode === 'find-it' && puzzleState) {
      if (validationResult) {
        return validationResult.feedback;
      }
      if (!isElimination) {
        return 'Tap the cell where you can apply this technique.';
      }
      return findPhase === 'pattern'
        ? 'Tap the cells that form the pattern (e.g., the pair, triple, or wings).'
        : 'Now tap the cells where candidates can be eliminated.';
    }
    return null;
  }, [mode, puzzleState, currentStep, validationResult, isElimination, findPhase]);

  // ---- Puzzle generation ----
  const generatePuzzle = useCallback(() => {
    setCurrentStep(0);
    setSelectedCells(new Set());
    setValidationResult(null);
    setGenerationError(null);

    loadPuzzle(
      techniqueId,
      (ps) => {
        setPuzzleState(ps);
        setMode('intro');
      },
      () => {
        setGenerationError('Could not find a suitable puzzle for this technique.');
        setMode('error');
      },
      setMode,
    );
  }, [techniqueId]);

  // Generate puzzle on mount (skip for techniques without solvers)
  useEffect(() => {
    if (techniqueId && metadata?.hasSolver) {
      generatePuzzle();
    } else if (techniqueId && metadata && !metadata.hasSolver) {
      setMode('coming-soon');
    }
  }, [techniqueId]);

  // ---- Handlers ----

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleStartDemo = useCallback(() => {
    setMode('demo');
    setCurrentStep(0);
    demoStartTime.current = Date.now();
    triggerHaptic(ImpactFeedbackStyle.Light);
  }, []);

  const handleNextStep = useCallback(() => {
    if (!puzzleState) return;

    if (currentStep < puzzleState.steps.length - 1) {
      setCurrentStep((s) => s + 1);
      triggerHaptic(ImpactFeedbackStyle.Light);
    } else {
      // Demo complete
      const timeSeconds = Math.round((Date.now() - demoStartTime.current) / 1000);
      completeDemo(techniqueId, timeSeconds);
      triggerHaptic(ImpactFeedbackStyle.Medium);

      // Load a new puzzle for find-it mode
      loadPuzzle(
        techniqueId,
        (ps) => {
          setPuzzleState(ps);
          setMode('find-it');
          resetFindState();
        },
        () => {
          setGenerationError('Could not generate a practice puzzle.');
          setMode('error');
        },
        setMode,
      );
    }
  }, [puzzleState, currentStep, techniqueId, completeDemo, resetFindState]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      triggerHaptic(ImpactFeedbackStyle.Light);
    }
  }, [currentStep]);

  const handleCellPress = useCallback((row: number, col: number) => {
    if (mode !== 'find-it' || !puzzleState) return;

    const key = positionKey({ row, col });

    if (!isElimination) {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.clear();
          next.add(key);
        }
        return next;
      });
    } else if (findPhase === 'pattern') {
      setPatternCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    } else {
      setEliminationCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }
    triggerHaptic(ImpactFeedbackStyle.Light);
  }, [mode, puzzleState, isElimination, findPhase]);

  const handleConfirmPattern = useCallback(() => {
    setFindPhase('elimination');
    triggerHaptic(ImpactFeedbackStyle.Light);
  }, []);

  const handleBackToPattern = useCallback(() => {
    setFindPhase('pattern');
    setEliminationCells(new Set());
    triggerHaptic(ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmitSelection = useCallback(() => {
    if (!puzzleState || mode !== 'find-it') return;

    if (!isElimination) {
      const selectedPositions = Array.from(selectedCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });

      if (selectedPositions.length !== 1) {
        setValidationResult({
          correct: false,
          patternCorrect: false,
          eliminationCorrect: false,
          placementCorrect: false,
          feedback: 'Select exactly one cell where you think the value should be placed.',
        });
        return;
      }

      const expected = puzzleState.techniqueResult.placements[0];
      const selection: PlacementSelection = {
        type: 'placement',
        cell: selectedPositions[0],
        value: expected?.value ?? 0,
      };

      const result = validateSelection(selection, puzzleState.techniqueResult, false);
      setValidationResult(result);
      recordFindAttempt(techniqueId, result.correct);
      triggerHaptic(result.correct ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium);
    } else {
      const patternPositions = Array.from(patternCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });
      const eliminationPositions = Array.from(eliminationCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });

      const selection: EliminationSelection = {
        type: 'elimination',
        patternCells: patternPositions,
        eliminationCells: eliminationPositions,
      };

      const result = validateSelection(selection, puzzleState.techniqueResult, false);
      setValidationResult(result);
      recordFindAttempt(techniqueId, result.correct);
      triggerHaptic(result.correct ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium);
    }
  }, [puzzleState, mode, isElimination, selectedCells, patternCells, eliminationCells, techniqueId, recordFindAttempt]);

  const handleTryAnother = useCallback(() => {
    resetFindState();
    loadPuzzle(
      techniqueId,
      (ps) => {
        setPuzzleState(ps);
        setMode('find-it');
      },
      () => {
        setMode('error');
      },
      setMode,
    );
  }, [techniqueId, resetFindState]);

  // ---- Computed board highlights ----

  const boardHighlightSet = useMemo((): Set<string> => {
    if (mode === 'find-it') {
      return isElimination ? new Set([...patternCells, ...eliminationCells]) : selectedCells;
    }
    // Demo mode
    const set = new Set<string>();
    if (mode === 'demo' && puzzleState) {
      const step = puzzleState.steps[currentStep];
      if (step) {
        step.highlightCells.forEach((pos) => set.add(positionKey(pos)));
      }
    }
    return set;
  }, [mode, isElimination, patternCells, eliminationCells, selectedCells, puzzleState, currentStep]);

  const boardSecondarySet = useMemo((): Set<string> => {
    return mode === 'find-it' && isElimination ? eliminationCells : new Set<string>();
  }, [mode, isElimination, eliminationCells]);

  // ---- Return ----

  return {
    // Identifiers
    techniqueId,
    metadata,

    // State
    mode,
    puzzleState,
    currentStep,
    mochiMessage,
    isElimination,
    findPhase,
    validationResult,
    generationError,

    // Board highlights
    boardHighlightSet,
    boardSecondarySet,

    // Cell counts (for disabling buttons in sub-components)
    patternCellCount: patternCells.size,
    eliminationCellCount: eliminationCells.size,
    selectedCellCount: selectedCells.size,

    // Handlers
    handleBack,
    handleStartDemo,
    handleNextStep,
    handlePreviousStep,
    handleCellPress,
    handleConfirmPattern,
    handleBackToPattern,
    handleSubmitSelection,
    handleTryAnother,
    resetFindState,
    generatePuzzle,
  };
}
