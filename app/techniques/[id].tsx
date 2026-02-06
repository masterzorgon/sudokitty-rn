// Technique practice screen - Guided demo + Find-it mode
// Dynamic route: /techniques/[id] (e.g., /techniques/naked-single)

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme';
import { getTechniqueMetadata, TechniqueMetadata } from '../../src/data/techniqueMetadata';
import { renderSteps, RenderedStep } from '../../src/data/techniqueSteps';
import {
  generatePuzzleForTechnique,
  generateWithFallback,
  TechniqueGenerationResult,
  TECHNIQUE_IDS,
} from '../../src/engine/techniqueGenerator';
import { CURATED_PUZZLE_BANK } from '../../src/data/techniquePuzzleBank';
import {
  validateSelection,
  PlacementSelection,
  EliminationSelection,
  ValidationResult,
  isPlacementTechnique,
} from '../../src/engine/validation';
import { useTechniqueProgressStore } from '../../src/stores/techniqueProgressStore';
import { SudokuBoard } from '../../src/components/board';
import { triggerHaptic, ImpactFeedbackStyle } from '../../src/utils/haptics';
import { Position, positionKey, BOARD_SIZE } from '../../src/engine/types';
import { TechniqueResult, TechniqueLevel } from '../../src/engine/solver/types';

// ============================================
// Types
// ============================================

type PracticeMode = 'loading' | 'intro' | 'demo' | 'find-it' | 'error' | 'coming-soon';
type FindPhase = 'pattern' | 'elimination';

interface PuzzleState {
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
  steps: RenderedStep[];
}

// ============================================
// Constants
// ============================================

const GENERATION_CONFIG = {
  maxRetries: 100,
  timeoutMs: 2000,
};

// ============================================
// Main Screen
// ============================================

