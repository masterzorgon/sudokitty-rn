// Tutorial screen — linear "how to play" flow
// Phases: welcome → slides → complete
// Reuses ShowcasePage, TutorialSlideView, StepIndicator from the technique system

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColors } from '../src/theme/colors';
import { spacing } from '../src/theme';
import { GAME_LAYOUT } from '../src/constants/layout';
import { useTutorial } from '../src/hooks/useTutorial';
import { TutorialSlideView } from '../src/components/tutorial/TutorialSlideView';
import { StepIndicator } from '../src/components/technique/StepIndicator';
import { BackButton } from '../src/components/ui/BackButton';
import { ShowcasePage } from '../src/components/ui/ShowcasePage';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';

import MochiTeacherSvg from '../assets/images/mochi/mochi-teacher.svg';
import MochiCelebrationSvg from '../assets/images/mochi/mochi-celebration.svg';

const MASCOT_SIZE = 180;

export default function TutorialScreen() {
  const router = useRouter();
  const c = useColors();

  const handleFinish = useCallback(() => {
    router.back();
  }, [router]);

  const { currentStep, currentIndex, totalSteps, isFirst, next, previous } =
    useTutorial(handleFinish);

  const highlightSet = useMemo(
    () => new Set<string>(currentStep.highlightCells ?? []),
    [currentStep],
  );

  const handleStartPlaying = useCallback(() => {
    router.replace('/modal' as any);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />

      {/* Header: back button + step dots */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.stepIndicatorContainer}>
          <StepIndicator stepCount={totalSteps} currentStep={currentIndex} />
        </View>
        {/* Spacer to balance back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Welcome */}
      {currentStep.phase === 'welcome' && (
        <ShowcasePage
          heading={currentStep.heading ?? 'how to play'}
          mascotImage={<MochiTeacherSvg width={MASCOT_SIZE} height={MASCOT_SIZE} />}
          bodyText={currentStep.bodyText ?? ''}
          action={{ label: 'let\'s go!', onPress: next, icon: 'chevron-right' }}
        />
      )}

      {/* Slide */}
      {currentStep.phase === 'slide' && currentStep.puzzle && (
        <TutorialSlideView
          puzzle={currentStep.puzzle}
          highlightCells={highlightSet}
          mascotMessage={currentStep.mascotMessage ?? ''}
          isFirst={isFirst}
          onNext={next}
          onPrevious={previous}
        />
      )}

      {/* Complete */}
      {currentStep.phase === 'complete' && (
        <ShowcasePage
          heading={currentStep.heading ?? "you're ready!"}
          mascotImage={<MochiCelebrationSvg width={MASCOT_SIZE} height={MASCOT_SIZE} />}
          bodyText={currentStep.bodyText ?? ''}
          action={{ label: "let's play!", onPress: handleStartPlaying, icon: 'play' }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
    paddingVertical: spacing.sm,
  },
  stepIndicatorContainer: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
});
