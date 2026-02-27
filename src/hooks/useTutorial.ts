import { useSequence } from './useSequence';
import { TUTORIAL_STEPS, type TutorialStep } from '../data/tutorialSteps';

export interface UseTutorialReturn {
  currentStep: TutorialStep;
  currentIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
}

export function useTutorial(onFinish: () => void): UseTutorialReturn {
  const sequence = useSequence({
    totalSteps: TUTORIAL_STEPS.length,
    onComplete: onFinish,
  });

  return {
    currentStep: TUTORIAL_STEPS[sequence.currentStep],
    currentIndex: sequence.currentStep,
    totalSteps: sequence.totalSteps,
    isFirst: sequence.isFirst,
    isLast: sequence.isLast,
    next: sequence.next,
    previous: sequence.previous,
  };
}