export default function TechniquePracticeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const techniqueId = id ?? '';
  const metadata = getTechniqueMetadata(techniqueId);

  // State
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

  // Store
  const completeDemo = useTechniqueProgressStore((s) => s.completeDemo);
  const recordFindAttempt = useTechniqueProgressStore((s) => s.recordFindAttempt);

  // Reset find-it state (shared by multiple handlers)
  const resetFindState = useCallback(() => {
    setValidationResult(null);
    setSelectedCells(new Set());
    setPatternCells(new Set());
    setEliminationCells(new Set());
    setFindPhase('pattern');
  }, []);

  // Generate puzzle on mount (skip for techniques without solvers)
  useEffect(() => {
    if (techniqueId && metadata?.hasSolver) {
      generatePuzzle();
    } else if (techniqueId && metadata && !metadata.hasSolver) {
      setMode('coming-soon');
    }
  }, [techniqueId]);

  const generatePuzzle = useCallback(() => {
    setMode('loading');
    setGenerationError(null);
    setCurrentStep(0);
    setSelectedCells(new Set());
    setValidationResult(null);

    // Use setTimeout to avoid blocking the UI thread
    setTimeout(() => {
      const result = generateWithFallback(techniqueId, CURATED_PUZZLE_BANK, GENERATION_CONFIG);

      if (result.success && result.puzzle && result.solution && result.techniqueResult) {
        const steps = renderSteps(result.techniqueResult);
        setPuzzleState({
          puzzle: result.puzzle,
          solution: result.solution,
          techniqueResult: result.techniqueResult,
          steps,
        });
        setMode('intro');
      } else {
        setGenerationError(
          result.error === 'TIMEOUT'
            ? 'Puzzle generation took too long.'
            : 'Could not find a suitable puzzle for this technique.'
        );
        setMode('error');
      }
    }, 50);
  }, [techniqueId]);

  // ============================================
  // Handlers
  // ============================================

  const handleBack = () => {
    router.back();
  };

  const handleStartDemo = () => {
    setMode('demo');
    setCurrentStep(0);
    demoStartTime.current = Date.now();
    triggerHaptic(ImpactFeedbackStyle.Light);
  };

  const handleNextStep = () => {
    if (!puzzleState) return;

    if (currentStep < puzzleState.steps.length - 1) {
      setCurrentStep((s) => s + 1);
      triggerHaptic(ImpactFeedbackStyle.Light);
    } else {
      // Demo complete
      const timeSeconds = Math.round((Date.now() - demoStartTime.current) / 1000);
      completeDemo(techniqueId, timeSeconds);
      triggerHaptic(ImpactFeedbackStyle.Medium);

      // Generate a new puzzle for find-it mode
      setMode('loading');
      setTimeout(() => {
        const result = generateWithFallback(techniqueId, CURATED_PUZZLE_BANK, GENERATION_CONFIG);
        if (result.success && result.puzzle && result.solution && result.techniqueResult) {
          const steps = renderSteps(result.techniqueResult);
          setPuzzleState({
            puzzle: result.puzzle,
            solution: result.solution,
            techniqueResult: result.techniqueResult,
            steps,
          });
          setMode('find-it');
          resetFindState();
        } else {
          setMode('error');
          setGenerationError('Could not generate a practice puzzle.');
        }
      }, 50);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      triggerHaptic(ImpactFeedbackStyle.Light);
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (mode !== 'find-it' || !puzzleState) return;

    const key = positionKey({ row, col });

    if (!isElimination) {
      // Placement: single cell toggle
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          // Only allow one cell for placement
          next.clear();
          next.add(key);
        }
        return next;
      });
    } else if (findPhase === 'pattern') {
      // Elimination phase 1: select pattern cells
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
      // Elimination phase 2: select elimination targets
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
  };

  const handleConfirmPattern = () => {
    // Move from pattern phase to elimination phase
    setFindPhase('elimination');
    triggerHaptic(ImpactFeedbackStyle.Light);
  };

  const handleBackToPattern = () => {
    setFindPhase('pattern');
    setEliminationCells(new Set());
    triggerHaptic(ImpactFeedbackStyle.Light);
  };

  const handleSubmitSelection = () => {
    if (!puzzleState || mode !== 'find-it') return;

    if (!isElimination) {
      // Placement technique: user selects one cell
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
      // Elimination technique: two-phase validation
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
  };

  const handleTryAnother = () => {
    resetFindState();
    setMode('loading');
    setTimeout(() => {
      const result = generateWithFallback(techniqueId, CURATED_PUZZLE_BANK, GENERATION_CONFIG);
      if (result.success && result.puzzle && result.solution && result.techniqueResult) {
        const steps = renderSteps(result.techniqueResult);
        setPuzzleState({
          puzzle: result.puzzle,
          solution: result.solution,
          techniqueResult: result.techniqueResult,
          steps,
        });
        setMode('find-it');
      } else {
        setMode('error');
      }
    }, 50);
  };

  // ============================================
  // Render Helpers
  // ============================================

  if (!metadata) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Technique not found: {techniqueId}</Text>
      </SafeAreaView>
    );
  }

  // Compute highlight set for the board
  const highlightSet = new Set<string>();
  if (mode === 'demo' && puzzleState) {
    const step = puzzleState.steps[currentStep];
    if (step) {
      step.highlightCells.forEach((pos) => highlightSet.add(positionKey(pos)));
    }
  }

  // For find-it mode, compute separate highlight sets for pattern and elimination cells
  const boardHighlightSet = mode === 'find-it'
    ? (isElimination ? new Set([...patternCells, ...eliminationCells]) : selectedCells)
    : highlightSet;

  // Secondary highlight (elimination cells get a different color)
  const boardSecondarySet = mode === 'find-it' && isElimination ? eliminationCells : new Set<string>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{metadata.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: `${metadata.color}20` }]}>
            <Text style={[styles.categoryBadgeText, { color: metadata.color }]}>
              {metadata.category}
            </Text>
          </View>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Loading state */}
      {mode === 'loading' && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={colors.softOrange} />
          <Text style={styles.loadingText}>generating puzzle...</Text>
        </View>
      )}

      {/* Error state */}
      {mode === 'error' && (
        <View style={styles.centeredContent}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{generationError}</Text>
          <Pressable onPress={generatePuzzle} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>try again</Text>
          </Pressable>
        </View>
      )}

      {/* Coming soon state (techniques without solvers) */}
      {mode === 'coming-soon' && metadata && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.introContent}>
          <View style={styles.introCard}>
            <View style={[styles.introIcon, { backgroundColor: `${metadata.color}15` }]}>
              <Feather name={metadata.icon as any} size={32} color={metadata.color} />
            </View>
            <Text style={styles.introTitle}>{metadata.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: `${metadata.color}20`, alignSelf: 'center' }]}>
              <Text style={[styles.categoryBadgeText, { color: metadata.color }]}>
                {metadata.category}
              </Text>
            </View>
            <Text style={styles.introDescription}>{metadata.longDescription}</Text>
            <View style={styles.comingSoonBadge}>
              <Feather name="clock" size={14} color={colors.textLight} />
              <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
            </View>
          </View>

          <Pressable onPress={handleBack} style={styles.backToListButton}>
            <Feather name="arrow-left" size={16} color={colors.textSecondary} />
            <Text style={styles.backToListText}>back to techniques</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Intro state */}
      {mode === 'intro' && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.introContent}>
          <View style={styles.introCard}>
            <View style={[styles.introIcon, { backgroundColor: `${metadata.color}15` }]}>
              <Feather name={metadata.icon as any} size={32} color={metadata.color} />
            </View>
            <Text style={styles.introTitle}>{metadata.name}</Text>
            <Text style={styles.introDescription}>{metadata.longDescription}</Text>
          </View>

          <Pressable onPress={handleStartDemo} style={styles.startButton}>
            <Text style={styles.startButtonText}>start demo</Text>
            <Feather name="play" size={16} color="#FFF" />
          </Pressable>
        </Animated.View>
      )}

      {/* Demo mode */}
      {mode === 'demo' && puzzleState && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.gameContent}>
          {/* Board */}
          <View style={styles.boardContainer}>
            <MiniBoard
              puzzle={puzzleState.puzzle}
              highlightCells={boardHighlightSet}
            />
          </View>

          {/* Step guide */}
          <Animated.View
            key={`step-${currentStep}`}
            entering={FadeInUp.duration(200)}
            style={styles.stepGuide}
          >
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              {puzzleState.steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    i === currentStep && styles.stepDotActive,
                    i < currentStep && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Step text */}
            <Text style={styles.stepText}>
              {puzzleState.steps[currentStep]?.text}
            </Text>

            {/* Mascot hint */}
            {puzzleState.steps[currentStep]?.mascotHint && (
              <Text style={styles.mascotHint}>
                {puzzleState.steps[currentStep].mascotHint}
              </Text>
            )}

            {/* Navigation */}
            <View style={styles.stepNav}>
              <Pressable
                onPress={handlePreviousStep}
                style={[styles.stepNavButton, currentStep === 0 && styles.stepNavDisabled]}
                disabled={currentStep === 0}
              >
                <Feather name="chevron-left" size={20} color={currentStep === 0 ? colors.textLight : colors.textPrimary} />
                <Text style={[styles.stepNavText, currentStep === 0 && styles.stepNavTextDisabled]}>back</Text>
              </Pressable>

              <Pressable onPress={handleNextStep} style={styles.stepNavButtonPrimary}>
                <Text style={styles.stepNavTextPrimary}>
                  {currentStep === puzzleState.steps.length - 1 ? 'start practice' : 'next'}
                </Text>
                <Feather
                  name={currentStep === puzzleState.steps.length - 1 ? 'play' : 'chevron-right'}
                  size={16}
                  color="#FFF"
                />
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Find-it mode */}
      {mode === 'find-it' && puzzleState && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.gameContent}>
          {/* Board */}
          <View style={styles.boardContainer}>
            <MiniBoard
              puzzle={puzzleState.puzzle}
              highlightCells={boardHighlightSet}
              secondaryHighlightCells={boardSecondarySet}
              onCellPress={handleCellPress}
              interactive
            />
          </View>

          {/* Instructions / Validation */}
          <View style={styles.findItGuide}>
            {!validationResult ? (
              <>
                {/* Phase indicator for elimination techniques */}
                {isElimination && (
                  <View style={styles.phaseIndicator}>
                    <View style={[styles.phaseDot, findPhase === 'pattern' && styles.phaseDotActive]} />
                    <Text style={[styles.phaseLabel, findPhase === 'pattern' && styles.phaseLabelActive]}>
                      pattern
                    </Text>
                    <Feather name="chevron-right" size={14} color={colors.textLight} />
                    <View style={[styles.phaseDot, findPhase === 'elimination' && styles.phaseDotActiveSecondary]} />
                    <Text style={[styles.phaseLabel, findPhase === 'elimination' && styles.phaseLabelActive]}>
                      eliminations
                    </Text>
                  </View>
                )}

                <Text style={styles.findItTitle}>
                  {!isElimination
                    ? 'your turn!'
                    : findPhase === 'pattern'
                      ? 'find the pattern'
                      : 'select eliminations'}
                </Text>
                <Text style={styles.findItText}>
                  {!isElimination
                    ? 'Tap the cell where you can apply this technique.'
                    : findPhase === 'pattern'
                      ? 'Tap the cells that form the pattern (e.g., the pair, triple, or wings).'
                      : 'Now tap the cells where candidates can be eliminated.'}
                </Text>

                <View style={styles.findItActions}>
                  {isElimination && findPhase === 'pattern' ? (
                    // Phase 1: Confirm pattern, move to elimination
                    <Pressable
                      onPress={handleConfirmPattern}
                      style={[
                        styles.submitButton,
                        patternCells.size === 0 && styles.submitButtonDisabled,
                      ]}
                      disabled={patternCells.size === 0}
                    >
                      <Text style={styles.submitButtonText}>confirm pattern</Text>
                      <Feather name="chevron-right" size={14} color="#FFF" />
                    </Pressable>
                  ) : isElimination && findPhase === 'elimination' ? (
                    // Phase 2: Back to pattern or submit
                    <>
                      <Pressable onPress={handleBackToPattern} style={styles.retryInlineButton}>
                        <Feather name="chevron-left" size={14} color={colors.textSecondary} />
                        <Text style={styles.retryInlineText}>back</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSubmitSelection}
                        style={[
                          styles.submitButton,
                          eliminationCells.size === 0 && styles.submitButtonDisabled,
                        ]}
                        disabled={eliminationCells.size === 0}
                      >
                        <Text style={styles.submitButtonText}>check answer</Text>
                      </Pressable>
                    </>
                  ) : (
                    // Placement: single submit
                    <Pressable
                      onPress={handleSubmitSelection}
                      style={[
                        styles.submitButton,
                        selectedCells.size === 0 && styles.submitButtonDisabled,
                      ]}
                      disabled={selectedCells.size === 0}
                    >
                      <Text style={styles.submitButtonText}>check answer</Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                {/* Validation feedback */}
                <View style={[
                  styles.feedbackCard,
                  validationResult.correct ? styles.feedbackCorrect : styles.feedbackIncorrect,
                ]}>
                  <Feather
                    name={validationResult.correct ? 'check-circle' : 'x-circle'}
                    size={24}
                    color={validationResult.correct ? '#4CAF50' : colors.coral}
                  />
                  <Text style={styles.feedbackText}>{validationResult.feedback}</Text>
                </View>

                <View style={styles.findItActions}>
                  {validationResult.correct ? (
                    <Pressable onPress={handleTryAnother} style={styles.submitButton}>
                      <Text style={styles.submitButtonText}>try another</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => { resetFindState(); }}
                        style={styles.retryInlineButton}
                      >
                        <Text style={styles.retryInlineText}>try again</Text>
                      </Pressable>
                      <Pressable onPress={handleTryAnother} style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>new puzzle</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// Mini Board Component (simplified for practice)
// ============================================

function MiniBoard({
  puzzle,
  highlightCells,
  secondaryHighlightCells,
  onCellPress,
  interactive = false,
}: {
  puzzle: number[][];
  highlightCells: Set<string>;
  secondaryHighlightCells?: Set<string>;
  onCellPress?: (row: number, col: number) => void;
  interactive?: boolean;
}) {
  return (
    <View style={miniStyles.board}>
      {puzzle.map((row, rowIndex) => (
        <View key={rowIndex} style={miniStyles.row}>
          {row.map((value, colIndex) => {
            const key = positionKey({ row: rowIndex, col: colIndex });
            const isHighlighted = highlightCells.has(key);
            const isSecondary = secondaryHighlightCells?.has(key) ?? false;
            const isBoxBorderRight = (colIndex + 1) % 3 === 0 && colIndex < 8;
            const isBoxBorderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                style={[
                  miniStyles.cell,
                  isHighlighted && !isSecondary && miniStyles.cellHighlighted,
                  isSecondary && miniStyles.cellSecondaryHighlighted,
                  isBoxBorderRight && miniStyles.cellBoxRight,
                  isBoxBorderBottom && miniStyles.cellBoxBottom,
                ]}
                onPress={interactive ? () => onCellPress?.(rowIndex, colIndex) : undefined}
                disabled={!interactive}
              >
                <Text
                  style={[
                    miniStyles.cellText,
                    value === 0 && miniStyles.cellTextEmpty,
                    isHighlighted && !isSecondary && miniStyles.cellTextHighlighted,
                    isSecondary && miniStyles.cellTextSecondary,
                  ]}
                >
                  {value !== 0 ? value : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 18,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'OpenRunde-Medium',
  },

  // Centered content (loading/error)
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.softOrange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.button,
    color: '#FFF',
  },

  // Intro
  introContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.medium,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    fontSize: 22,
  },
  introDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.textLight}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    fontFamily: 'OpenRunde-Medium',
    color: colors.textLight,
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gridLine,
  },
  backToListText: {
    ...typography.button,
    color: colors.textSecondary,
    fontSize: 15,
  },
  startButton: {
    backgroundColor: colors.softOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  startButtonText: {
    ...typography.button,
    color: '#FFF',
    fontSize: 16,
  },

  // Game content (demo + find-it)
  gameContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  boardContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  // Step guide
  stepGuide: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gridLine,
  },
  stepDotActive: {
    backgroundColor: colors.softOrange,
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: colors.mint,
  },
  stepText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  mascotHint: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stepNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stepNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stepNavDisabled: {
    opacity: 0.4,
  },
  stepNavText: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 14,
  },
  stepNavTextDisabled: {
    color: colors.textLight,
  },
  stepNavButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  stepNavTextPrimary: {
    ...typography.button,
    color: '#FFF',
    fontSize: 14,
  },

  // Find-it mode
  findItGuide: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  findItTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 18,
  },
  findItText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  findItActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  submitButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  submitButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  retryInlineButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gridLine,
  },
  retryInlineText: {
    ...typography.button,
    color: colors.textSecondary,
  },

  // Phase indicator for elimination techniques
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gridLine,
  },
  phaseDotActive: {
    backgroundColor: colors.softOrange,
  },
  phaseDotActiveSecondary: {
    backgroundColor: colors.coral,
  },
  phaseLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: 'OpenRunde-Medium',
  },
  phaseLabelActive: {
    color: colors.textPrimary,
  },

  // Validation feedback
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  feedbackIncorrect: {
    backgroundColor: 'rgba(255, 92, 80, 0.1)',
  },
  feedbackText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});

// ============================================
// Mini Board Styles
// ============================================

const CELL_SIZE = 36;

const miniStyles = StyleSheet.create({
  board: {
    borderWidth: 2,
    borderColor: colors.boxBorder,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.gridLine,
    backgroundColor: colors.cellBackground,
  },
  cellHighlighted: {
    backgroundColor: colors.cellSelected,
  },
  cellSecondaryHighlighted: {
    backgroundColor: 'rgba(255, 92, 80, 0.15)', // coral tint for elimination targets
  },
  cellBoxRight: {
    borderRightWidth: 2,
    borderRightColor: colors.boxBorder,
  },
  cellBoxBottom: {
    borderBottomWidth: 2,
    borderBottomColor: colors.boxBorder,
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'OpenRunde-Semibold',
    color: colors.givenText,
  },
  cellTextEmpty: {
    color: 'transparent',
  },
  cellTextHighlighted: {
    color: colors.softOrange,
  },
  cellTextSecondary: {
    color: colors.coral,
  },
});
