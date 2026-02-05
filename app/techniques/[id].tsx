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

type PracticeMode = 'loading' | 'intro' | 'demo' | 'find-it' | 'error';

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

  // Store
  const completeDemo = useTechniqueProgressStore((s) => s.completeDemo);
  const recordFindAttempt = useTechniqueProgressStore((s) => s.recordFindAttempt);

  // Generate puzzle on mount
  useEffect(() => {
    if (techniqueId) {
      generatePuzzle();
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
          setSelectedCells(new Set());
          setValidationResult(null);
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
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    triggerHaptic(ImpactFeedbackStyle.Light);
  };

  const handleSubmitSelection = () => {
    if (!puzzleState || mode !== 'find-it') return;

    const selectedPositions = Array.from(selectedCells).map((key) => {
      const [row, col] = key.split('-').map(Number);
      return { row, col } as Position;
    });

    let selection;

    if (isPlacementTechnique(puzzleState.techniqueResult.techniqueName)) {
      // For placement techniques, user selects one cell
      // In a full implementation, we'd also ask for the value via the number pad
      // For now, validate cell selection only
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
      selection = {
        type: 'placement' as const,
        cell: selectedPositions[0],
        value: expected?.value ?? 0, // Auto-fill value for now
      };
    } else {
      // For elimination techniques, split selection into pattern and elimination cells
      // The pattern cells are the highlighted cells from the solver
      // For now, just validate that user selected the pattern cells
      selection = {
        type: 'elimination' as const,
        patternCells: selectedPositions,
        eliminationCells: [], // User doesn't need to select elimination targets in lenient mode
      };

      // Actually, let's validate just the pattern cells for the initial implementation
      // (Phase 2 can add the elimination selection UI)
      const result = validateSelection(
        {
          type: 'elimination',
          patternCells: selectedPositions,
          eliminationCells: puzzleState.techniqueResult.eliminations.map((e) => e.position),
        },
        puzzleState.techniqueResult,
        false,
      );

      setValidationResult(result);
      recordFindAttempt(techniqueId, result.patternCorrect);
      triggerHaptic(result.patternCorrect ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium);
      return;
    }

    const result = validateSelection(selection, puzzleState.techniqueResult, false);
    setValidationResult(result);
    recordFindAttempt(techniqueId, result.correct);
    triggerHaptic(result.correct ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium);
  };

  const handleTryAnother = () => {
    setValidationResult(null);
    setSelectedCells(new Set());
    generatePuzzle();
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

  // Merge selectedCells into highlight for find-it mode
  const boardHighlightSet = mode === 'find-it' ? selectedCells : highlightSet;

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
              onCellPress={handleCellPress}
              interactive
            />
          </View>

          {/* Instructions / Validation */}
          <View style={styles.findItGuide}>
            {!validationResult ? (
              <>
                <Text style={styles.findItTitle}>your turn!</Text>
                <Text style={styles.findItText}>
                  {isPlacementTechnique(puzzleState.techniqueResult.techniqueName)
                    ? 'Tap the cell where you can apply this technique.'
                    : 'Tap the cells that form the pattern for this technique.'}
                </Text>

                <View style={styles.findItActions}>
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
                        onPress={() => {
                          setValidationResult(null);
                          setSelectedCells(new Set());
                        }}
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
  onCellPress,
  interactive = false,
}: {
  puzzle: number[][];
  highlightCells: Set<string>;
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
            const isBoxBorderRight = (colIndex + 1) % 3 === 0 && colIndex < 8;
            const isBoxBorderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                style={[
                  miniStyles.cell,
                  isHighlighted && miniStyles.cellHighlighted,
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
                    isHighlighted && miniStyles.cellTextHighlighted,
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
});
