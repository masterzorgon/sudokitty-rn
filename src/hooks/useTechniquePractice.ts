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
import { usePremiumStore } from '../stores/premiumStore';
import { playFeedback } from '../utils/feedback';
import { Position, positionKey } from '../engine/types';
import { TechniqueResult } from '../engine/solver/types';
import { useSequence } from './useSequence';

// ============================================
// Types
// ============================================

export type TechniquePhase = 'loading' | 'overview' | 'demo' | 'practice' | 'complete' | 'error' | 'coming-soon' | 'locked';
export type FindPhase = 'pattern' | 'elimination';

export interface PuzzleState {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
  steps: RenderedStep[];
}

// ============================================
// Helpers
// ============================================

function getNextPuzzle(techniqueId: string): {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
} | null {
  const cached = getCachedPuzzle(techniqueId);
  if (cached) {
    consumeAndRefill(techniqueId, cached.id);
    return { puzzle: cached.puzzle, solution: cached.solution, techniqueResult: cached.techniqueResult };
  }
  const curated = getCuratedPuzzle(CURATED_PUZZLE_BANK, techniqueId);
  if (curated.success && curated.puzzle && curated.solution && curated.techniqueResult) {
    return { puzzle: curated.puzzle, solution: curated.solution, techniqueResult: curated.techniqueResult };
  }
  return null;
}

function toPuzzleState(raw: {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
}): PuzzleState {
  return { ...raw, steps: renderSteps(raw.techniqueResult) };
}

// ============================================
// Hook
// ============================================

