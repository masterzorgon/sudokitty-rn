// Technique practice screen - Unified sequence: Overview → Demo → Practice → Complete
// Thin orchestrator: delegates state to useTechniquePractice hook
// and rendering to extracted sub-components.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, useColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme';
import { GAME_LAYOUT } from '../../src/constants/layout';
import { useTechniquePractice } from '../../src/hooks/useTechniquePractice';
import { TechniqueFindItView } from '../../src/components/technique';
import { SequenceHeader } from '../../src/components/ui/StepFlow/SequenceHeader';
import { BoardSlideView } from '../../src/components/ui/StepFlow/BoardSlideView';
import { ShowcasePage } from '../../src/components/ui/ShowcasePage';
import { AppButton } from '../../src/components/ui/AppButton';
import { presentPaywall } from '../../src/lib/revenueCat';
import { trackPaywallOpened } from '../../src/utils/analytics';
import { RewardsPill } from '../../src/components/ui/RewardsPill';
import { getTechniqueReward } from '../../src/constants/techniqueRewards';

import { Image } from 'expo-image';

const MochiTeacherImg = require('../../assets/images/mochi/mochi-teacher.png');
const MochiCelebrationImg = require('../../assets/images/mochi/mochi-stars.png');

const MASCOT_SIZE = 180;

export default function TechniquePracticeScreen() {
  const c = useColors();
  const state = useTechniquePractice();

  if (!state.metadata) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]}>
        <Text style={styles.errorText}>Technique not found: {state.techniqueId}</Text>
      </SafeAreaView>
    );
  }

  const { metadata, phase, sequence } = state;
  const mochiReward = getTechniqueReward(metadata.category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]}>
      <SequenceHeader
        onBack={state.handleBack}
        stepCount={state.puzzleState && phase !== 'loading' && phase !== 'error' && phase !== 'coming-soon' && phase !== 'locked' ? sequence.totalSteps : undefined}
        currentStep={state.puzzleState && phase !== 'loading' && phase !== 'error' && phase !== 'coming-soon' && phase !== 'locked' ? sequence.currentStep : undefined}
      />

      {/* Phase indicator (practice elimination mode) */}
      {phase === 'practice' && state.isElimination && !state.validationResult && (
        <View style={styles.phaseIndicator}>
          <View style={[styles.phaseDot, state.findPhase === 'pattern' && { backgroundColor: c.accent }]} />
          <Text style={[styles.phaseLabel, state.findPhase === 'pattern' && styles.phaseLabelActive]}>
            pattern
          </Text>
          <Feather name="chevron-right" size={14} color={colors.textLight} />
          <View style={[styles.phaseDot, state.findPhase === 'elimination' && { backgroundColor: c.accentSecondary }]} />
          <Text style={[styles.phaseLabel, state.findPhase === 'elimination' && styles.phaseLabelActive]}>
            eliminations
          </Text>
        </View>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={styles.loadingText}>generating puzzle...</Text>
        </View>
      )}

      {/* Error */}
      {phase === 'error' && (
        <View style={styles.centeredContent}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{state.generationError}</Text>
          <View style={styles.bottomActions}>
            <AppButton onPress={state.generatePuzzle} label="try again" />
          </View>
        </View>
      )}

      {/* Coming soon */}
      {phase === 'coming-soon' && (
        <ShowcasePage
          heading={metadata.name}
          badge={{ label: metadata.category, color: metadata.color }}
          mascotImage={<Image source={MochiTeacherImg} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />}
          bodyText={metadata.longDescription}
          action={{ label: 'back to techniques', onPress: state.handleBack, icon: 'arrow-left', iconPosition: 'left' }}
          rewardPill={<RewardsPill mochis={mochiReward} size="large" />}
        />
      )}

      {/* Locked */}
      {phase === 'locked' && (
        <ShowcasePage
          heading={metadata.name}
          badge={{ label: metadata.category, color: metadata.color }}
          mascotImage={<Image source={MochiTeacherImg} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />}
          bodyText={metadata.longDescription}
          action={{
            label: 'unlock',
            onPress: async () => {
              trackPaywallOpened('technique_detail');
              await presentPaywall();
            },
            icon: 'lock',
            iconPosition: 'left',
          }}
          rewardPill={<RewardsPill mochis={mochiReward} size="medium" />}
        />
      )}

      {/* Overview (step 0) */}
      {phase === 'overview' && (
        <ShowcasePage
          heading={metadata.name}
          badge={{ label: metadata.category, color: metadata.color }}
          mascotImage={<Image source={MochiTeacherImg} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />}
          bodyText={metadata.longDescription}
          action={{ label: 'next', onPress: state.handleSequenceNext, icon: 'chevron-right' }}
          rewardPill={<RewardsPill mochis={mochiReward} size="medium" />}
        />
      )}

      {/* Demo (steps 1..N) */}
      {phase === 'demo' && state.puzzleState && (
        <BoardSlideView
          puzzle={state.puzzleState.puzzle}
          highlightCells={state.boardHighlightSet}
          mascotMessage={state.mochiMessage}
          onNext={state.handleSequenceNext}
          onPrevious={state.handleSequencePrevious}
        />
      )}

      {/* Practice (step N+1) */}
      {phase === 'practice' && state.practicePuzzle && (
        <TechniqueFindItView
          puzzleState={state.practicePuzzle}
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
          onBack={state.handleSequencePrevious}
        />
      )}

      {/* Complete (step N+2) */}
      {phase === 'complete' && (
        <ShowcasePage
          heading="congratulations!"
          mascotImage={<Image source={MochiCelebrationImg} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />}
          bodyText={`You've mastered ${metadata.name}! ${metadata.shortDescription}`}
          action={{ label: 'done', onPress: state.handleBack, icon: 'check' }}
          rewardPill={<RewardsPill mochis={mochiReward} label="earned" size="medium" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  phaseLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: 'Pally-Medium',
  },
  phaseLabelActive: {
    color: colors.textPrimary,
  },
});
