// Technique practice screen - Guided demo + Find-it mode
// Thin orchestrator: delegates state to useTechniquePractice hook
// and rendering to extracted sub-components.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import { GAME_LAYOUT } from '../../src/constants/layout';
import { useTechniquePractice } from '../../src/hooks/useTechniquePractice';
import {
  TechniqueHeader,
  StepIndicator,
  TechniqueIntro,
  TechniqueDemoView,
  TechniqueFindItView,
} from '../../src/components/technique';
import { AppButton } from '../../src/components/ui/AppButton';
import { presentPaywall } from '../../src/lib/revenueCat';
import { trackPaywallOpened } from '../../src/utils/analytics';

// ============================================
// Main Screen
// ============================================

export default function TechniquePracticeScreen() {
  const state = useTechniquePractice();

  // Technique not found
  if (!state.metadata) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Technique not found: {state.techniqueId}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TechniqueHeader metadata={state.metadata} onBack={state.handleBack} />

      {/* Step progress dots (demo mode) */}
      {state.mode === 'demo' && state.puzzleState && (
        <StepIndicator stepCount={state.puzzleState.steps.length} currentStep={state.currentStep} />
      )}

      {/* Phase indicator (find-it elimination mode) */}
      {state.mode === 'find-it' && state.isElimination && !state.validationResult && (
        <View style={styles.phaseIndicator}>
          <View style={[styles.phaseDot, state.findPhase === 'pattern' && styles.phaseDotActive]} />
          <Text style={[styles.phaseLabel, state.findPhase === 'pattern' && styles.phaseLabelActive]}>
            pattern
          </Text>
          <Feather name="chevron-right" size={14} color={colors.textLight} />
          <View style={[styles.phaseDot, state.findPhase === 'elimination' && styles.phaseDotActiveSecondary]} />
          <Text style={[styles.phaseLabel, state.findPhase === 'elimination' && styles.phaseLabelActive]}>
            eliminations
          </Text>
        </View>
      )}

      {/* Loading state */}
      {state.mode === 'loading' && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={colors.softOrange} />
          <Text style={styles.loadingText}>generating puzzle...</Text>
        </View>
      )}

      {/* Error state */}
      {state.mode === 'error' && (
        <View style={styles.centeredContent}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{state.generationError}</Text>
          <View style={styles.bottomActions}>
            <AppButton onPress={state.generatePuzzle} label="try again" />
          </View>
        </View>
      )}

      {/* Locked state (premium required) */}
      {state.mode === 'locked' && (
        <TechniqueIntro
          metadata={state.metadata}
          comingSoon={false}
          onStart={async () => {
            trackPaywallOpened('technique_detail');
            await presentPaywall();
          }}
          onBack={state.handleBack}
        />
      )}

      {/* Intro / Coming-soon */}
      {(state.mode === 'intro' || state.mode === 'coming-soon') && (
        <TechniqueIntro
          metadata={state.metadata}
          comingSoon={state.mode === 'coming-soon'}
          onStart={state.handleStartDemo}
          onBack={state.handleBack}
        />
      )}

      {/* Demo mode */}
      {state.mode === 'demo' && state.puzzleState && (
        <TechniqueDemoView
          puzzleState={state.puzzleState}
          currentStep={state.currentStep}
          mochiMessage={state.mochiMessage}
          boardHighlightSet={state.boardHighlightSet}
          onNext={state.handleNextStep}
          onPrevious={state.handlePreviousStep}
        />
      )}

      {/* Find-it mode */}
      {state.mode === 'find-it' && state.puzzleState && (
        <TechniqueFindItView
          puzzleState={state.puzzleState}
          mochiMessage={state.mochiMessage}
          isElimination={state.isElimination}
          findPhase={state.findPhase}
          boardHighlightSet={state.boardHighlightSet}
          boardSecondarySet={state.boardSecondarySet}
          validationResult={state.validationResult}
          patternCellCount={state.patternCellCount}
          eliminationCellCount={state.eliminationCellCount}
          selectedCellCount={state.selectedCellCount}
          onCellPress={state.handleCellPress}
          onConfirmPattern={state.handleConfirmPattern}
          onBackToPattern={state.handleBackToPattern}
          onSubmitSelection={state.handleSubmitSelection}
          onTryAgain={state.resetFindState}
          onTryAnother={state.handleTryAnother}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// Styles (screen-level only)
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
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
  bottomActions: {
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
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
});