export function useTechniquePractice() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const techniqueId = id ?? '';
  const metadata = getTechniqueMetadata(techniqueId);
  const isPremium = usePremiumStore((s) => s.isPremium);

  // ---- Puzzle state ----
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [practicePuzzle, setPracticePuzzle] = useState<PuzzleState | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [statusOverride, setStatusOverride] = useState<'loading' | 'error' | 'coming-soon' | 'locked' | null>(null);
  const demoStartTime = useRef<number>(0);

  const [findPhase, setFindPhase] = useState<FindPhase>('pattern');
  const [patternCells, setPatternCells] = useState<Set<string>>(new Set());
  const [eliminationCells, setEliminationCells] = useState<Set<string>>(new Set());

  const isElimination = practicePuzzle
    ? !isPlacementTechnique(practicePuzzle.techniqueResult.techniqueName)
    : false;

  // ---- Stores ----
  const completeDemo = useTechniqueProgressStore((s) => s.completeDemo);
  const recordFindAttempt = useTechniqueProgressStore((s) => s.recordFindAttempt);

  // ---- Sequence ----
  // Total steps: 1 (overview) + N (demo) + 1 (practice) + 1 (complete) = N + 3
  const demoStepCount = puzzleState?.steps.length ?? 0;
  const totalSteps = demoStepCount + 3;

  const sequence = useSequence({ totalSteps });

  // Derive the current phase from the sequence step
  const phase: TechniquePhase = useMemo(() => {
    if (statusOverride) return statusOverride;
    if (!puzzleState) return 'loading';
    if (sequence.currentStep === 0) return 'overview';
    if (sequence.currentStep <= demoStepCount) return 'demo';
    if (sequence.currentStep === demoStepCount + 1) return 'practice';
    return 'complete';
  }, [statusOverride, puzzleState, sequence.currentStep, demoStepCount]);

  // The demo step index (0-based) within the demo phase
  const demoStepIndex = useMemo(() => {
    if (phase !== 'demo') return 0;
    return sequence.currentStep - 1;
  }, [phase, sequence.currentStep]);

  // ---- Shared helpers ----
  const resetFindState = useCallback(() => {
    setValidationResult(null);
    setSelectedCells(new Set());
    setPatternCells(new Set());
    setEliminationCells(new Set());
    setFindPhase('pattern');
  }, []);

  // ---- Mochi message ----
  const mochiMessage = useMemo((): string | null => {
    if (phase === 'demo' && puzzleState) {
      return puzzleState.steps[demoStepIndex]?.text ?? null;
    }
    if (phase === 'practice' && practicePuzzle) {
      if (validationResult) return validationResult.feedback;
      if (!isElimination) return 'Tap the cell where you can apply this technique.';
      return findPhase === 'pattern'
        ? 'Tap the cells that form the pattern (e.g., the pair, triple, or wings).'
        : 'Now tap the cells where candidates can be eliminated.';
    }
    return null;
  }, [phase, puzzleState, demoStepIndex, practicePuzzle, validationResult, isElimination, findPhase]);

  // ---- Puzzle loading ----
  const loadPuzzleAsync = useCallback((
    onSuccess: (ps: PuzzleState) => void,
    onError: () => void,
  ) => {
    const next = getNextPuzzle(techniqueId);
    if (next) {
      onSuccess(toPuzzleState(next));
      return;
    }
    setStatusOverride('loading');
    setTimeout(() => {
      const result = generateWithFallback(techniqueId, CURATED_PUZZLE_BANK, {
        maxRetries: 100,
        timeoutMs: 5000,
      });
      if (result.success && result.puzzle && result.solution && result.techniqueResult) {
        onSuccess(toPuzzleState({ puzzle: result.puzzle, solution: result.solution, techniqueResult: result.techniqueResult }));
      } else {
        onError();
      }
    }, 50);
  }, [techniqueId]);

  const generatePuzzle = useCallback(() => {
    setGenerationError(null);
    setStatusOverride(null);
    sequence.reset();

    loadPuzzleAsync(
      (ps) => {
        setPuzzleState(ps);
        setStatusOverride(null);
      },
      () => {
        setGenerationError('Could not find a suitable puzzle for this technique.');
        setStatusOverride('error');
      },
    );
  }, [techniqueId, loadPuzzleAsync, sequence]);

  // Initial load
  useEffect(() => {
    if (!isPremium && metadata && metadata.level >= 3) {
      setStatusOverride('locked');
    } else if (techniqueId && metadata?.hasSolver) {
      generatePuzzle();
    } else if (techniqueId && metadata && !metadata.hasSolver) {
      setStatusOverride('coming-soon');
    }
  }, [techniqueId, isPremium]);

  // Load practice puzzle when entering practice phase
  useEffect(() => {
    if (phase === 'practice' && !practicePuzzle) {
      resetFindState();
      loadPuzzleAsync(
        (ps) => {
          setPracticePuzzle(ps);
          setStatusOverride(null);
        },
        () => {
          setGenerationError('Could not generate a practice puzzle.');
          setStatusOverride('error');
        },
      );
    }
  }, [phase, practicePuzzle, loadPuzzleAsync, resetFindState]);

  // Record demo start time when entering demo phase
  useEffect(() => {
    if (phase === 'demo' && demoStepIndex === 0) {
      demoStartTime.current = Date.now();
    }
  }, [phase, demoStepIndex]);

  // Record demo completion when leaving last demo step
  const prevPhaseRef = useRef<TechniquePhase>('loading');
  useEffect(() => {
    if (prevPhaseRef.current === 'demo' && phase === 'practice') {
      const timeSeconds = Math.round((Date.now() - demoStartTime.current) / 1000);
      completeDemo(techniqueId, timeSeconds);
    }
    prevPhaseRef.current = phase;
  }, [phase, techniqueId, completeDemo]);

  // ---- Handlers ----
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSequenceNext = useCallback(() => {
    playFeedback('tap');
    sequence.next();
  }, [sequence]);

  const handleSequencePrevious = useCallback(() => {
    playFeedback('tap');
    sequence.previous();
  }, [sequence]);

  const handleCellPress = useCallback((row: number, col: number) => {
    if (phase !== 'practice' || !practicePuzzle) return;
    const key = positionKey({ row, col });

    if (!isElimination) {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) { next.delete(key); } else { next.clear(); next.add(key); }
        return next;
      });
    } else if (findPhase === 'pattern') {
      setPatternCells((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    } else {
      setEliminationCells((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    }
    playFeedback('selection');
  }, [phase, practicePuzzle, isElimination, findPhase]);

  const handleConfirmPattern = useCallback(() => {
    setFindPhase('elimination');
    playFeedback('tap');
  }, []);

  const handleBackToPattern = useCallback(() => {
    setFindPhase('pattern');
    setEliminationCells(new Set());
    playFeedback('tap');
  }, []);

  const handleSubmitSelection = useCallback(() => {
    if (!practicePuzzle || phase !== 'practice') return;

    let result: ValidationResult;

    if (!isElimination) {
      const positions = Array.from(selectedCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });
      if (positions.length !== 1) {
        setValidationResult({
          correct: false, patternCorrect: false, eliminationCorrect: false, placementCorrect: false,
          feedback: 'Select exactly one cell where you think the value should be placed.',
        });
        return;
      }
      const expected = practicePuzzle.techniqueResult.placements[0];
      const selection: PlacementSelection = { type: 'placement', cell: positions[0], value: expected?.value ?? 0 };
      result = validateSelection(selection, practicePuzzle.techniqueResult, false);
    } else {
      const patternPositions = Array.from(patternCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });
      const eliminationPositions = Array.from(eliminationCells).map((key) => {
        const [row, col] = key.split('-').map(Number);
        return { row, col } as Position;
      });
      const selection: EliminationSelection = { type: 'elimination', patternCells: patternPositions, eliminationCells: eliminationPositions };
      result = validateSelection(selection, practicePuzzle.techniqueResult, false);
    }

    setValidationResult(result);
    playFeedback(result.correct ? 'correct' : 'mistake');

    if (result.correct) {
      recordFindAttempt(techniqueId, true);
      setTimeout(() => sequence.next(), 1500);
    }
  }, [practicePuzzle, phase, isElimination, selectedCells, patternCells, eliminationCells, techniqueId, recordFindAttempt, sequence]);

  const handleTryAnother = useCallback(() => {
    resetFindState();
    setPracticePuzzle(null);
    loadPuzzleAsync(
      (ps) => {
        setPracticePuzzle(ps);
        setStatusOverride(null);
      },
      () => setStatusOverride('error'),
    );
  }, [loadPuzzleAsync, resetFindState]);

  // ---- Board highlights ----
  const boardHighlightSet = useMemo((): Set<string> => {
    if (phase === 'practice') {
      return isElimination ? new Set([...patternCells, ...eliminationCells]) : selectedCells;
    }
    if (phase === 'demo' && puzzleState) {
      const set = new Set<string>();
      const step = puzzleState.steps[demoStepIndex];
      if (step) step.highlightCells.forEach((pos) => set.add(positionKey(pos)));
      return set;
    }
    return new Set();
  }, [phase, isElimination, patternCells, eliminationCells, selectedCells, puzzleState, demoStepIndex]);

  const boardSecondarySet = useMemo((): Set<string> => {
    return phase === 'practice' && isElimination ? eliminationCells : new Set<string>();
  }, [phase, isElimination, eliminationCells]);

  return {
    techniqueId,
    metadata,

    // Sequence
    sequence,
    phase,
    demoStepIndex,
    demoStepCount,

    // State
    puzzleState,
    practicePuzzle,
    mochiMessage,
    isElimination,
    findPhase,
    validationResult,
    generationError,

    // Board
    boardHighlightSet,
    boardSecondarySet,

    // Cell counts
    patternCellCount: patternCells.size,
    eliminationCellCount: eliminationCells.size,
    selectedCellCount: selectedCells.size,

    // Handlers
    handleBack,
    handleSequenceNext,
    handleSequencePrevious,
    handleCellPress,
    handleConfirmPattern,
    handleBackToPattern,
    handleSubmitSelection,
    handleTryAnother,
    resetFindState,
    generatePuzzle,
  };
}
